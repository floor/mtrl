// src/core/collection/collection.js

/**
 * Event types for collection changes
 */
export const COLLECTION_EVENTS = {
  CHANGE: 'change',
  ADD: 'add',
  UPDATE: 'update',
  REMOVE: 'remove',
  ERROR: 'error',
  LOADING: 'loading'
}

/**
 * Query operators for filtering
 */
export const OPERATORS = {
  EQ: 'eq',
  NE: 'ne',
  GT: 'gt',
  GTE: 'gte',
  LT: 'lt',
  LTE: 'lte',
  IN: 'in',
  NIN: 'nin',
  CONTAINS: 'contains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith'
}

/**
 * Base Collection class providing data management interface
 * @template T - Type of items in collection
 */
export class Collection {
  #items = new Map()
  #observers = new Set()
  #query = null
  #sort = null
  #loading = false
  #error = null

  /**
   * Creates a new collection instance
   * @param {Object} config - Collection configuration
   * @param {Function} config.transform - Transform function for items
   * @param {Function} config.validate - Validation function for items
   */
  constructor (config = {}) {
    this.transform = config.transform || (item => item)
    this.validate = config.validate || (() => true)
  }

  /**
   * Subscribe to collection changes
   * @param {Function} observer - Observer callback
   * @returns {Function} Unsubscribe function
   */
  subscribe (observer) {
    this.#observers.add(observer)
    return () => this.#observers.delete(observer)
  }

  /**
   * Notify observers of collection changes
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  #notify (event, data) {
    this.#observers.forEach(observer => observer({ event, data }))
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  #setLoading (loading) {
    this.#loading = loading
    this.#notify(COLLECTION_EVENTS.LOADING, loading)
  }

  /**
   * Set error state
   * @param {Error} error - Error object
   */
  #setError (error) {
    this.#error = error
    this.#notify(COLLECTION_EVENTS.ERROR, error)
  }

  /**
   * Get collection items based on current query and sort
   * @returns {Array<T>} Collection items
   */
  get items () {
    let result = Array.from(this.#items.values())

    if (this.#query) {
      result = result.filter(this.#query)
    }

    if (this.#sort) {
      result.sort(this.#sort)
    }

    return result
  }

  /**
   * Get collection size
   * @returns {number} Number of items
   */
  get size () {
    return this.#items.size
  }

  /**
   * Get loading state
   * @returns {boolean} Loading state
   */
  get loading () {
    return this.#loading
  }

  /**
   * Get error state
   * @returns {Error|null} Error object
   */
  get error () {
    return this.#error
  }

  /**
   * Set query filter
   * @param {Function} queryFn - Query function
   */
  query (queryFn) {
    this.#query = queryFn
    this.#notify(COLLECTION_EVENTS.CHANGE, this.items)
  }

  /**
   * Set sort function
   * @param {Function} sortFn - Sort function
   */
  sort (sortFn) {
    this.#sort = sortFn
    this.#notify(COLLECTION_EVENTS.CHANGE, this.items)
  }

  /**
   * Add items to collection
   * @param {T|Array<T>} items - Items to add
   * @returns {Promise<Array<T>>} Added items
   */
  async add (items) {
    try {
      this.#setLoading(true)
      const toAdd = Array.isArray(items) ? items : [items]

      const validated = toAdd.filter(this.validate)
      const transformed = validated.map(this.transform)

      transformed.forEach(item => {
        if (!item.id) {
          throw new Error('Items must have an id property')
        }
        this.#items.set(item.id, item)
      })

      this.#notify(COLLECTION_EVENTS.ADD, transformed)
      this.#notify(COLLECTION_EVENTS.CHANGE, this.items)

      return transformed
    } catch (error) {
      this.#setError(error)
      throw error
    } finally {
      this.#setLoading(false)
    }
  }

  /**
   * Update items in collection
   * @param {T|Array<T>} items - Items to update
   * @returns {Promise<Array<T>>} Updated items
   */
  async update (items) {
    try {
      this.#setLoading(true)
      const toUpdate = Array.isArray(items) ? items : [items]

      const updated = toUpdate.map(item => {
        if (!this.#items.has(item.id)) {
          throw new Error(`Item with id ${item.id} not found`)
        }

        const validated = this.validate(item)
        if (!validated) {
          throw new Error(`Invalid item: ${item.id}`)
        }

        const transformed = this.transform(item)
        this.#items.set(item.id, transformed)
        return transformed
      })

      this.#notify(COLLECTION_EVENTS.UPDATE, updated)
      this.#notify(COLLECTION_EVENTS.CHANGE, this.items)

      return updated
    } catch (error) {
      this.#setError(error)
      throw error
    } finally {
      this.#setLoading(false)
    }
  }

  /**
   * Remove items from collection
   * @param {string|Array<string>} ids - Item IDs to remove
   * @returns {Promise<Array<string>>} Removed item IDs
   */
  async remove (ids) {
    try {
      this.#setLoading(true)
      const toRemove = Array.isArray(ids) ? ids : [ids]

      toRemove.forEach(id => {
        if (!this.#items.has(id)) {
          throw new Error(`Item with id ${id} not found`)
        }
        this.#items.delete(id)
      })

      this.#notify(COLLECTION_EVENTS.REMOVE, toRemove)
      this.#notify(COLLECTION_EVENTS.CHANGE, this.items)

      return toRemove
    } catch (error) {
      this.#setError(error)
      throw error
    } finally {
      this.#setLoading(false)
    }
  }

  /**
   * Clear all items from collection
   */
  clear () {
    this.#items.clear()
    this.#query = null
    this.#sort = null
    this.#notify(COLLECTION_EVENTS.CHANGE, this.items)
  }
}
