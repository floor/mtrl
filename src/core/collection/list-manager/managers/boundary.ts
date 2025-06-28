/**
 * Boundary Detection Manager for List Manager
 * Handles page boundary detection and loading logic
 */

import { ListManagerState, ListManagerConfig, LoadParams } from "../types";
import { createLoadParams } from "../utils/state";
import { BOUNDARIES, DEFAULTS, PLACEHOLDER } from "../constants";

export interface BoundaryManagerDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  loadItems: (params: LoadParams) => Promise<{ items: any[]; meta: any }>;
  timeoutManager: {
    getState: () => {
      justJumpedToPage: boolean;
      isScrollJumpInProgress: boolean;
    };
    updateState: (updates: any) => void;
  };
}

/**
 * Creates a boundary detection manager
 * @param deps Dependencies from the main list manager
 * @returns Boundary detection functions
 */
export const createBoundaryManager = (deps: BoundaryManagerDependencies) => {
  const { state, config, loadItems, timeoutManager } = deps;

  /**
   * Generic page loader for boundary detection
   * Consolidates the duplicate boundary loading functions
   * @param pageNumber Page number to load
   * @param pageType Type of page load for logging
   * @returns Promise that resolves when loading is complete
   */
  const loadPageFromBoundary = async (
    pageNumber: number,
    pageType: "current" | "next" | "previous" = "current"
  ): Promise<void> => {
    if (state.loading) return;

    const pageSize = config.pageSize || DEFAULTS.pageSize;
    const pageStartId = (pageNumber - 1) * pageSize + 1;
    const pageEndId = pageNumber * pageSize;

    // Check if we already have this page data
    const hasPageData = state.items.some((item) => {
      const itemId = parseInt(item?.id);
      return itemId >= pageStartId && itemId <= pageEndId;
    });

    if (hasPageData) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `📦 [BoundaryLoad] Page ${pageNumber} (${pageType}) already loaded`
        );
      }
      return;
    }

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(`🔄 [BoundaryLoad] Loading page ${pageNumber} (${pageType})`);
    }

    try {
      const loadParams = createLoadParams(state, "page");
      loadParams.page = pageNumber;

      const perPageParam = config.pagination?.perPageParamName || "per_page";
      loadParams[perPageParam] = pageSize;

      await loadItems(loadParams);

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `✅ [BoundaryLoad] Page ${pageNumber} (${pageType}) loaded successfully`
        );
      }
    } catch (error) {
      console.error(
        `❌ [BoundaryLoad] Failed to load ${pageType} page ${pageNumber}:`,
        error
      );
    }
  };

  /**
   * Check if user has scrolled beyond current page boundaries and load adjacent pages
   * @param scrollTop Current scroll position
   */
  const checkPageBoundaries = (scrollTop: number): void => {
    if (!state.page || state.items.length === 0) return;

    // Don't run boundary detection during initial loads
    // This prevents inappropriate boundary loads when the list is just being set up
    if (scrollTop <= 10 && state.page <= 2) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🚫 Skip boundary - initial load (scroll: ${scrollTop}, page: ${state.page})`
        );
      }
      return;
    }

    const timeoutState = timeoutManager.getState();

    // Don't run boundary detection immediately after page jumps
    if (timeoutState.justJumpedToPage) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`🚫 Skip boundary - just jumped to page ${state.page}`);
      }
      return;
    }

    // Prevent concurrent boundary loads
    if (state.loading) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`🚫 Skip boundary - already loading`);
      }
      return;
    }

    // Don't run boundary detection during scroll jump debounce
    if (timeoutState.isScrollJumpInProgress) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`🚫 Skip boundary - scroll jump in progress`);
      }
      return;
    }

    const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
    const pageSize = config.pageSize || DEFAULTS.pageSize;

    // Calculate current page boundaries
    const currentPageStart = (state.page - 1) * pageSize + 1;
    const currentPageEnd = state.page * pageSize;

    const currentPageStartPx = (currentPageStart - 1) * itemHeight;
    const currentPageEndPx = currentPageEnd * itemHeight;

    const boundaryThreshold =
      itemHeight * BOUNDARIES.BOUNDARY_THRESHOLD_MULTIPLIER;
    const viewportBottom = scrollTop + state.containerHeight;

    // Check if we have data for the current page
    const hasCurrentPageData = state.items.some((item) => {
      const itemId = parseInt(item?.id);
      return itemId >= currentPageStart && itemId <= currentPageEnd;
    });

    if (!hasCurrentPageData) {
      loadPageFromBoundary(state.page, "current");
      return;
    }

    // Check if we should load next page
    if (
      state.hasNext &&
      viewportBottom > currentPageEndPx - boundaryThreshold
    ) {
      const nextPage = state.page + 1;
      const nextPageStart = (nextPage - 1) * pageSize + 1;
      const nextPageEnd = nextPage * pageSize;

      const hasNextPageData = state.items.some((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= nextPageStart && itemId <= nextPageEnd;
      });

      if (!hasNextPageData) {
        loadPageFromBoundary(nextPage, "next");
      }
    }

    // Check if we should load previous page
    if (state.page > 1 && scrollTop < currentPageStartPx + boundaryThreshold) {
      const prevPage = state.page - 1;
      const prevPageStart = (prevPage - 1) * pageSize + 1;
      const prevPageEnd = prevPage * pageSize;

      const hasPrevPageData = state.items.some((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= prevPageStart && itemId <= prevPageEnd;
      });

      if (!hasPrevPageData) {
        loadPageFromBoundary(prevPage, "previous");
      }
    }
  };

  return {
    checkPageBoundaries,
    loadPageFromBoundary,
  };
};
