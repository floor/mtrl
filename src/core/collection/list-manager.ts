// src/core/collection/list-manager.ts

// Key fix: Modified how static items are handled in the loadItems function

import { createRouteAdapter } from './adapters/route';
import { Collection, COLLECTION_EVENTS } from './collection';
// import { normalizeBaseUrl } from '../utils/url'

/**
 * Default configuration for list manager
 */
const DEFAULT_CONFIG = {
  // Rendering options
  renderBufferSize: 5,   // Extra items to render above/below viewport
  overscanCount: 3,      // Extra items to keep in DOM but invisible
  itemHeight: 48,        // Default height for items in pixels
  measureItemsInitially: true, // Whether to measure initial items
  
  // Data loading options
  pageSize: 20,          // Number of items per page
  loadThreshold: 0.8,    // Load more when scrolled past this fraction
  
  // Performance options
  throttleMs: 16,        // Throttle scroll event (ms)
  dedupeItems: true,     // Remove duplicate items based on ID
  
  // Scroll detection strategy
  scrollStrategy: 'scroll' // 'scroll', 'intersection', or 'hybrid'
};

/**
 * Configuration for list manager
 */
export interface ListManagerConfig {
  transform?: (item: any) => any;
  baseUrl?: string | null;
  renderItem: (item: any, index: number, recycledElement?: HTMLElement) => HTMLElement;
  afterLoad?: (result: LoadStatus) => void;
  staticItems?: any[] | null;
  renderBufferSize?: number;
  overscanCount?: number;
  itemHeight?: number;
  measureItemsInitially?: boolean;
  pageSize?: number;
  loadThreshold?: number;
  throttleMs?: number;
  dedupeItems?: boolean;
  scrollStrategy?: 'scroll' | 'intersection' | 'hybrid';
  items?: any[]; // For backward compatibility
}

/**
 * List manager interface
 */
export interface ListManager {
  loadItems: (params?: any) => Promise<{items: any[], meta: PaginationMeta}>;
  loadMore: () => Promise<{hasNext: boolean, items: any[]}>;
  refresh: () => Promise<void>;
  updateVisibleItems: (scrollTop?: number) => void;
  scrollToItem: (itemId: string, position?: 'start' | 'center' | 'end') => void;
  setItemHeights: (heightsMap: Record<string, number>) => void;
  getCollection: () => Collection<any>;
  getVisibleItems: () => any[];
  getAllItems: () => any[];
  isLoading: () => boolean;
  hasNextPage: () => boolean;
  isApiMode: () => boolean;
  setRenderHook?: (hookFn: (item: any, element: HTMLElement) => void) => void;
  destroy: () => void;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  cursor: string | null;
  hasNext: boolean;
  total?: number;
}

/**
 * Load operation status
 */
export interface LoadStatus {
  loading: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  items: any[];
  allItems: any[];
}

/**
 * List interface
 */
export interface List {
  component: HTMLElement;
  items: any[];
  setItems: (items: any[]) => void;
}

/**
 * Page loader configuration
 */
export interface PageLoaderConfig {
  onLoad?: (status: LoadStatus) => void;
  pageSize?: number;
}

/**
 * Page loader interface
 */
export interface PageLoader {
  load: (cursor?: string | null, addToHistory?: boolean) => Promise<{hasNext: boolean, hasPrev: boolean}>;
  loadNext: () => Promise<{hasNext: boolean, hasPrev: boolean}>;
  loadPrev: () => Promise<{hasNext: boolean, hasPrev: boolean}>;
  loading: boolean;
  cursor: string | null;
}

/**
 * Item interface
 */
export interface ListItem {
  id: string;
  headline: string;
  supportingText: string;
  meta: string;
}

/**
 * Creates a list manager for a specific collection
 * @param {string} collection - Collection name
 * @param {HTMLElement} container - Container element
 * @param {ListManagerConfig} config - Configuration options
 * @returns {ListManager} List manager methods
 */
export const createListManager = (collection: string, container: HTMLElement, config: ListManagerConfig): ListManager => {
  // Merge configuration with defaults
  const {
    transform = (item) => item,
    baseUrl = null,
    renderItem,
    afterLoad,
    staticItems = null,
    scrollStrategy = 'scroll',
    ...listConfig
  } = { ...DEFAULT_CONFIG, ...config } as ListManagerConfig;
  
  if (!container || !(container instanceof HTMLElement)) {
    throw new Error('List manager requires a valid container element');
  }
  
  if (!renderItem || typeof renderItem !== 'function') {
    throw new Error('List manager requires a renderItem function');
  }
  
  // Determine mode based on baseUrl presence
  const useApi = baseUrl !== null;
  const useStatic = !useApi;
  
  // Get initial static items from either staticItems or items property for backward compatibility
  const initialItems = staticItems || config.items || [];
  
  console.log('Mode determination:', {
    baseUrl,
    useApi,
    useStatic
  });
  
  // Initialize state
  const state = {
    items: useStatic && initialItems ? [...initialItems] : [],
    visibleItems: [],
    visibleRange: { start: 0, end: 0 },
    totalHeight: 0,
    totalHeightDirty: true,
    itemHeights: new Map<string, number>(),
    loading: false,
    cursor: null as string | null,
    hasNext: useApi, // If using API, assume there might be data to load
    itemElements: new Map<string, HTMLElement>(),
    scrollTop: 0,
    containerHeight: 0,
    scrollRAF: null as number | null,
    mounted: false,
    itemCount: useStatic && initialItems ? initialItems.length : 0,
    useStatic: useStatic,
    renderHook: null as ((item: any, element: HTMLElement) => void) | null
  };
  
  // Initialize collection for data management
  const itemsCollection = new Collection({ transform });
  
  // Track observers and cleanup functions
  const cleanupFunctions: (() => void)[] = [];
  let intersectionObserver: IntersectionObserver | null = null;
  let scrollHandler: ((e: Event) => void) | null = null;
  
  console.log('createListManager called for collection:', collection);
  console.log('Config:', config);
  console.log('Initial items:', initialItems);

  // Initialize route adapter (only if in API mode)
  const adapter = useApi ? createRouteAdapter({
    base: baseUrl!,
    endpoints: {
      list: `/${collection}`
    },
    headers: {
      'Content-Type': 'application/json'
    }
  }) : null;
  
  console.log('Adapter created:', adapter ? 'yes' : 'no');
  console.log('Using API mode:', useApi);
  console.log('Using static items:', state.useStatic);

  // Create element recycling pool for better performance
  const recyclePool: Map<string, HTMLElement[]> = new Map();
  
  // Get recycled element of appropriate type
  const getRecycledElement = (item: any): HTMLElement | null => {
    // Get type info from item or use 'default'
    const itemType = item.type || 'default';
    
    if (!recyclePool.has(itemType)) {
      recyclePool.set(itemType, []);
      return null;
    }
    
    const pool = recyclePool.get(itemType)!;
    return pool.length > 0 ? pool.pop()! : null;
  };
  
  // Add element to recycle pool
  const recycleElement = (element: HTMLElement, forceRecycle = false): void => {
    if (!element) return;
    
    // Check if recycling is appropriate (not always needed for simple items)
    if (!forceRecycle && element.innerHTML.length < 100) return;
    
    // Get type from data attribute or use default
    const itemType = element.dataset.itemType || 'default';
    
    if (!recyclePool.has(itemType)) {
      recyclePool.set(itemType, []);
    }
    
    // Basic cleanup - move offscreen
    element.style.display = 'none';
    element.style.top = '-9999px';
    
    // Add to appropriate pool
    recyclePool.get(itemType)!.push(element);
  };
  
  // Initialize DOM elements
  const elements = {
    // Outer wrapper with scroll
    container,
    
    // Inner container with variable height
    content: document.createElement('div'),
    
    // Spacer for determining scroll height
    spacer: document.createElement('div')
  };
  
  // Set up container styles if needed
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  
  // Set up content container
  elements.content.style.position = 'relative';
  elements.content.style.width = '100%';
  elements.content.style.willChange = 'transform';
  
  // Set up spacer element
  elements.spacer.style.position = 'absolute';
  elements.spacer.style.top = '0';
  elements.spacer.style.left = '0';
  elements.spacer.style.width = '1px';
  elements.spacer.style.visibility = 'hidden';
  elements.spacer.style.pointerEvents = 'none';
  
  // Add elements to container
  container.appendChild(elements.content);
  container.appendChild(elements.spacer);
  
  // Set up sentinels for intersection observer if needed
  let topSentinel: HTMLElement | null = null;
  let bottomSentinel: HTMLElement | null = null;
  
  /**
   * Creates a wrapped renderItem function that can apply hooks and optimizations
   * @param item - Item to render
   * @param index - Index in the list
   * @returns Rendered DOM element
   */
  const wrappedRenderItem = (item: any, index: number): HTMLElement => {
    console.log('Rendering item:', item);
    // Check for recycled element first
    const recycled = getRecycledElement(item);
    
    // Create or recycle the element using user-provided function
    const element = renderItem(item, index, recycled);
    
    if (!element) {
      console.warn('renderItem returned null or undefined for item', item);
      // Create a placeholder element to prevent errors
      const placeholder = document.createElement('div');
      placeholder.style.height = `${listConfig.itemHeight}px`;
      return placeholder;
    }
    
    // Ensure element has a data-id attribute for selection targeting
    if (item.id && !element.hasAttribute('data-id')) {
      element.setAttribute('data-id', item.id);
    }
    
    // Set type for recycling
    if (item.type) {
      element.dataset.itemType = item.type;
    }
    
    // Apply any post-render hooks if available
    if (state.renderHook) {
      state.renderHook(item, element);
    }
    
    return element;
  };
  
  /**
   * Load items with cursor pagination or from static data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response with items and pagination metadata
   */
  const loadItems = async (params = {}): Promise<{items: any[], meta: PaginationMeta}> => {
    try {
      console.log('Loading items with params:', params)
      state.loading = true;
      
      // For static data, simulate loading by returning available items
      if (state.useStatic) {
        console.log('Using static data source')
        console.log('Current static items:', state.items);
        
        // FIX: Always return a copy of state.items to ensure proper handling
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
      
      console.log('Calling adapter.read with params:', params)
      const response = await adapter.read(params);
      console.log('Adapter read response:', response)
      
      // Process items and update state
      const items = Array.isArray(response.items) ? response.items.map(transform) : [];
      console.log('Transformed items:', items)
      
      state.cursor = response.meta?.cursor;
      state.hasNext = !!response.meta?.hasNext;
      
      console.log('Updated state: cursor=', state.cursor, 'hasNext=', state.hasNext)
      
      // Remove duplicates if enabled
      let newItems = items;
      if (listConfig.dedupeItems) {
        const existingIds = new Set(state.items.map(item => item.id));
        newItems = items.filter(item => !existingIds.has(item.id));
      }
      
      // Add to collection and state
      await itemsCollection.add(newItems);
      state.items = [...state.items, ...newItems];
      
      // Update item count if provided
      if (response.meta?.total) {
        state.itemCount = response.meta.total;
      } else {
        state.itemCount = state.items.length + (state.hasNext ? 1 : 0);
      }
      
      // Set totalHeight as dirty to trigger recalculation
      state.totalHeightDirty = true;
      
      // Call afterLoad callback if provided
      if (afterLoad) {
        const loadData = {
          loading: false,
          hasNext: state.hasNext,
          hasPrev: !!params.cursor,
          items: newItems,
          allItems: state.items
        };
        console.log('Calling afterLoad with:', loadData)
        afterLoad(loadData);
      }
      
      return {
        items: newItems,
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
      state.loading = false;
    }
  };
  
  /**
   * Measures the height of an item
   * @param {Object} item - Item to measure
   * @param {HTMLElement} element - Item element
   * @returns {number} Item height in pixels
   */
  const measureItemHeight = (item: any, element: HTMLElement): number => {
    if (!element) return listConfig.itemHeight;
    if (!item) return listConfig.itemHeight;
    
    // Get item ID, handling the transformed structure
    const itemId = item.id || (item.original && item.original.id);
    if (!itemId) return listConfig.itemHeight;
    
    // Get element height
    const height = element.offsetHeight || listConfig.itemHeight;
    
    // Store height for this item
    if (height > 0) {
      state.itemHeights.set(itemId, height);
    }
    
    return height;
  };
  
  /**
   * Gets the height of an item, using cached value if available
   * @param {Object} item - Item to get height for
   * @returns {number} Item height in pixels
   */
  const getItemHeight = (item: any): number => {
    // Handle case when item is undefined
    if (!item) {
      console.warn('Attempted to get height of undefined item');
      return listConfig.itemHeight;
    }
    
    // Get the item ID, which might be directly on the item or in the original property
    const itemId = item.id || (item.original && item.original.id);
    
    if (!itemId) {
      console.warn('Item has no ID', item);
      return listConfig.itemHeight;
    }
    
    // Use cached height if available
    if (state.itemHeights.has(itemId)) {
      return state.itemHeights.get(itemId) || listConfig.itemHeight;
    }
    
    // Default to configured item height
    return listConfig.itemHeight;
  };
  
  /**
   * Calculates total height of all items
   * @returns {number} Total height in pixels
   */
  const calculateTotalHeight = (): number => {
    // Basic sanity check
    if (state.items.length === 0) return 0;
    
    const { itemHeight } = listConfig;
    const itemCount = state.items.length;
    
    // Check if we have measured any heights yet
    if (state.itemHeights.size === 0) {
      // No items measured yet, use default height for all
      return itemCount * itemHeight;
    }
    
    // Fast calculation if all items have the same height
    const uniqueHeights = new Set(state.itemHeights.values());
    if (uniqueHeights.size === 1) {
      // All measured items have the same height
      const measuredHeight = uniqueHeights.values().next().value;
      return itemCount * measuredHeight;
    }
    
    // If we have a mix of measured and unmeasured items
    let totalHeight = 0;
    let measuredCount = 0;
    let unmeasuredCount = 0;
    
    // Sum up heights of all items
    for (const item of state.items) {
      if (state.itemHeights.has(item.id)) {
        totalHeight += state.itemHeights.get(item.id) || itemHeight;
        measuredCount++;
      } else {
        unmeasuredCount++;
      }
    }
    
    // If we haven't measured any items, use default height
    if (measuredCount === 0) {
      return itemCount * itemHeight;
    }
    
    // For unmeasured items, use average of measured items
    const averageHeight = totalHeight / measuredCount;
    return totalHeight + (unmeasuredCount * averageHeight);
  };
  
  /**
   * Optimized visible range calculation for fixed height items
   * Used as a fast path when all items have the same height
   */
  const calculateVisibleRangeOptimized = (scrollTop: number): { start: number; end: number } => {
    const { itemHeight, renderBufferSize, overscanCount } = listConfig;
    const containerHeight = state.containerHeight || container.clientHeight;
    
    // Calculate visible range with simple math
    const startIndex = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = startIndex + visibleCount;
    
    // Add buffer and overscan
    const adjustedStart = Math.max(0, startIndex - renderBufferSize - overscanCount);
    const adjustedEnd = Math.min(state.items.length, endIndex + renderBufferSize + overscanCount);
    
    return { start: adjustedStart, end: adjustedEnd };
  };
  
  /**
   * Determines which items are visible within the viewport
   * @param {number} scrollTop - Current scroll position
   * @returns {Object} Visible range with start and end indices
   */
  const calculateVisibleRange = (scrollTop = state.scrollTop): { start: number; end: number } => {
    const { renderBufferSize, overscanCount } = listConfig;
    const containerHeight = state.containerHeight || container.clientHeight;
    
    // Check if we can use the optimized path for fixed height items
    const uniqueHeights = new Set(state.itemHeights.values());
    if (uniqueHeights.size <= 1 && state.items.length > 20) {
      return calculateVisibleRangeOptimized(scrollTop);
    }
    
    let currentOffset = 0;
    let startIndex = 0;
    let endIndex = 0;
    
    // Find the first visible item
    for (let i = 0; i < state.items.length; i++) {
      // Add null/undefined check
      if (!state.items[i]) {
        console.warn(`Item at index ${i} is undefined`);
        continue;
      }
      
      const itemHeight = getItemHeight(state.items[i]);
      
      if (currentOffset + itemHeight > scrollTop - (renderBufferSize * listConfig.itemHeight)) {
        startIndex = Math.max(0, i - overscanCount);
        break;
      }
      
      currentOffset += itemHeight;
    }
    
    // Find the last visible item
    currentOffset = 0;
    for (let i = 0; i < state.items.length; i++) {
      const itemHeight = getItemHeight(state.items[i]);
      currentOffset += itemHeight;
      
      if (currentOffset > scrollTop + containerHeight + (renderBufferSize * listConfig.itemHeight)) {
        endIndex = Math.min(state.items.length, i + overscanCount);
        break;
      }
    }
    
    // If we reached the end of the list
    if (endIndex === 0) {
      endIndex = state.items.length;
    }
    
    return { start: startIndex, end: endIndex };
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
    const visibleRange = calculateVisibleRange(scrollTop);
    
    // Early return if range hasn't changed
    if (visibleRange.start === state.visibleRange.start && 
        visibleRange.end === state.visibleRange.end) {
      return;
    }
    
    state.visibleRange = visibleRange;
    
    // Calculate total height if needed
    if (state.totalHeightDirty) {
      state.totalHeight = calculateTotalHeight();
      elements.spacer.style.height = `${state.totalHeight}px`;
      state.totalHeightDirty = false;
      
      // Update sentinel positions if using intersection observer
      if (bottomSentinel) {
        bottomSentinel.style.top = `${state.totalHeight - 1}px`;
      }
    }
    
    // Save references to existing elements for recycling
    const existingElements = new Map<string, HTMLElement>();
    Array.from(elements.content.children).forEach(child => {
      if (child === topSentinel || child === bottomSentinel) return;
      
      const id = (child as HTMLElement).getAttribute('data-id');
      if (id) {
        existingElements.set(id, child as HTMLElement);
        child.remove(); // Remove but keep reference
      }
    });
    
    // Slice the visible items
    const visibleItems = state.items.slice(visibleRange.start, visibleRange.end).filter(item => item !== undefined);
    state.visibleItems = visibleItems;
    
    console.log('Visible range:', visibleRange);
    console.log('Visible items:', visibleItems);
    
    // Calculate positions for each visible item
    let currentOffset = 0;
    for (let i = 0; i < visibleRange.start; i++) {
      currentOffset += getItemHeight(state.items[i]);
    }
    
    // Create document fragment for batch DOM updates
    const fragment = document.createDocumentFragment();
    
    // Add sentinel elements back to fragment if they exist
    if (topSentinel) fragment.appendChild(topSentinel);
    
    // Render visible items
    visibleItems.forEach((item, index) => {
      let element: HTMLElement;
      
      // Reuse existing element if available
      if (existingElements.has(item.id)) {
        element = existingElements.get(item.id)!;
        existingElements.delete(item.id);
      } else {
        element = wrappedRenderItem(item, index + visibleRange.start);
      }
      
      if (!element) return;
      
      // Position the element absolutely
      element.style.display = '';
      element.style.position = 'absolute';
      element.style.top = `${currentOffset}px`;
      element.style.left = '0';
      element.style.width = '100%';
      
      // Add to fragment
      fragment.appendChild(element);
      
      // Mark for measurement if height not known
      if (!state.itemHeights.has(item.id)) {
        element.dataset.needsMeasurement = 'true';
      }
      
      // Use cached height for positioning next item
      currentOffset += getItemHeight(item);
      
      // Store the element reference
      state.itemElements.set(item.id, element);
    });
    
    // Add bottom sentinel after items if it exists
    if (bottomSentinel) fragment.appendChild(bottomSentinel);
    
    // Recycle any remaining elements
    existingElements.forEach(element => {
      recycleElement(element);
    });
    
    // Batch DOM update
    elements.content.innerHTML = '';
    elements.content.appendChild(fragment);
    
    // Now measure elements that needed measurement
    const elementsToMeasure = elements.content.querySelectorAll('[data-needs-measurement="true"]');
    let heightsChanged = false;
    
    if (elementsToMeasure.length > 0) {
      heightsChanged = true;
      
      elementsToMeasure.forEach(el => {
        const id = (el as HTMLElement).getAttribute('data-id');
        if (id) {
          // Find the item, accounting for possible transformed structures
          const item = state.items.find(item => {
            const itemId = item && (item.id || (item.original && item.original.id));
            return itemId === id;
          });
          
          if (item) {
            const height = (el as HTMLElement).offsetHeight;
            if (height > 0) {
              state.itemHeights.set(id, height);
              delete (el as HTMLElement).dataset.needsMeasurement;
            }
          }
        }
      });
      
      // Recalculate total height after measurements
      if (heightsChanged) {
        state.totalHeight = calculateTotalHeight();
        elements.spacer.style.height = `${state.totalHeight}px`;
        
        // Update bottom sentinel position
        if (bottomSentinel) {
          bottomSentinel.style.top = `${state.totalHeight - 1}px`;
        }
      }
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
    
    // Calculate the scroll position as a fraction of total height
    const scrollFraction = (scrollTop + state.containerHeight) / state.totalHeight;
    
    if (scrollFraction > listConfig.loadThreshold) {
      loadMore();
    }
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
    
    // Improved loadMore function to handle numeric cursors
    // If the cursor is a numeric string, we need to pass it as both cursor and page
    // to ensure compatibility with different API implementations
    let loadParams: Record<string, any> = {};
    
    if (state.cursor) {
      loadParams.cursor = state.cursor;
      
      // If cursor can be interpreted as a page number, also pass it directly
      const pageNum = parseInt(state.cursor, 10);
      if (!isNaN(pageNum)) {
        console.log(`Loading next page: ${pageNum} (from cursor)`);
        loadParams.page = pageNum;
      }
    }
    
    console.log('Loading more items with params:', loadParams);
    const result = await loadItems(loadParams);
    updateVisibleItems();
    
    return {
      hasNext: state.hasNext,
      items: result.items
    };
  };

  /**
   * Set up scroll event handler for traditional approach
   */
  const setupScrollHandler = (): () => void => {
    // Create optimized handler function
    scrollHandler = (e: Event): void => {
      if (state.scrollRAF) return;
      
      state.scrollRAF = requestAnimationFrame(() => {
        const scrollTop = (e.target as HTMLElement).scrollTop;
        updateVisibleItems(scrollTop);
        state.scrollRAF = null;
      });
    };
    
    // Add listener with passive option for better performance
    container.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Return cleanup function
    return () => {
      if (scrollHandler) {
        container.removeEventListener('scroll', scrollHandler);
        scrollHandler = null;
      }
    };
  };
  
  /**
   * Set up IntersectionObserver for modern approach
   */
  const setupIntersectionObserver = (): () => void => {
    // Fall back to scroll events if IntersectionObserver not supported
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to scroll events');
      return setupScrollHandler();
    }
    
    // Create sentinel elements for top and bottom
    topSentinel = document.createElement('div');
    topSentinel.className = 'mtrl-list-sentinel mtrl-list-sentinel--top';
    topSentinel.style.position = 'absolute';
    topSentinel.style.top = '0';
    topSentinel.style.left = '0';
    topSentinel.style.width = '100%';
    topSentinel.style.height = '1px';
    topSentinel.style.pointerEvents = 'none';
    topSentinel.style.visibility = 'hidden';
    
    bottomSentinel = document.createElement('div');
    bottomSentinel.className = 'mtrl-list-sentinel mtrl-list-sentinel--bottom';
    bottomSentinel.style.position = 'absolute';
    bottomSentinel.style.bottom = '0';
    bottomSentinel.style.left = '0';
    bottomSentinel.style.width = '100%';
    bottomSentinel.style.height = '1px';
    bottomSentinel.style.pointerEvents = 'none';
    bottomSentinel.style.visibility = 'hidden';
    
    // Add sentinels to DOM
    elements.content.appendChild(topSentinel);
    elements.content.appendChild(bottomSentinel);
    
    // Position bottom sentinel
    const updateBottomSentinel = () => {
      if (state.totalHeight > 0) {
        bottomSentinel.style.top = `${state.totalHeight - 1}px`;
      }
    };
    
    // Initial positioning
    updateBottomSentinel();
    
    // Create intersection observer
    intersectionObserver = new IntersectionObserver((entries) => {
      let needsUpdate = false;
      
      entries.forEach(entry => {
        // Top sentinel handles scrolling up
        if (entry.target === topSentinel && entry.isIntersecting) {
          needsUpdate = true;
        }
        
        // Bottom sentinel handles loading more content
        if (entry.target === bottomSentinel && entry.isIntersecting) {
          if (state.hasNext && !state.loading) {
            loadMore();
          }
          needsUpdate = true;
        }
      });
      
      // Update visible items if needed
      if (needsUpdate) {
        updateVisibleItems(container.scrollTop);
      }
    }, { 
      root: container,
      // Use a large margin to trigger earlier
      rootMargin: '400px 0px 400px 0px',
      threshold: 0
    });
    
    // Start observing
    intersectionObserver.observe(topSentinel);
    intersectionObserver.observe(bottomSentinel);
    
    // We still need minimal scroll handling for position updates
    // but much less frequent than full scroll handler
    const lightScrollHandler = () => {
      requestAnimationFrame(() => {
        updateVisibleItems(container.scrollTop);
      });
    };
    
    // Use a throttled scroll event for position updates
    let scrollTimeout: number | null = null;
    const throttledScrollHandler = () => {
      if (scrollTimeout !== null) return;
      
      scrollTimeout = window.setTimeout(() => {
        lightScrollHandler();
        scrollTimeout = null;
      }, 100); // Lower frequency for position updates
    };
    
    container.addEventListener('scroll', throttledScrollHandler, { passive: true });
    
    // Return cleanup function
    return () => {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
      }
      
      container.removeEventListener('scroll', throttledScrollHandler);
      
      if (topSentinel && topSentinel.parentNode) {
        topSentinel.remove();
        topSentinel = null;
      }
      
      if (bottomSentinel && bottomSentinel.parentNode) {
        bottomSentinel.remove();
        bottomSentinel = null;
      }
    };
  };
  
  /**
   * Initialize scroll handling based on selected strategy
   */
  const setupScrollTracking = (): () => void => {
    switch (scrollStrategy) {
      case 'intersection':
        // Try intersection observer with fallback to scroll
        return setupIntersectionObserver();
        
      case 'hybrid':
        // Use both methods simultaneously
        cleanupFunctions.push(setupScrollHandler());
        cleanupFunctions.push(setupIntersectionObserver());
        return () => {
          cleanupFunctions.forEach(cleanup => cleanup());
          cleanupFunctions.length = 0;
        };
        
      case 'scroll':
      default:
        // Use traditional scroll events
        return setupScrollHandler();
    }
  };
  
  /**
   * Refresh the list with the latest data
   * @returns {Promise<void>}
   */
  const refresh = async (): Promise<void> => {
    // Clear state
    state.items = [];
    state.visibleItems = [];
    state.visibleRange = { start: 0, end: 0 };
    state.itemHeights.clear();
    state.itemElements.clear();
    state.cursor = null;
    state.hasNext = !state.useStatic; // Reset hasNext based on data type
    state.totalHeightDirty = true;
    
    // Clear recycling pools
    recyclePool.forEach(pool => pool.length = 0);
    
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
   * Set custom heights for specific items
   * @param {Object} heightsMap - Map of item IDs to heights
   */
  const setItemHeights = (heightsMap: Record<string, number>): void => {
    let updated = false;
    
    for (const [id, height] of Object.entries(heightsMap)) {
      const currentHeight = state.itemHeights.get(id);
      
      // Only update if different
      if (currentHeight !== height) {
        state.itemHeights.set(id, height);
        updated = true;
      }
    }
    
    // Only update if heights changed
    if (updated) {
      state.totalHeightDirty = true;
      updateVisibleItems();
    }
  };
  
  /**
   * Get the offset position for an item by ID
   * @param {string} itemId - Item ID to find
   * @returns {number} Offset from top in pixels
   */
  const getItemOffset = (itemId: string): number => {
    let offset = 0;
    
    for (const item of state.items) {
      if (item.id === itemId) {
        return offset;
      }
      offset += getItemHeight(item);
    }
    
    return -1; // Item not found
  };
  
  /**
   * Scroll to a specific item by ID
   * @param {string} itemId - Item ID to scroll to
   * @param {string} position - Position ('start', 'center', 'end')
   */
  const scrollToItem = (itemId: string, position = 'start'): void => {
    const offset = getItemOffset(itemId);
    if (offset === -1) return;
    
    let scrollPosition = offset;
    
    // Adjust position based on requested alignment
    if (position === 'center') {
      scrollPosition = offset - (state.containerHeight / 2);
    } else if (position === 'end') {
      scrollPosition = offset - state.containerHeight + getItemHeight(state.items.find(item => item.id === itemId)!);
    }
    
    container.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
  };
  
  /**
   * Initialize the virtual list
   */
  const initialize = (): () => void => {
    console.log('Initializing list manager');
    // Set mounted flag
    state.mounted = true;
    
    // Set up scroll tracking based on selected strategy
    const scrollTrackingCleanup = setupScrollTracking();
    
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
    
    // If using static items, add them to the collection right away
    if (state.useStatic && initialItems && initialItems.length > 0) {
      console.log('Using static items:', initialItems);
      itemsCollection.add(initialItems)
        .then(() => {
          // FIX: Force an update after adding items
          setTimeout(() => {
            updateVisibleItems();
          }, 10);
        })
        .catch(err => {
          console.error('Error adding static items to collection:', err);
        });
    } else {
      // Initial load for API data
      console.log('Loading initial data from API');
      loadItems()
        .then((result) => {
          console.log('Initial data loaded:', result);
          updateVisibleItems();
        })
        .catch(err => {
          console.error('Error loading items:', err);
        });
    }
    
    // Handle resize events with ResizeObserver if available
    let resizeObserver: ResizeObserver | null = null;
    
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => {
        // Only update if container dimensions changed
        const newHeight = container.clientHeight;
        if (newHeight !== state.containerHeight) {
          state.containerHeight = newHeight;
          updateVisibleItems();
        }
      });
      
      resizeObserver.observe(container);
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
      // Clean up scroll tracking
      scrollTrackingCleanup();
      
      // Clean up resize observer
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      
      // Unsubscribe from collection
      unsubscribe();
      
      // Run all other cleanup functions
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
    setItemHeights,
    
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
      state.renderHook = hookFn;
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
      recyclePool.forEach(pool => pool.length = 0);
      recyclePool.clear();
      
      // Remove DOM elements
      if (elements.content.parentNode) {
        elements.content.parentNode.removeChild(elements.content);
      }
      
      if (elements.spacer.parentNode) {
        elements.spacer.parentNode.removeChild(elements.spacer);
      }
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