import { ListManager, ScrollToPosition } from "./types";
import { TIMING } from "./constants";

/**
 * Dependencies required to create the public API
 */
export interface PublicAPIDependencies {
  // Core functions
  loadItems: any;
  loadPage: any;
  refresh: any;
  updateVisibleItems: any;

  // Scrolling functions
  scrollToItem: any;
  scrollToIndex: any;
  scrollToItemById: any;

  // Pagination manager
  paginationManager: {
    loadNextPage: any;
    loadPreviousPage: any;
  };

  // Page event manager
  pageEventManager: {
    calculateCurrentPage: any;
  };

  // State and config
  state: any;
  validatedConfig: any;

  // Collections and cleanup
  itemsCollection: any;
  cleanupFunctions: (() => void)[];

  // Lifecycle
  actualCleanup: () => void;
}

/**
 * Creates the public API for the list manager
 * @param deps Dependencies from the main list manager
 * @returns Complete ListManager public interface
 */
export const createPublicAPI = (deps: PublicAPIDependencies): ListManager => {
  const {
    loadItems,
    loadPage,
    refresh,
    updateVisibleItems,
    scrollToItem,
    scrollToIndex,
    scrollToItemById,
    paginationManager,
    pageEventManager,
    state,
    validatedConfig,
    itemsCollection,
    cleanupFunctions,
    actualCleanup,
  } = deps;

  return {
    // Core data operations
    loadItems,
    loadPage,
    loadNext: paginationManager.loadNextPage,
    refresh,
    updateVisibleItems,

    // Navigation and scrolling
    scrollToItem,
    scrollToIndex,
    scrollToItemById,

    // Strategy-agnostic scrolling
    scrollTo: async (
      pageNumber: number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => {
      const shouldAnimate =
        animate !== undefined ? animate : validatedConfig.animate || false;

      // Get the configured page size
      const pageSize = validatedConfig.pageSize || 20;

      // Calculate the starting index of the page (0-based)
      // Page 1 starts at index 0, page 2 starts at pageSize, etc.
      const startIndex = (pageNumber - 1) * pageSize;

      await scrollToIndex(startIndex, position, shouldAnimate);
    },

    // Page loading with scrolling
    scrollNext: async () => {
      const result = await paginationManager.loadNextPage();
      return result;
    },

    scrollPrevious: async () => {
      const result = await paginationManager.loadPreviousPage();
      return result;
    },

    loadPrevious: paginationManager.loadPreviousPage,

    // Page navigation
    getCurrentPage: () => {
      if (state.paginationStrategy === "page") {
        return state.page || 1;
      }
      return (
        pageEventManager.calculateCurrentPage(
          state.scrollTop || 0,
          state.paginationStrategy
        ) || 1
      );
    },

    // Configuration access
    getPageSize: () => validatedConfig.pageSize || 20,

    // Event handling
    onPageChange: (callback: (page: number) => void) => {
      let currentPageTracked = state.page || 1;
      const checkPageChange = () => {
        const newPage = state.page || 1;
        if (newPage !== currentPageTracked) {
          currentPageTracked = newPage;
          callback(newPage);
        }
      };

      const interval = setInterval(
        checkPageChange,
        TIMING.PAGE_CHANGE_INTERVAL
      );
      const cleanup = () => clearInterval(interval);
      cleanupFunctions.push(cleanup);
      return cleanup;
    },

    // State access
    getState: () => ({ ...state }),
    getAllItems: () => state.items,
    getVisibleItems: () => state.visibleItems,
    isLoading: () => state.loading,
    hasNextPage: () => state.hasNext,

    // Collection and event handling
    onCollectionChange: (
      callback: (event: { type: string; data: any }) => void
    ) => {
      // Simple implementation - return cleanup function
      // TODO: Implement proper collection event handling if needed
      return () => {};
    },

    getCollection: () => itemsCollection,

    isApiMode: () => !state.useStatic,

    // Lifecycle
    destroy: () => {
      actualCleanup();
    },
  } as any;
};
