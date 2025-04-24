// src/core/collection/adapters/route.js

import { OPERATORS, createBaseAdapter } from './base'

const QUERY_PARAMS = {
  [OPERATORS.EQ]: 'eq',
  [OPERATORS.NE]: 'ne',
  [OPERATORS.GT]: 'gt',
  [OPERATORS.GTE]: 'gte',
  [OPERATORS.LT]: 'lt',
  [OPERATORS.LTE]: 'lte',
  [OPERATORS.IN]: 'in',
  [OPERATORS.NIN]: 'nin',
  [OPERATORS.CONTAINS]: 'contains',
  [OPERATORS.STARTS_WITH]: 'startsWith',
  [OPERATORS.ENDS_WITH]: 'endsWith'
}

export const createRouteAdapter = (config = {}) => {
  const base = createBaseAdapter(config)
  let controller = null
  const cache = new Map()
  const urlCache = new Map();

  const buildUrl = (endpoint, params = {}) => {
    const cacheKey = endpoint + JSON.stringify(params);
    
    if (urlCache.has(cacheKey)) {
      return urlCache.get(cacheKey);
    }
    
    const url = new URL(config.base + endpoint);
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else if (value !== null && value !== undefined) {
        url.searchParams.append(key, value);
      }
    });
    
    const urlString = url.toString();
    urlCache.set(cacheKey, urlString);
    return urlString;
  }

  const transformQuery = (query) => {
    const params = {}
    Object.entries(query).forEach(([field, conditions]) => {
      if (typeof conditions === 'object') {
        Object.entries(conditions).forEach(([op, value]) => {
          const paramKey = QUERY_PARAMS[op]
          if (paramKey) {
            params[`${field}_${paramKey}`] = value
          }
        })
      } else {
        params[field] = conditions
      }
    })
    return params
  }

  const request = async (url, options = {}) => {
    if (controller) {
      controller.abort()
    }
    controller = new AbortController()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
          ...options.headers
        },
        signal: controller.signal
      })

      if (!response.ok) {
        const error = await response.json()
        return base.handleError(new Error(error.message || 'API request failed'))
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'AbortError') return null
      return base.handleError(error)
    } finally {
      controller = null
    }
  }

  const getCache = (key) => {
    if (!config.cache) return null

    const cached = cache.get(key)
    if (!cached) return null

    const { data, timestamp } = cached
    const now = Date.now()

    if (now - timestamp > 5 * 60 * 1000) {
      cache.delete(key)
      return null
    }

    return data
  }

  const setCache = (key, data) => {
    if (!config.cache) return
    cache.set(key, { data, timestamp: Date.now() })
  }

  return {
    ...base,

    create: async (items) => {
      const url = buildUrl(config.endpoints.create)
      const response = await request(url, {
        method: 'POST',
        body: JSON.stringify({ items })
      })
      return response.items
    },

    read: async (query = {}, options = {}) => {
      const {
        page = 1,
        limit = 20,
        sort,
        fields
      } = options

      const params = {
        ...transformQuery(query),
        page,
        limit,
        sort,
        fields
      }

      const url = buildUrl(config.endpoints.list, params)
      const cacheKey = url.toString()

      const cached = getCache(cacheKey)
      if (cached) return cached

      const response = await request(url)
      setCache(cacheKey, response.items)

      return response.items
    },

    update: async (items) => {
      const url = buildUrl(config.endpoints.update)
      const response = await request(url, {
        method: 'PUT',
        body: JSON.stringify({ items })
      })
      return response.items
    },

    delete: async (ids) => {
      const url = buildUrl(config.endpoints.delete)
      const response = await request(url, {
        method: 'DELETE',
        body: JSON.stringify({ ids })
      })
      return response.ids
    },

    query: async (query = {}, options = {}) => {
      const {
        page = 1,
        limit = 20,
        sort,
        fields,
        ...rest
      } = options

      const params = {
        ...transformQuery(query),
        ...rest,
        page,
        limit,
        sort,
        fields
      }

      const url = buildUrl(config.endpoints.list, params)
      const response = await request(url)

      return {
        items: response.items,
        total: response.total,
        page: response.page,
        pages: response.pages
      }
    },

    disconnect: () => {
      if (controller) {
        controller.abort()
        controller = null
      }
      cache.clear()
    }
  }
}
