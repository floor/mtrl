// src/core/collection/list-manager/state.ts
import { ListManagerState, ListManagerConfig } from "./types";

/**
 * Efficiently insert new items into a sorted array, maintaining sort order
 * This is O(n) instead of O(n log n) full sorting
 * @param existingItems Existing sorted items
 * @param newItems New items to insert
 * @returns New sorted array with all items
 */
function insertItemsSorted(existingItems: any[], newItems: any[]): any[] {
  if (newItems.length === 0) return [...existingItems];
  if (existingItems.length === 0) {
    // Sort new items and return
    return [...newItems].sort((a, b) => {
      const idA = parseInt(a?.id || "0");
      const idB = parseInt(b?.id || "0");
      return idA - idB;
    });
  }

  // Sort new items first
  const sortedNewItems = [...newItems].sort((a, b) => {
    const idA = parseInt(a?.id || "0");
    const idB = parseInt(b?.id || "0");
    return idA - idB;
  });

  // Merge two sorted arrays efficiently (O(n + m))
  const result: any[] = [];
  let i = 0; // existing items index
  let j = 0; // new items index

  while (i < existingItems.length && j < sortedNewItems.length) {
    const existingId = parseInt(existingItems[i]?.id || "0");
    const newId = parseInt(sortedNewItems[j]?.id || "0");

    if (existingId <= newId) {
      result.push(existingItems[i]);
      i++;
    } else {
      result.push(sortedNewItems[j]);
      j++;
    }
  }

  // Add remaining items
  while (i < existingItems.length) {
    result.push(existingItems[i]);
    i++;
  }
  while (j < sortedNewItems.length) {
    result.push(sortedNewItems[j]);
    j++;
  }

  return result;
}

/**
 * Creates the initial state for a list manager
 * @param config List manager configuration
 * @returns Initialized state object
 */
export function createInitialState(
  config: ListManagerConfig
): ListManagerState {
  // Determine API mode
  const useApi = Boolean(config.baseUrl);
  const useStatic = !useApi;

  // Get initial static items
  const initialItems = useStatic
    ? config.staticItems || config.items || []
    : [];

  // Get pagination strategy if provided
  const paginationStrategy = config.pagination?.strategy || "cursor";

  // Create more efficient initial state
  return {
    items: initialItems, // Start with initial items for static mode
    visibleItems: [],
    visibleRange: { start: 0, end: 0 },
    totalHeight: 0,
    totalHeightDirty: true,
    itemHeights: new Map<string, number>(),
    loading: false,
    cursor: null,
    page: paginationStrategy === "page" ? 1 : undefined, // Initialize page for page-based pagination
    paginationStrategy, // Store the pagination strategy
    hasNext: useApi, // If using API, assume there might be data to load
    itemElements: new Map<string, HTMLElement>(),
    scrollTop: 0,
    containerHeight: 0,
    scrollRAF: null,
    resizeRAF: null, // For resize handling
    mounted: false,
    itemCount: initialItems.length, // Initialize with correct count
    useStatic: useStatic,
    renderHook: null,
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
  meta: {
    cursor?: string | null;
    hasNext?: boolean;
    total?: number;
    page?: number;
  },
  dedupe: boolean = true
): Partial<ListManagerState> {
  // Process metadata
  const cursor = meta.cursor ?? null;
  const hasNext = meta.hasNext ?? false;

  // Update page based on response or cursor
  let page = state.page;
  if (meta.page !== undefined) {
    page = meta.page;
  } else if (cursor && /^\d+$/.test(cursor)) {
    // If cursor is numeric and we're using page-based pagination,
    // the current page is (cursor - 1) since cursor points to next page
    page = parseInt(cursor, 10) - 1;
  }

  // Important: when using page-based pagination, always use page number from state
  // that was incremented in loadMore unless we got a specific page from the API
  if (
    state.paginationStrategy === "page" &&
    meta.page === undefined &&
    !cursor
  ) {
    page = state.page;
  }

  // Log for debugging
  // console.log('Updated state after load:', {
  //   page,
  //   cursor,
  //   hasNext,
  //   strategy: state.paginationStrategy,
  //   newItemsCount: newItems.length
  // });

  // Determine if we should replace or append items based on pagination strategy
  let updatedItems: any[];

  if (state.paginationStrategy === "page" && state.page === 1) {
    // For page 1 in page-based pagination, replace all items
    // Use the same efficient sorting approach
    updatedItems = insertItemsSorted([], newItems);
  } else {
    // Default behavior - append items (possibly with deduplication)
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
      itemsToAdd = newItems.filter(
        (item) => item && item.id && !existingIds.has(item.id)
      );
    }

    // EFFICIENT: Insert items in correct position instead of appending + sorting
    // This is O(n) instead of O(n log n) and maintains sort order
    updatedItems = insertItemsSorted(state.items, itemsToAdd);
  }

  // Calculate item count - use meta.total if provided, otherwise use item count
  const itemCount = meta.total !== undefined ? meta.total : updatedItems.length;

  // Return only changed properties
  return {
    items: updatedItems,
    cursor,
    page,
    hasNext,
    totalHeightDirty: true,
    itemCount,
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
    visibleRange,
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
    totalHeightDirty: false,
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
    page: state.paginationStrategy === "page" ? 1 : undefined, // Reset page for page-based pagination
    hasNext: !state.useStatic, // Reset hasNext based on data type
    totalHeightDirty: true,
    itemCount: state.useStatic ? initialItems.length : 0,
  };
}

/**
 * Creates load params for the next page based on pagination strategy
 * @param state Current state
 * @param paginationStrategy Optional pagination strategy override
 * @returns Load parameters object
 */
export function createLoadParams(
  state: ListManagerState,
  paginationStrategy?: string
): Record<string, any> {
  const loadParams: Record<string, any> = {};

  // Get pagination strategy from either parameter or stored config
  const strategy = paginationStrategy || state.paginationStrategy || "cursor";

  // Handle different pagination strategies
  switch (strategy) {
    case "page": {
      // For page-based pagination, use page numbers
      if (state.cursor && /^\d+$/.test(state.cursor)) {
        // If cursor is a number, it's a page number
        loadParams.page = parseInt(state.cursor, 10);
      } else if (state.page !== undefined) {
        // Use stored page number if available
        loadParams.page = state.page;
      } else {
        // If no page info available, default to page 1
        loadParams.page = 1;
      }
      break;
    }

    case "offset": {
      // For offset-based pagination
      if (state.cursor && /^\d+$/.test(state.cursor)) {
        // If cursor is a number, it's an offset
        loadParams.offset = parseInt(state.cursor, 10);
      } else {
        // Default to zero offset
        loadParams.offset = 0;
      }
      break;
    }

    case "cursor":
    default: {
      // For cursor-based pagination, use cursor directly
      if (state.cursor) {
        loadParams.cursor = state.cursor;
      }

      // Add page param if cursor is numeric (might help with some APIs)
      if (state.cursor && /^\d+$/.test(state.cursor)) {
        loadParams.page = parseInt(state.cursor, 10);
      }
      break;
    }
  }

  return loadParams;
}
