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
  const initialItems = getStaticItems(config);
  
  // Create state object
  return {
    items: useStatic && initialItems ? [...initialItems] : [],
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
    mounted: false,
    itemCount: useStatic && initialItems ? initialItems.length : 0,
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
): ListManagerState {
  // Process metadata
  const cursor = meta.cursor ?? null;
  const hasNext = meta.hasNext ?? false;
  
  // Deduplicate items if needed
  let itemsToAdd = newItems;
  if (dedupe) {
    const existingIds = new Set(state.items.map(item => item.id));
    itemsToAdd = newItems.filter(item => !existingIds.has(item.id));
  }
  
  // Create updated state
  const updatedState: ListManagerState = {
    ...state,
    items: [...state.items, ...itemsToAdd],
    cursor,
    hasNext,
    totalHeightDirty: true
  };
  
  // Update item count if provided
  if (meta.total) {
    updatedState.itemCount = meta.total;
  } else {
    updatedState.itemCount = updatedState.items.length + (hasNext ? 1 : 0);
  }
  
  return updatedState;
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
): ListManagerState {
  return {
    ...state,
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
): ListManagerState {
  return {
    ...state,
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
): ListManagerState {
  return {
    ...state,
    loading
  };
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
): ListManagerState {
  return {
    ...state,
    items: state.useStatic ? [...initialItems] : [],
    visibleItems: [],
    visibleRange: { start: 0, end: 0 },
    itemHeights: new Map<string, number>(),
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
  let loadParams: Record<string, any> = {};
  
  if (state.cursor) {
    loadParams.cursor = state.cursor;
    
    // If cursor can be interpreted as a page number, also pass it directly
    const pageNum = parseInt(state.cursor, 10);
    if (!isNaN(pageNum)) {
      loadParams.page = pageNum;
    }
  }
  
  return loadParams;
}