// src/core/collection/list-manager/index.ts
import { createCollection, COLLECTION_EVENTS } from '../collection';
import { createRouteAdapter } from '../adapters/route';
import { 
  ListManagerConfig, ListManager, ListManagerElements, 
  PaginationMeta, LoadStatus, ScrollToPosition 
} from './types';
import { validateConfig, determineApiMode, getStaticItems } from './config';
import { createDomElements, updateSpacerHeight, cleanupDomElements } from './dom-elements';
import { createItemMeasurement } from './item-measurement';
import { createRenderer } from './renderer';
import { createScrollTracker } from './scroll-tracker';
import { createRecyclingPool } from './utils/recycling';
import { 
  calculateVisibleRange, 
  isLoadThresholdReached 
} from './utils/visibility';
import { 
  createInitialState, 
  updateStateAfterLoad, 
  updateVisibleItems as updateStateVisibleItems,
  updateTotalHeight, 
  updateLoadingState, 
  resetState, 
  createLoadParams 
} from './state';

// Params types
interface LoadParams {
  page?: number;
  cursor?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

/**
 * Creates a list manager for a specific collection
 * @param {string} collection - Collection name
 * @param {HTMLElement} container - Container element
 * @param {ListManagerConfig} config - Configuration options
 * @returns {ListManager} List manager methods
 */
export const createListManager = (
  collection: string, 
  container: HTMLElement, 
  config: ListManagerConfig
): ListManager => {
  // Add collection name to config
  config.collection = collection;
  
  // Validate and merge configuration
  const validatedConfig = validateConfig(config);
  
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('List manager requires a valid container element');
  }
  
  // Determine API mode and get static items
  const useApi = determineApiMode(validatedConfig);
  const useStatic = !useApi;
  
  // Get initial static items (only if we're in static mode)
  const initialItems = useStatic ? getStaticItems(validatedConfig) : [];
  
  // Initialize state
  const state = createInitialState(validatedConfig);
  state.useStatic = useStatic;
  
  // Create DOM elements
  const elements = createDomElements(container);
  
  // Initialize tools and utilities
  const itemMeasurement = createItemMeasurement(validatedConfig.itemHeight);
  const recyclePool = createRecyclingPool();
  const renderer = createRenderer(validatedConfig, elements, itemMeasurement, recyclePool);
  
  // Initialize collection for data management
  const itemsCollection = createCollection({ 
    transform: validatedConfig.transform,
    initialCapacity: useStatic ? initialItems.length : 50 // Optimize initial capacity
  });
  
  // Initialize route adapter (only if in API mode)
  const adapter = useApi ? createRouteAdapter({
    base: validatedConfig.baseUrl!,
    endpoints: {
      list: `/${collection}`
    },
    headers: {
      'Content-Type': 'application/json'
    },
    cache: true, // Enable caching for API requests
    // Pass the pagination configuration if provided
    pagination: validatedConfig.pagination ? {
      strategy: validatedConfig.pagination.strategy || 'cursor',
      ...validatedConfig.pagination
    } : { strategy: 'cursor' }
  }) : null;
  
  // Track cleanup functions
  const cleanupFunctions: (() => void)[] = [];
  
  /**
   * Load items with cursor pagination or from static data
   * @param {LoadParams} params - Query parameters
   * @returns {Promise<Object>} Response with items and pagination metadata
   */
  const loadItems = async (params: LoadParams = {}): Promise<{items: any[], meta: PaginationMeta}> => {
    try {
      // Update loading state
      Object.assign(state, updateLoadingState(state, true));
      
      // For static data, simulate loading by returning available items
      if (state.useStatic) {
        return {
          items: [...state.items],
          meta: {
            cursor: null,
            hasNext: false // Static data has no "next" page
          }
        };
      }
      
      // For API-connected lists, use the adapter
      if (!adapter) {
        throw new Error('Cannot load items: API adapter not initialized');
      }
      
      // Debug log for parameters being sent to API
      // console.log('Loading items with params:', params, 'Strategy:', state.paginationStrategy);
      
      const response = await adapter.read(params);
      
      // Debug log for response from API
      // console.log('API response:', {
      //   items: response.items?.length,
      //   meta: response.meta
      // });
      
      // Process items
      const items = Array.isArray(response.items) 
        ? response.items.map(validatedConfig.transform!) 
        : [];
      
      // Update state with new items
      Object.assign(state, updateStateAfterLoad(
        state,
        items,
        response.meta,
        validatedConfig.dedupeItems
      ));
      
      // For page-based pagination, don't add to collection if it's page 1 (replace instead)
      if (state.paginationStrategy === 'page' && params.page === 1) {
        // Clear existing collection
        await itemsCollection.clear();
        // Add all items from page 1
        if (items.length > 0) {
          await itemsCollection.add(items);
        }
      } else {
        // Add to collection, skipping items that already exist if deduplication is enabled
        if (validatedConfig.dedupeItems) {
          const existingIds = new Set(state.items.map(item => item.id).filter(Boolean));
          const newItems = items.filter(item => !existingIds.has(item.id));
          if (newItems.length > 0) {
            await itemsCollection.add(newItems);
          }
        } else {
          // Add all items regardless of duplication
          await itemsCollection.add(items);
        }
      }
      
      // Set totalHeight as dirty to trigger recalculation
      state.totalHeightDirty = true;
      
      // Call afterLoad callback if provided
      if (validatedConfig.afterLoad) {
        // Create a read-only copy of the items array to prevent mutation
        const itemsCopy = [...state.items] as any[];
        
        const loadData: LoadStatus = {
          loading: false,
          hasNext: state.hasNext,
          hasPrev: !!params.cursor || (params.page && params.page > 1),
          items: [...items] as any[], // Use type assertion to satisfy the mutable array requirement
          allItems: itemsCopy
        };
        
        validatedConfig.afterLoad(loadData);
      }
      
      // For cursor-based pagination, we need to track cursor
      if (state.paginationStrategy === 'cursor' && response.meta?.cursor) {
        state.cursor = response.meta.cursor;
      } else if (state.paginationStrategy === 'page' && params.page) {
        state.page = params.page;
      }
      
      // Don't update state.items directly - it should be handled by updateStateAfterLoad
      // state.items = [...state.items, ...items] as any[];
      // state.allItems was incorrectly added and doesn't exist in ListManagerState
      
      return {
        items,
        meta: response.meta
      };
    } catch (error) {
      console.error(`Error loading ${collection}:`, error);
      // Return empty result on error
      return {
        items: [],
        meta: {
          cursor: null,
          hasNext: false
        }
      };
    } finally {
      // Reset loading state
      Object.assign(state, updateLoadingState(state, false));
    }
  };
  
  /**
   * Pre-bound update visible items function to avoid recreation
   * @param {number} scrollTop Current scroll position
   */
  const updateVisibleItems = (scrollTop = state.scrollTop): void => {
    if (!state.mounted) return;
    
    // Get current container dimensions if not available
    if (state.containerHeight === 0) {
      state.containerHeight = container.clientHeight;
    }
    
    // Update scroll position
    state.scrollTop = scrollTop;
    
    // Calculate which items should be visible
    const visibleRange = calculateVisibleRange(
      scrollTop,
      state.items,
      state.containerHeight,
      itemMeasurement,
      validatedConfig
    );
    
    // Early return if range hasn't changed
    if (visibleRange.start === state.visibleRange.start && 
        visibleRange.end === state.visibleRange.end) {
      return;
    }
    
    // Update state with new visible range
    Object.assign(state, updateStateVisibleItems(
      state,
      state.items.slice(visibleRange.start, visibleRange.end).filter(Boolean),
      visibleRange
    ));
    
    // Ensure offsets are cached for efficient access
    if (typeof itemMeasurement.calculateOffsets === 'function') {
      itemMeasurement.calculateOffsets(state.items);
    }
    
    // Calculate total height if needed
    if (state.totalHeightDirty) {
      const totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      Object.assign(state, updateTotalHeight(state, totalHeight));
      
      // Update DOM elements with new height
      updateSpacerHeight(elements, totalHeight);
    }
    
    // Render visible items
    renderer.renderVisibleItems(state.items, visibleRange);
    
    // Now measure elements that needed measurement
    const heightsChanged = itemMeasurement.measureMarkedElements(elements.content, state.items);
    
    // Recalculate total height after measurements if needed
    if (heightsChanged) {
      const totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      Object.assign(state, updateTotalHeight(state, totalHeight));
      updateSpacerHeight(elements, totalHeight);
    }
    
    // Check if we need to load more data
    checkLoadMore(scrollTop);
  };
  
  /**
   * Checks if we need to load more data based on scroll position
   * @param {number} scrollTop - Current scroll position
   */
  const checkLoadMore = (scrollTop: number): void => {
    if (state.loading || !state.hasNext) return;
    
    const shouldLoadMore = isLoadThresholdReached(
      scrollTop,
      state.containerHeight,
      state.totalHeight,
      validatedConfig.loadThreshold!
    );
    
    if (shouldLoadMore) {
      loadMore();
    }
  };
  
  /**
   * Loads more items using appropriate pagination strategy
   * @returns {Promise<Object>} Load result
   */
  const loadMore = async (): Promise<{hasNext: boolean, items: any[]}> => {
    if (state.loading || !state.hasNext) {
      return { hasNext: state.hasNext, items: [] };
    }
    
    // If using static data, there are no more items to load
    if (state.useStatic) {
      return { hasNext: false, items: [] };
    }
    
    // Get pagination strategy from configuration
    const paginationStrategy = validatedConfig.pagination?.strategy || 'cursor';
    
    // Store the pagination strategy in state for future use
    state.paginationStrategy = paginationStrategy;
    
    // For page-based pagination, we need to increment the page number
    if (paginationStrategy === 'page') {
      // If we have a numeric cursor, use that to determine the next page
      if (state.cursor && /^\d+$/.test(state.cursor)) {
        state.page = parseInt(state.cursor, 10);
      } 
      // Otherwise increment the current page
      else if (state.page !== undefined) {
        state.page += 1;
      } 
      // If no page set yet, start with page 1
      else {
        state.page = 1;
      }
      
      // console.log(`Loading page ${state.page}`);
    }
    
    // Create load params for pagination
    const loadParams = createLoadParams(state, paginationStrategy);
    
    // Add pageSize/limit regardless of strategy
    if (!loadParams.limit && !loadParams.per_page) {
      if (paginationStrategy === 'page') {
        // For page-based, use perPage parameter
        const perPageParam = validatedConfig.pagination?.perPageParamName || 'per_page';
        loadParams[perPageParam] = validatedConfig.pageSize || 20;
      } else {
        // For other strategies, use limit parameter
        const limitParam = validatedConfig.pagination?.limitParamName || 'limit';
        loadParams[limitParam] = validatedConfig.pageSize || 20;
      }
    }
    
    // Log the params to help with debugging
    // console.log(`Pagination strategy: ${paginationStrategy}, Load params:`, loadParams);
    
    const result = await loadItems(loadParams);
    updateVisibleItems(state.scrollTop);
    
    return {
      hasNext: state.hasNext,
      items: result.items
    };
  };
  
  /**
   * Refresh the list with the latest data
   * @returns {Promise<void>}
   */
  const refresh = async (): Promise<void> => {
    // Reset state
    Object.assign(state, resetState(state, initialItems));
    
    // Clear recycling pools
    recyclePool.clear();
    
    // Clear collection
    itemsCollection.clear();
    
    // For static data, re-add the original items
    if (state.useStatic && initialItems && initialItems.length > 0) {
      state.items = [...initialItems];
      await itemsCollection.add(initialItems);
    } else {
      // Load initial data from API
      await loadItems();
    }
    
    // Update view
    updateVisibleItems(0); // Reset scroll position to top
  };
  
  /**
   * Scroll to a specific item by ID
   * @param {string} itemId - Item ID to scroll to
   * @param {string} position - Position ('start', 'center', 'end')
   */
  const scrollToItem = (itemId: string, position: ScrollToPosition = 'start'): void => {
    // Ensure offsets are cached
    if (typeof itemMeasurement.calculateOffsets === 'function') {
      itemMeasurement.calculateOffsets(state.items);
    }
    
    const offset = itemMeasurement.getItemOffset(state.items, itemId);
    if (offset === -1) return;
    
    let scrollPosition = offset;
    
    // Adjust position based on requested alignment
    if (position === 'center') {
      scrollPosition = offset - (state.containerHeight / 2);
    } else if (position === 'end') {
      const itemIndex = state.items.findIndex(item => item && item.id === itemId);
      if (itemIndex === -1) return;
      
      const itemHeight = itemMeasurement.getItemHeight(state.items[itemIndex]);
      scrollPosition = offset - state.containerHeight + itemHeight;
    }
    
    container.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
  };
  
  /**
   * Initialize the virtual list
   */
  const initialize = (): (() => void) => {  
    // Set mounted flag
    state.mounted = true;
    
    // Set up scroll tracking with callbacks
    const scrollTracker = createScrollTracker(
      container,
      elements,
      validatedConfig,
      {
        onScroll: updateVisibleItems,
        onLoadMore: loadMore
      }
    );
    
    const scrollTrackingCleanup = scrollTracker.setup();
    cleanupFunctions.push(scrollTrackingCleanup);
    
    // Subscribe to collection changes
    const unsubscribe = itemsCollection.subscribe(({ event, data }) => {
      if (event === COLLECTION_EVENTS.CHANGE) {
        // Mark total height as dirty to trigger recalculation
        state.totalHeightDirty = true;
        
        // Use rAF to delay update to next frame for better performance
        requestAnimationFrame(() => {
          updateVisibleItems(state.scrollTop);
        });
      }
    });
    
    cleanupFunctions.push(unsubscribe);
    
    // If using static items, add them to the collection right away
    if (state.useStatic && initialItems && initialItems.length > 0) {
      itemsCollection.add(initialItems)
        .then(() => {
          // Force an update after adding items
          requestAnimationFrame(() => {
            updateVisibleItems(state.scrollTop);
          });
        })
        .catch(err => {
          console.error('Error adding static items to collection:', err);
        });
    } else if (!state.useStatic) {
      // Initial load for API data
      loadItems()
        .then(() => {
          requestAnimationFrame(() => {
            updateVisibleItems(state.scrollTop);
          });
        })
        .catch(err => {
          console.error('Error loading items:', err);
        });
    }
    
    // Handle resize events with ResizeObserver if available
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver((entries) => {
        // Only update if container dimensions changed
        for (const entry of entries) {
          if (entry.target === container) {
            const newHeight = container.clientHeight;
            if (newHeight !== state.containerHeight) {
              state.containerHeight = newHeight;
              
              // Debounce resize handling
              if (state.resizeRAF) {
                cancelAnimationFrame(state.resizeRAF);
              }
              
              state.resizeRAF = requestAnimationFrame(() => {
                updateVisibleItems(state.scrollTop);
                state.resizeRAF = null;
              });
            }
          }
        }
      });
      
      resizeObserver.observe(container);
      
      cleanupFunctions.push(() => {
        resizeObserver.disconnect();
        
        if (state.resizeRAF) {
          cancelAnimationFrame(state.resizeRAF);
          state.resizeRAF = null;
        }
      });
    } else {
      // Fallback to window resize event
      let resizeTimeout: number | null = null;
      
      const handleResize = () => {
        // Debounce resize event
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = window.setTimeout(() => {
          const newHeight = container.clientHeight;
          if (newHeight !== state.containerHeight) {
            state.containerHeight = newHeight;
            updateVisibleItems(state.scrollTop);
          }
          
          resizeTimeout = null;
        }, 100);
      };
      
      // Use 'as any' to bypass TypeScript error with window.addEventListener
      (window as any).addEventListener('resize', handleResize, { passive: true });
      
      cleanupFunctions.push(() => {
        (window as any).removeEventListener('resize', handleResize);
        
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
          resizeTimeout = null;
        }
      });
    }
    
    // Return cleanup function
    return () => {
      // Run all cleanup functions
      cleanupFunctions.forEach(fn => fn());
      cleanupFunctions.length = 0;
      
      // Clear mounted flag
      state.mounted = false;
    };
  };
  
  // Initialize on creation
  const cleanup = initialize();
  
  // Return public API
  return {
    // Data loading methods
    loadItems,
    loadMore,
    refresh,
    
    // View methods
    updateVisibleItems,
    scrollToItem,
    setItemHeights: (heightsMap) => {
      const updated = itemMeasurement.setItemHeights(heightsMap);
      if (updated) {
        state.totalHeightDirty = true;
        updateVisibleItems(state.scrollTop);
      }
      return updated; // Return whether heights were updated
    },
    
    // Collection access
    getCollection: () => itemsCollection,
    
    // State accessors
    getVisibleItems: () => state.visibleItems,
    getAllItems: () => state.items,
    isLoading: () => state.loading,
    hasNextPage: () => state.hasNext,
    isApiMode: () => useApi,
    
    // Hook for external code to affect rendering
    setRenderHook: (hookFn) => {
      renderer.setRenderHook(hookFn);
      // Rerender visible items to apply the hook
      updateVisibleItems(state.scrollTop);
    },
    
    // Cleanup method
    destroy: () => {
      cleanup();
      
      // Clear all data
      itemsCollection.clear();
      
      // Clear cached state
      if (typeof itemMeasurement.clear === 'function') {
        itemMeasurement.clear();
      }
      
      // Empty recycling pools
      recyclePool.clear();
      
      // Clear DOM content
      if (elements.content) {
        elements.content.innerHTML = '';
      }
      
      // Remove DOM elements
      cleanupDomElements(elements);
      
      // Disconnect adapter if exists
      if (adapter && typeof adapter.disconnect === 'function') {
        adapter.disconnect();
      }
    }
  };
};

/**
 * Utility to create a cursor-based page loader
 * @param list List interface
 * @param listManager List manager instance
 * @param config Page loader configuration
 * @returns Page loader interface
 */
export const createPageLoader = (
  list: { setItems: (items: any[]) => void },
  listManager: ReturnType<typeof createListManager>,
  config: { onLoad?: (status: LoadStatus) => void; pageSize?: number } = {}
) => {
  let currentCursor: string | null = null;
  let loading = false;
  const pageHistory: (string | null)[] = [];
  const pageSize = config.pageSize || 20;
  
  // Use a throttle to prevent rapid load calls
  let loadThrottleTimer: number | null = null;
  const throttleMs = 200; // Minimum time between load operations

  const load = async (cursor = null, addToHistory = true) => {
    // Prevent concurrent load operations
    if (loading) return;
    
    // Apply throttling to prevent rapid load operations
    if (loadThrottleTimer !== null) {
      clearTimeout(loadThrottleTimer);
    }
    
    loading = true;
    config.onLoad?.({ 
      loading: true, 
      hasNext: false, 
      hasPrev: pageHistory.length > 0, 
      items: [], 
      allItems: listManager.getAllItems() 
    });

    try {
      const result = await listManager.loadItems({
        limit: pageSize,
        cursor
      });
  
      if (addToHistory && cursor) {
        pageHistory.push(currentCursor);
      }
      currentCursor = result.meta.cursor;
  
      // Update the list with the new items
      list.setItems(result.items);
  
      // Notify about load completion
      config.onLoad?.({
        loading: false,
        hasNext: result.meta.hasNext,
        hasPrev: pageHistory.length > 0,
        items: result.items,
        allItems: listManager.getAllItems()
      });
  
      return {
        hasNext: result.meta.hasNext,
        hasPrev: pageHistory.length > 0
      };
    } finally {
      // Set timer to prevent rapid consecutive loads
      loadThrottleTimer = window.setTimeout(() => {
        loading = false;
        loadThrottleTimer = null;
      }, throttleMs);
    }
  };

  const loadNext = () => load(currentCursor);

  const loadPrev = () => {
    const previousCursor = pageHistory.pop();
    return load(previousCursor, false);
  };

  return {
    load,
    loadNext,
    loadPrev,
    get loading() { return loading },
    get cursor() { return currentCursor }
  };
};

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
};

// Re-export types
export * from './types';