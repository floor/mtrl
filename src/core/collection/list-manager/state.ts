// src/core/collection/list-manager/state.ts
import { ListManagerState, ListManagerConfig } from './types';
import { determineApiMode, getStaticItems } from './config';

/**
 * Creates the initial state for a list manager
 * @param config List manager configuration
 * @returns Initialized state object
 */
export function createInitialState(config: ListManagerConfig): ListManagerState {
  // Determine API mode
  const useApi = determineApiMode(config);
  const useStatic = !useApi;
  
  // Get initial static items
  const initialItems = useStatic ? getStaticItems(config) : [];
  
  // Create more efficient initial state
  return {
    items: initialItems,  // Start with initial items for static mode
    visibleItems: [],
    visibleRange: { start: 0, end: 0 },
    totalHeight: 0,
    totalHeightDirty: true,
    itemHeights: new Map<string, number>(),
    loading: false,
    cursor: null,
    hasNext: useApi, // If using API, assume there might be data to load
    itemElements: new Map<string, HTMLElement>(),
    scrollTop: 0,
    containerHeight: 0,
    scrollRAF: null,
    resizeRAF: null, // For resize handling
    mounted: false,
    itemCount: initialItems.length,  // Initialize with correct count
    useStatic: useStatic,
    renderHook: null
  };
}

/**
 * Updates the state after a load operation
 * @param state Current state
 * @param newItems New items array
 * @param meta Pagination metadata
 * @param dedupe Whether to deduplicate items
 * @returns Updated state
 */
export function updateStateAfterLoad(
  state: ListManagerState,
  newItems: any[],
  meta: { cursor?: string | null; hasNext?: boolean; total?: number },
  dedupe: boolean = true
): Partial<ListManagerState> {
  // Process metadata
  const cursor = meta.cursor ?? null;
  const hasNext = meta.hasNext ?? false;
  
  // Deduplicate items if needed
  let itemsToAdd = newItems;
  if (dedupe && newItems.length > 0 && state.items.length > 0) {
    // Use a Set for faster lookup with large arrays
    const existingIds = new Set<string>();
    
    // Only build the id cache if we have items and need to dedupe
    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      if (item && item.id) {
        existingIds.add(item.id);
      }
    }
    
    // Filter out items that already exist in the collection
    itemsToAdd = newItems.filter(item => item && item.id && !existingIds.has(item.id));
  }
  
  // Create updated items array
  const updatedItems = [...state.items, ...itemsToAdd];
  
  // Calculate item count - use meta.total if provided, otherwise use item count
  const itemCount = meta.total !== undefined ? meta.total : updatedItems.length;
  
  // Return only changed properties
  return {
    items: updatedItems,
    cursor,
    hasNext,
    totalHeightDirty: true,
    itemCount
  };
}

/**
 * Updates the visible items in state
 * @param state Current state
 * @param visibleItems New visible items array
 * @param visibleRange New visible range
 * @returns Updated state
 */
export function updateVisibleItems(
  state: ListManagerState,
  visibleItems: any[],
  visibleRange: { start: number; end: number }
): Partial<ListManagerState> {
  return {
    visibleItems,
    visibleRange
  };
}

/**
 * Updates total height in state
 * @param state Current state
 * @param totalHeight New total height
 * @returns Updated state
 */
export function updateTotalHeight(
  state: ListManagerState,
  totalHeight: number
): Partial<ListManagerState> {
  return {
    totalHeight,
    totalHeightDirty: false
  };
}

/**
 * Updates loading state
 * @param state Current state
 * @param loading New loading state
 * @returns Updated state
 */
export function updateLoadingState(
  state: ListManagerState,
  loading: boolean
): Partial<ListManagerState> {
  return { loading };
}

/**
 * Resets the state for a refresh operation
 * @param state Current state
 * @param initialItems Initial items array for static mode
 * @returns Reset state
 */
export function resetState(
  state: ListManagerState,
  initialItems: any[] = []
): Partial<ListManagerState> {
  return {
    items: state.useStatic ? [...initialItems] : [],
    visibleItems: [],
    visibleRange: { start: 0, end: 0 },
    itemElements: new Map<string, HTMLElement>(),
    cursor: null,
    hasNext: !state.useStatic, // Reset hasNext based on data type
    totalHeightDirty: true,
    itemCount: state.useStatic ? initialItems.length : 0
  };
}

/**
 * Creates load params for the next page
 * @param state Current state
 * @returns Load parameters object
 */
export function createLoadParams(state: ListManagerState): Record<string, any> {
  const loadParams: Record<string, any> = {};
  
  if (state.cursor) {
    loadParams.cursor = state.cursor;
    
    // Add page param if cursor is numeric
    if (/^\d+$/.test(state.cursor)) {
      loadParams.page = parseInt(state.cursor, 10);
    }
  }
  
  return loadParams;
}