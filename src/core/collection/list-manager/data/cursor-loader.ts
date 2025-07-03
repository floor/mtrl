import { LoadStatus, LoadParams, PaginationMeta } from "../types";
import { SCROLL } from "../constants";

/**
 * List manager interface needed for cursor pagination
 */
interface CursorListManager {
  loadItems: (
    params: LoadParams
  ) => Promise<{ items: any[]; meta: PaginationMeta }>;
  getAllItems: () => any[];
}

/**
 * Utility to create a cursor-based page loader
 * @param list List interface
 * @param listManager List manager instance
 * @param config Page loader configuration
 * @returns Page loader interface
 */
export const createCursorPageLoader = (
  list: { setItems: (items: any[]) => void },
  listManager: CursorListManager,
  config: { onLoad?: (status: LoadStatus) => void; pageSize?: number } = {}
) => {
  let currentCursor: string | null = null;
  let loading = false;
  const pageHistory: (string | null)[] = [];
  const pageSize = config.pageSize || 20;

  // Use a throttle to prevent rapid load calls
  let loadThrottleTimer: number | null = null;
  const throttleMs = SCROLL.LOAD_THROTTLE_MS; // Minimum time between load operations

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
      allItems: listManager.getAllItems(),
    });

    try {
      const result = await listManager.loadItems({
        limit: pageSize,
        cursor,
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
        allItems: listManager.getAllItems(),
      });

      return {
        hasNext: result.meta.hasNext,
        hasPrev: pageHistory.length > 0,
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
    get loading() {
      return loading;
    },
    get cursor() {
      return currentCursor;
    },
  };
};
