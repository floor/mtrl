// src/core/collection/list-manager.js

import { createRouteAdapter } from './adapters/route'

/**
 * Creates a list manager for a specific collection
 * @param {string} collection - Collection name
 * @param {Object} config - Configuration options
 * @param {Function} config.transform - Transform function for items
 * @param {string} config.baseUrl - Base API URL
 * @returns {Object} List manager methods
 */
export const createListManager = (collection, config = {}) => {
  const {
    transform = (item) => item,
    baseUrl = 'http://localhost:4000/api'
  } = config

  // Initialize route adapter
  const adapter = createRouteAdapter({
    base: baseUrl,
    endpoints: {
      list: `/${collection}`
    },
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Load items with cursor pagination
  const loadItems = async (params = {}) => {
    try {
      const response = await adapter.read(params)

      return {
        items: response.items.map(transform),
        meta: response.meta
      }
    } catch (error) {
      console.error(`Error loading ${collection}:`, error)
      return {
        items: [],
        meta: {
          cursor: null,
          hasNext: false
        }
      }
    }
  }

  // Utility to create a cursor-based page loader
  const createPageLoader = (list, { onLoad, pageSize = 20 } = {}) => {
    let currentCursor = null
    let loading = false
    const pageHistory = []

    const load = async (cursor = null, addToHistory = true) => {
      if (loading) return

      loading = true
      onLoad?.({ loading: true })

      const { items, meta } = await loadItems({
        limit: pageSize,
        cursor
      })

      if (addToHistory && cursor) {
        pageHistory.push(currentCursor)
      }
      currentCursor = meta.cursor

      list.setItems(items)
      loading = false

      onLoad?.({
        loading: false,
        hasNext: meta.hasNext,
        hasPrev: pageHistory.length > 0,
        items
      })

      return {
        hasNext: meta.hasNext,
        hasPrev: pageHistory.length > 0
      }
    }

    const loadNext = () => load(currentCursor)

    const loadPrev = () => {
      const previousCursor = pageHistory.pop()
      return load(previousCursor, false)
    }

    return {
      load,
      loadNext,
      loadPrev,
      get loading () { return loading },
      get cursor () { return currentCursor }
    }
  }

  return {
    loadItems,
    createPageLoader
  }
}

/**
 * Transform functions for common collections
 */
export const transforms = {
  track: (track) => ({
    id: track._id,
    headline: track.title || 'Untitled',
    supportingText: track.artist || 'Unknown Artist',
    meta: track.year?.toString() || ''
  }),

  playlist: (playlist) => ({
    id: playlist._id,
    headline: playlist.name || 'Untitled Playlist',
    supportingText: `${playlist.tracks?.length || 0} tracks`,
    meta: playlist.creator || ''
  }),

  country: (country) => ({
    id: country._id,
    headline: country.name || country.code,
    supportingText: country.continent || '',
    meta: country.code || ''
  })
}

/**
 * Usage example:
 *
 * const trackManager = createListManager('track', {
 *   transform: transforms.track
 * })
 *
 * const loader = trackManager.createPageLoader(list, {
 *   onLoad: ({ loading, hasNext, items }) => {
 *     updateNavigation({ loading, hasNext })
 *     logEvent(`Loaded ${items.length} tracks`)
 *   }
 * })
 *
 * // Initial load
 * await loader.load()
 *
 * // Navigation
 * nextButton.onclick = () => loader.loadNext()
 * prevButton.onclick = () => loader.loadPrev()
 */
