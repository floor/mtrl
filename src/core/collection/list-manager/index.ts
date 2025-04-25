// src/core/collection/list-manager/index.ts
import { Collection, COLLECTION_EVENTS } from '../collection';
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
  const initialItems = getStaticItems(validatedConfig);
  
  // console.log('Mode determination:', {
  //   baseUrl: validatedConfig.baseUrl,
  //   useApi,
  //   useStatic
  // });
  
  // Initialize state
  const state = createInitialState(validatedConfig);
  
  // Create DOM elements
  const elements = createDomElements(container);
  
  // Initialize tools and utilities
  const itemMeasurement = createItemMeasurement(validatedConfig.itemHeight);
  const recyclePool = createRecyclingPool();
  const renderer = createRenderer(validatedConfig, elements, itemMeasurement, recyclePool);
  
  // Initialize collection for data management
  const itemsCollection = new Collection({ transform: validatedConfig.transform });
  
  // Initialize route adapter (only if in API mode)
  const adapter = useApi ? createRouteAdapter({
    base: validatedConfig.baseUrl!,
    endpoints: {
      list: `/${collection}`
    },
    headers: {
      'Content-Type': 'application/json'
    }
  }) : null;
  
  // console.log('Adapter created:', adapter ? 'yes' : 'no');
  // console.log('Using API mode:', useApi);
  // console.log('Using static items:', useStatic);
  // console.log('Initial items:', initialItems);
  
  // Track cleanup functions
  const cleanupFunctions: (() => void)[] = [];
  
  /**
   * Load items with cursor pagination or from static data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response with items and pagination metadata
   */
  const loadItems = async (params = {}): Promise<{items: any[], meta: PaginationMeta}> => {
    try {
      Object.assign(state, updateLoadingState(state, true));
      
      // For static data, simulate loading by returning available items
      if (state.useStatic) {
        // console.log('Using static data source')
        // console.log('Current static items:', state.items);
        
        // Always return a copy of state.items to ensure proper handling
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
        console.error('Cannot load items: API adapter not initialized')
        throw new Error('Cannot load items: API adapter not initialized');
      }
      
      const response = await adapter.read(params);
      
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
      
      // Add to collection
      await itemsCollection.add(items);
      
      // Set totalHeight as dirty to trigger recalculation
      state.totalHeightDirty = true;
      
      // Call afterLoad callback if provided
      if (validatedConfig.afterLoad) {
        const loadData: LoadStatus = {
          loading: false,
          hasNext: state.hasNext,
          hasPrev: !!params.cursor,
          items: items,
          allItems: state.items
        };
        validatedConfig.afterLoad(loadData);
      }
      
      return {
        items,
        meta: response.meta
      };
    } catch (error) {
      console.error(`Error loading ${collection}:`, error);
      return {
        items: [],
        meta: {
          cursor: null,
          hasNext: false
        }
      };
    } finally {
      Object.assign(state, updateLoadingState(state, false));
    }
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
   * Updates visible items based on scroll position
   * @param {number} scrollTop - Current scroll position
   */
  const updateVisibleItems = (scrollTop = state.scrollTop): void => {
    if (!state.mounted) return;
    
    // Get current container dimensions
    if (state.containerHeight === 0) {
      state.containerHeight = container.clientHeight;
    }
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
   * Loads more items using cursor pagination
   * @returns {Promise<Object>} Load result
   */
  const loadMore = async (): Promise<{hasNext: boolean, items: any[]}> => {
    if (state.loading || !state.hasNext) return { hasNext: state.hasNext, items: [] };
    
    // If using static data, there are no more items to load
    if (state.useStatic) {
      return { hasNext: false, items: [] };
    }
    
    // Create load params for pagination
    const loadParams = createLoadParams(state);
    
    const result = await loadItems(loadParams);
    updateVisibleItems();
    
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
    updateVisibleItems();
  };
  
  /**
   * Scroll to a specific item by ID
   * @param {string} itemId - Item ID to scroll to
   * @param {string} position - Position ('start', 'center', 'end')
   */
  const scrollToItem = (itemId: string, position: ScrollToPosition = 'start'): void => {
    const offset = itemMeasurement.getItemOffset(state.items, itemId);
    if (offset === -1) return;
    
    let scrollPosition = offset;
    
    // Adjust position based on requested alignment
    if (position === 'center') {
      scrollPosition = offset - (state.containerHeight / 2);
    } else if (position === 'end') {
      const itemHeight = itemMeasurement.getItemHeight(
        state.items.find(item => item.id === itemId)
      );
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
        // Wait a tick to allow collection to fully update
        setTimeout(() => {
          // Mark total height as dirty to trigger recalculation
          state.totalHeightDirty = true;
          // Update items on collection change
          updateVisibleItems();
        }, 0);
      }
    });
    
    cleanupFunctions.push(unsubscribe);
    
    // If using static items, add them to the collection right away
    if (state.useStatic && initialItems && initialItems.length > 0) {
      itemsCollection.add(initialItems)
        .then(() => {
          // Force an update after adding items
          setTimeout(() => {
            updateVisibleItems();
          }, 10);
        })
        .catch(err => {
          console.error('Error adding static items to collection:', err);
        });
    } else {
      // Initial load for API data
      loadItems()
        .then((result) => {
          updateVisibleItems();
        })
        .catch(err => {
          console.error('Error loading items:', err);
        });
    }
    
    // Handle resize events with ResizeObserver if available
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        // Only update if container dimensions changed
        const newHeight = container.clientHeight;
        if (newHeight !== state.containerHeight) {
          state.containerHeight = newHeight;
          updateVisibleItems();
        }
      });
      
      resizeObserver.observe(container);
      
      cleanupFunctions.push(() => {
        resizeObserver.disconnect();
      });
    } else {
      // Fallback to window resize event
      const handleResize = () => {
        const newHeight = container.clientHeight;
        if (newHeight !== state.containerHeight) {
          state.containerHeight = newHeight;
          updateVisibleItems();
        }
      };
      
      window.addEventListener('resize', handleResize);
      cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));
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
        updateVisibleItems();
      }
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
      updateVisibleItems();
    },
    
    // Cleanup method
    destroy: () => {
      cleanup();
      
      // Clear all data
      itemsCollection.clear();
      elements.content.innerHTML = '';
      
      // Empty recycling pools
      recyclePool.clear();
      
      // Remove DOM elements
      cleanupDomElements(elements);
    }
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