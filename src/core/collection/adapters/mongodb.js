// src/core/collection/adapters/mongodb.js

import { MongoClient, ObjectId } from 'mongodb'
import { OPERATORS, createBaseAdapter } from './base'

const MONGODB_OPERATORS = {
  [OPERATORS.EQ]: '$eq',
  [OPERATORS.NE]: '$ne',
  [OPERATORS.GT]: '$gt',
  [OPERATORS.GTE]: '$gte',
  [OPERATORS.LT]: '$lt',
  [OPERATORS.LTE]: '$lte',
  [OPERATORS.IN]: '$in',
  [OPERATORS.NIN]: '$nin',
  [OPERATORS.CONTAINS]: '$regex',
  [OPERATORS.STARTS_WITH]: '$regex',
  [OPERATORS.ENDS_WITH]: '$regex'
}

export const createMongoAdapter = (config = {}) => {
  const base = createBaseAdapter(config)
  let client = null
  let db = null
  let collection = null

  const transformDocument = (doc) => {
    if (!doc) return null
    const { _id, ...rest } = doc
    return { id: _id.toString(), ...rest }
  }

  const transformForMongo = (doc) => {
    if (!doc) return null
    const { id, ...rest } = doc
    return { _id: id ? new ObjectId(id) : new ObjectId(), ...rest }
  }

  const transformQuery = (query) => {
    const transformed = {}

    Object.entries(query).forEach(([field, conditions]) => {
      if (typeof conditions === 'object') {
        transformed[field] = Object.entries(conditions).reduce((acc, [op, value]) => {
          const mongoOp = MONGODB_OPERATORS[op]
          if (!mongoOp) return acc

          if (op === OPERATORS.CONTAINS) {
            acc[mongoOp] = new RegExp(value, 'i')
          } else if (op === OPERATORS.STARTS_WITH) {
            acc[mongoOp] = new RegExp(`^${value}`, 'i')
          } else if (op === OPERATORS.ENDS_WITH) {
            acc[mongoOp] = new RegExp(`${value}$`, 'i')
          } else {
            acc[mongoOp] = value
          }

          return acc
        }, {})
      } else {
        transformed[field] = conditions
      }
    })

    return transformed
  }

  return {
    ...base,

    connect: async () => {
      try {
        client = new MongoClient(config.uri, {
          useUnifiedTopology: true,
          maxPoolSize: 10,
          ...config.options
        })

        await client.connect()
        db = client.db(config.dbName)
        collection = db.collection(config.collection)

        // Optional: Create indexes
        // await collection.createIndex({ field: 1 })
      } catch (error) {
        return base.handleError(new Error(`MongoDB connection failed: ${error.message}`))
      }
    },

    disconnect: async () => {
      if (client) {
        await client.close()
        client = null
        db = null
        collection = null
      }
    },

    create: async (items) => {
      if (!collection) {
        return base.handleError(new Error('Not connected to MongoDB'))
      }

      const docs = items.map(item => transformForMongo(item))
      const result = await collection.insertMany(docs)

      return items.map((item, index) => ({
        ...item,
        id: result.insertedIds[index].toString()
      }))
    },

    read: async (query = {}, options = {}) => {
      if (!collection) {
        return base.handleError(new Error('Not connected to MongoDB'))
      }

      const {
        skip = 0,
        limit = 0,
        sort = {},
        projection = {}
      } = options

      const mongoQuery = transformQuery(query)

      const cursor = collection
        .find(mongoQuery)
        .skip(skip)
        .limit(limit)
        .project(projection)
        .sort(sort)

      const docs = await cursor.toArray()
      return docs.map(doc => transformDocument(doc))
    },

    update: async (items) => {
      if (!collection) {
        return base.handleError(new Error('Not connected to MongoDB'))
      }

      const operations = items.map(item => ({
        updateOne: {
          filter: { _id: new ObjectId(item.id) },
          update: { $set: transformForMongo(item) },
          upsert: false
        }
      }))

      await collection.bulkWrite(operations)
      return items
    },

    delete: async (ids) => {
      if (!collection) {
        return base.handleError(new Error('Not connected to MongoDB'))
      }

      const mongoIds = ids.map(id => new ObjectId(id))
      await collection.deleteMany({ _id: { $in: mongoIds } })
      return ids
    },

    query: async (query = {}, options = {}) => {
      if (!collection) {
        return base.handleError(new Error('Not connected to MongoDB'))
      }

      const {
        pipeline = [],
        skip = 0,
        limit = 0
      } = options

      const mongoQuery = transformQuery(query)

      const aggregation = [
        { $match: mongoQuery },
        ...pipeline
      ]

      if (skip > 0) {
        aggregation.push({ $skip: skip })
      }

      if (limit > 0) {
        aggregation.push({ $limit: limit })
      }

      const docs = await collection.aggregate(aggregation).toArray()

      return {
        results: docs.map(doc => transformDocument(doc)),
        total: await collection.countDocuments(mongoQuery)
      }
    },

    watch: (callback, pipeline = []) => {
      if (!collection) {
        return base.handleError(new Error('Not connected to MongoDB'))
      }

      const changeStream = collection.watch(pipeline, {
        fullDocument: 'updateLookup'
      })

      changeStream.on('change', async (change) => {
        const { operationType, documentKey, fullDocument } = change

        switch (operationType) {
          case 'insert':
          case 'update':
          case 'replace':
            callback({
              type: operationType,
              document: transformDocument(fullDocument)
            })
            break

          case 'delete':
            callback({
              type: operationType,
              documentId: documentKey._id.toString()
            })
            break
        }
      })

      return () => changeStream.close()
    }
  }
}
