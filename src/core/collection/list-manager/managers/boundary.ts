/**
 * Boundary Detection Manager for List Manager
 * Handles page boundary detection and loading logic
 */

import { ListManagerState, ListManagerConfig, LoadParams } from "../types";
import { createLoadParams } from "../utils/state";
import { BOUNDARIES, DEFAULTS, PAGINATION } from "../constants";

export interface BoundaryManagerDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  loadItems: (params: LoadParams) => Promise<{ items: any[]; meta: any }>;
  timeoutManager: {
    getState: () => {
      justJumpedToPage: boolean;
      isScrollJumpInProgress: boolean;
      isBoundaryLoading: boolean;
    };
    updateState: (updates: any) => void;
  };
  scrollJumpManager: {
    loadScrollToIndexWithBackgroundRanges: (
      targetIndex: number
    ) => Promise<void>;
  };
}

/**
 * Creates a boundary detection manager
 * @param deps Dependencies from the main list manager
 * @returns Boundary detection functions
 */
export const createBoundaryManager = (deps: BoundaryManagerDependencies) => {
  const { state, config, loadItems, timeoutManager, scrollJumpManager } = deps;

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

    // Set boundary loading flag to prevent viewport shifts
    timeoutManager.updateState({ isBoundaryLoading: true });

    const pageSize = config.pageSize || DEFAULTS.pageSize;
    const pageStartId = (pageNumber - 1) * pageSize + 1;
    const pageEndId = pageNumber * pageSize;

    // Check if we already have this page data
    const hasPageData = state.items.some((item) => {
      const itemId = parseInt(item?.id);
      return itemId >= pageStartId && itemId <= pageEndId;
    });

    if (hasPageData) {
      return;
    }

    try {
      const loadParams = createLoadParams(state, "page");
      loadParams.page = pageNumber;

      const perPageParam = config.pagination?.perPageParamName || "per_page";
      loadParams[perPageParam] = pageSize;

      await loadItems(loadParams);
    } catch (error) {
      console.error(
        `❌ [BoundaryLoad] Failed to load ${pageType} page ${pageNumber}:`,
        error
      );
    } finally {
      // Clear boundary loading flag
      timeoutManager.updateState({ isBoundaryLoading: false });
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
      return;
    }

    const timeoutState = timeoutManager.getState();

    // 🚫 CRITICAL: Completely prevent boundary detection during any scroll jump activity
    // This prevents race conditions between boundary manager and scroll jump manager
    if (timeoutState.justJumpedToPage || timeoutState.isScrollJumpInProgress) {
      return;
    }

    // Prevent concurrent boundary loads
    if (state.loading || timeoutState.isBoundaryLoading) {
      return;
    }

    const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
    const containerHeight = state.containerHeight || 400;
    const pageSize = config.pageSize || DEFAULTS.pageSize;

    // Calculate dynamic buffer based on viewport and page size
    const itemsInViewport = Math.ceil(containerHeight / itemHeight);
    const bufferPages = Math.max(1, Math.ceil(itemsInViewport / pageSize));
    const bufferItems = bufferPages * pageSize;
    const loadThreshold = bufferItems * itemHeight;

    // Calculate current index from scroll position
    const currentIndex = Math.floor(scrollTop / itemHeight);
    const viewportBottom = scrollTop + containerHeight;

    // Calculate which items should be visible in the current viewport + buffer
    const viewportStartItemId = Math.floor(scrollTop / itemHeight) + 1;
    const viewportEndItemId = Math.floor(viewportBottom / itemHeight) + 1;
    const bufferStartItemId = Math.max(1, viewportStartItemId - bufferItems);
    const bufferEndItemId = viewportEndItemId + bufferItems;

    // Check which items in the buffer range are actually loaded
    const loadedItemIds = new Set(
      state.items.map((item) => parseInt(item?.id))
    );
    const missingItemIds = [];

    for (let itemId = bufferStartItemId; itemId <= bufferEndItemId; itemId++) {
      if (!loadedItemIds.has(itemId)) {
        missingItemIds.push(itemId);
      }
    }

    // If we're missing items in the buffer range, we need to load
    const needsLoading = missingItemIds.length > 0;

    // Load data if we're missing items in the buffer range
    if (needsLoading) {
      // Set boundary loading flag to prevent concurrent boundary loads
      timeoutManager.updateState({ isBoundaryLoading: true });

      scrollJumpManager
        .loadScrollToIndexWithBackgroundRanges(currentIndex)
        .catch((error) => {
          console.error(
            `❌ [BoundaryLoad] Viewport-based loading failed:`,
            error
          );
        })
        .finally(() => {
          // Clear boundary loading flag
          timeoutManager.updateState({ isBoundaryLoading: false });
        });
    }
  };

  return {
    checkPageBoundaries,
    loadPageFromBoundary,
  };
};
