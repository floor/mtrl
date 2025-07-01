/**
 * Scroll Jump Manager for List Manager
 * Handles precise viewport calculations and scroll jump operations
 */

import { ListManagerState, ListManagerConfig } from "../types";
import { PAGINATION, BOUNDARIES } from "../constants";

export interface ScrollJumpManagerDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  loadPage: (
    pageNumber: number,
    options?: any
  ) => Promise<{ hasNext: boolean; items: any[] }>;
  timeoutManager: {
    setScrollJumpState: (callback: () => void, delay?: number) => void;
    getState: () => { isScrollJumpInProgress: boolean };
    updateState: (updates: any) => void;
  };
}

/**
 * Calculate precise viewport pages needed for a target index
 * @param targetIndex 0-based index to scroll to
 * @param viewportHeight Height of the viewport in pixels
 * @param itemHeight Height of each item in pixels
 * @param pageSize Number of items per page
 * @param actualScrollPosition Current actual scroll position
 * @param totalItems Total number of items (optional)
 * @returns Calculation results with pages needed for viewport
 */
export const calculatePreciseViewportPages = (
  targetIndex: number,
  viewportHeight: number,
  itemHeight: number,
  pageSize: number,
  actualScrollPosition: number,
  totalItems?: number
): {
  targetPage: number;
  targetIndexInPage: number;
  scrollPosition: number;
  viewportPages: number[];
  itemsInViewport: number;
  pagesInViewport: number;
} => {
  // Calculate target page (1-based)
  const targetPage = Math.floor(targetIndex / pageSize) + 1;
  const targetIndexInPage = targetIndex % pageSize;

  // Use actual scroll position instead of calculated position for more accuracy
  const scrollPosition = actualScrollPosition;

  // Add 1-item buffer (±itemHeight) to account for partial items and scroll position variations
  const bufferPixels = itemHeight;

  // Calculate buffered viewport boundaries
  const viewportStartPixel = Math.max(0, scrollPosition - bufferPixels);
  const viewportEndPixel = scrollPosition + viewportHeight + bufferPixels;

  // Calculate which virtual indices should be visible (0-based)
  const viewportStartIndex = Math.floor(viewportStartPixel / itemHeight);
  const viewportEndIndex = Math.floor(viewportEndPixel / itemHeight);

  // Calculate which pages contain these indices
  const startPage = Math.floor(viewportStartIndex / pageSize) + 1;
  const endPage = Math.floor(viewportEndIndex / pageSize) + 1;

  // Constrain to valid page range
  const constrainedStartPage = Math.max(1, startPage);
  const maxPage = totalItems ? Math.ceil(totalItems / pageSize) : endPage;
  const constrainedEndPage = Math.min(endPage, maxPage);

  // Calculate how many items fit in viewport
  const itemsInViewport = Math.ceil(viewportHeight / itemHeight) + 2; // +2 for buffer

  // Build list of pages needed for viewport
  const viewportPages: number[] = [];
  for (let page = constrainedStartPage; page <= constrainedEndPage; page++) {
    viewportPages.push(page);
  }

  const pagesInViewport = viewportPages.length;

  return {
    targetPage,
    targetIndexInPage,
    scrollPosition,
    viewportPages,
    itemsInViewport,
    pagesInViewport,
  };
};

/**
 * Creates a scroll jump manager
 * @param deps Dependencies from the main list manager
 * @returns Scroll jump management functions
 */
export const createScrollJumpManager = (
  deps: ScrollJumpManagerDependencies
) => {
  const { state, config, loadPage, timeoutManager } = deps;

  /**
   * Load additional ranges in background without blocking the UI
   * @param pages Array of page numbers to load
   * @param phase Phase name for logging ('viewport' or 'preload')
   */
  const loadAdditionalRangesInBackground = (
    pages: number[],
    phase = "preload"
  ): void => {
    // Use setTimeout to ensure this runs after the current execution context
    setTimeout(async () => {
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        try {
          await loadPage(page, {
            setScrollPosition: false,
            replaceCollection: false,
          });

          // Small delay between background requests to avoid overwhelming the API
          if (i < pages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          // Continue loading other pages even if one fails
        }
      }
    }, 10); // Small delay to ensure target page renders first
  };

  /**
   * Load target page immediately, then load additional ranges in background
   * Specialized version for scrolling to a specific index with precise viewport calculation
   * @param targetIndex 0-based index to scroll to
   * @param animate Whether to animate the scroll (defaults to false)
   * @returns Promise that resolves when target page is loaded
   */
  const loadScrollToIndexWithBackgroundRanges = async (
    targetIndex: number,
    animate: boolean = false
  ): Promise<void> => {
    // Set scroll jump flag to prevent boundary detection interference
    timeoutManager.updateState({ isScrollJumpInProgress: true });

    console.log(
      "🔗 [loadScrollToIndexWithBackgroundRanges] Loading index:",
      targetIndex
    );

    try {
      const pageSize = config.pageSize || 20;
      const itemHeight = config.itemHeight || 84;
      const containerHeight = state.containerHeight || 400;

      // Use precise viewport calculation with exact target index
      const viewportCalc = calculatePreciseViewportPages(
        targetIndex,
        containerHeight,
        itemHeight,
        pageSize,
        state.scrollTop || 0,
        state.itemCount
      );

      // Load ALL viewport pages in parallel based on actual position
      const allViewportPages = viewportCalc.viewportPages;

      try {
        // Load all viewport pages in parallel
        const viewportPromises = allViewportPages.map((page, index) => {
          const isTargetPage = page === viewportCalc.targetPage;
          const loadOptions = {
            setScrollPosition: isTargetPage,
            replaceCollection: false,
            animate: isTargetPage ? animate : false,
          };

          console.log(`🔗 [ScrollToIndex] Loading page ${page}:`, {
            isTargetPage,
            targetPage: viewportCalc.targetPage,
            targetIndex,
            loadOptions,
          });

          return loadPage(page, loadOptions);
        });

        // Wait for ALL viewport pages to load before proceeding
        await Promise.all(viewportPromises);
      } catch (error) {
        return;
      }

      // Step 3: Background preloading based on adjacentPagesPreload configuration
      // Support both new separate config and legacy single config for backward compatibility
      let preloadBefore: number;
      let preloadAfter: number;

      if (
        config.adjacentPagesPreloadBefore !== undefined ||
        config.adjacentPagesPreloadAfter !== undefined
      ) {
        // Use new separate configuration
        preloadBefore =
          config.adjacentPagesPreloadBefore ??
          PAGINATION.ADJACENT_PAGES_PRELOAD_BEFORE;
        preloadAfter =
          config.adjacentPagesPreloadAfter ??
          PAGINATION.ADJACENT_PAGES_PRELOAD_AFTER;
      } else {
        // Fall back to legacy configuration (split evenly)
        const legacyTotal =
          config.adjacentPagesPreload ?? PAGINATION.ADJACENT_PAGES_PRELOAD;
        preloadBefore = Math.floor(legacyTotal / 2);
        preloadAfter = Math.ceil(legacyTotal / 2);
      }

      if (preloadBefore <= 0 && preloadAfter <= 0) {
        return;
      }

      // Calculate additional pages to preload (exclude already loaded pages)
      const totalPages = state.itemCount
        ? Math.ceil(state.itemCount / pageSize)
        : null;
      const additionalPages: number[] = [];
      const allLoadedPages = [...allViewportPages]; // All viewport pages are already loaded

      // Smart adjacent page calculation for preloading
      const firstViewportPage = Math.min(...viewportCalc.viewportPages); // First page in viewport
      const lastViewportPage = Math.max(...viewportCalc.viewportPages); // Last page in viewport

      // Add BEFORE pages (start from FIRST page of viewport, not target page)
      for (let i = 1; i <= preloadBefore; i++) {
        const prevPage = firstViewportPage - i;
        if (prevPage >= 1 && !allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }

      // Add AFTER pages (start from LAST page of viewport, not first)
      for (let i = 1; i <= preloadAfter; i++) {
        const nextPage = lastViewportPage + i;
        if (
          (!totalPages || nextPage <= totalPages) &&
          !allLoadedPages.includes(nextPage)
        ) {
          additionalPages.push(nextPage);
        }
      }

      // Load additional pages in background (fire and forget)
      if (additionalPages.length > 0) {
        loadAdditionalRangesInBackground(additionalPages, "PRELOAD");
      }
    } catch (error) {
      // Error handling without logging
    } finally {
      // Always clear the scroll jump flag when done
      timeoutManager.updateState({ isScrollJumpInProgress: false });
    }
  };

  /**
   * Load target page immediately, then load additional ranges in background
   * @param targetPage Target page number to jump to
   * @param animate Whether to animate the scroll (defaults to false)
   * @returns Promise that resolves when target page is loaded
   */
  const loadScrollJumpWithBackgroundRanges = async (
    targetPage: number,
    animate: boolean = false
  ): Promise<void> => {
    // Set scroll jump flag to prevent boundary detection interference
    timeoutManager.updateState({ isScrollJumpInProgress: true });

    console.log(
      "🔗 [loadScrollJumpWithBackgroundRanges] Loading page:",
      targetPage
    );

    try {
      const pageSize = config.pageSize || 20;
      const itemHeight = config.itemHeight || 84;
      const containerHeight = state.containerHeight || 400;

      // Use ACTUAL current scroll position instead of page start
      // This ensures we calculate viewport pages based on where the user actually is
      const actualScrollPosition = state.scrollTop || 0;
      const actualIndex = Math.floor(actualScrollPosition / itemHeight);

      // Use precise viewport calculation with actual current position
      const viewportCalc = calculatePreciseViewportPages(
        actualIndex,
        containerHeight,
        itemHeight,
        pageSize,
        actualScrollPosition,
        state.itemCount
      );

      // Load ALL viewport pages in parallel based on actual position
      const allViewportPages = viewportCalc.viewportPages;

      try {
        // Load all viewport pages in parallel
        const viewportPromises = allViewportPages.map((page, index) => {
          // Only the target page should set scroll position, others just load data
          return loadPage(page, {
            setScrollPosition: page === viewportCalc.targetPage,
            replaceCollection: false,
            animate: page === viewportCalc.targetPage ? animate : false,
          });
        });

        // Wait for ALL viewport pages to load before proceeding
        await Promise.all(viewportPromises);
      } catch (error) {
        return;
      }

      // Step 3: Background preloading based on adjacentPagesPreload configuration
      // Support both new separate config and legacy single config for backward compatibility
      let preloadBefore: number;
      let preloadAfter: number;

      if (
        config.adjacentPagesPreloadBefore !== undefined ||
        config.adjacentPagesPreloadAfter !== undefined
      ) {
        // Use new separate configuration
        preloadBefore =
          config.adjacentPagesPreloadBefore ??
          PAGINATION.ADJACENT_PAGES_PRELOAD_BEFORE;
        preloadAfter =
          config.adjacentPagesPreloadAfter ??
          PAGINATION.ADJACENT_PAGES_PRELOAD_AFTER;
      } else {
        // Fall back to legacy configuration (split evenly)
        const legacyTotal =
          config.adjacentPagesPreload ?? PAGINATION.ADJACENT_PAGES_PRELOAD;
        preloadBefore = Math.floor(legacyTotal / 2);
        preloadAfter = Math.ceil(legacyTotal / 2);
      }

      if (preloadBefore <= 0 && preloadAfter <= 0) {
        return;
      }

      // Calculate additional pages to preload (exclude already loaded pages)
      const totalPages = state.itemCount
        ? Math.ceil(state.itemCount / pageSize)
        : null;
      const additionalPages: number[] = [];
      const allLoadedPages = [...allViewportPages]; // All viewport pages are already loaded

      // Smart adjacent page calculation for preloading
      const firstViewportPage = Math.min(...viewportCalc.viewportPages); // First page in viewport
      const lastViewportPage = Math.max(...viewportCalc.viewportPages); // Last page in viewport

      // Add BEFORE pages (start from FIRST page of viewport, not target page)
      for (let i = 1; i <= preloadBefore; i++) {
        const prevPage = firstViewportPage - i;
        if (prevPage >= 1 && !allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }

      // Add AFTER pages (start from LAST page of viewport, not first)
      for (let i = 1; i <= preloadAfter; i++) {
        const nextPage = lastViewportPage + i;
        if (
          (!totalPages || nextPage <= totalPages) &&
          !allLoadedPages.includes(nextPage)
        ) {
          additionalPages.push(nextPage);
        }
      }

      // Load additional pages in background (fire and forget)
      if (additionalPages.length > 0) {
        loadAdditionalRangesInBackground(additionalPages, "PRELOAD");
      }
    } catch (error) {
      // Error handling without logging
    } finally {
      // Always clear the scroll jump flag when done
      timeoutManager.updateState({ isScrollJumpInProgress: false });
    }
  };

  /**
   * Schedule a page load when scrolling stops (debounced)
   * @param targetPage Page to load when scrolling stops
   */
  const scheduleScrollStopPageLoad = (targetPage: number): void => {
    const timeoutState = timeoutManager.getState();

    // Use timeout manager to handle debounced scroll jump
    timeoutManager.setScrollJumpState(() => {
      loadScrollJumpWithBackgroundRanges(targetPage)
        .then(() => {
          // Success - no logging needed
        })
        .catch((error) => {
          console.error(`❌ Failed to load page ${targetPage}:`, error);
          // Fallback to simple page load
          loadPage(targetPage);
        });
    }, BOUNDARIES.SCROLL_JUMP_LOAD_DEBOUNCE);
  };

  return {
    scheduleScrollStopPageLoad,
    loadScrollJumpWithBackgroundRanges,
    loadAdditionalRangesInBackground,
    loadScrollToIndexWithBackgroundRanges,
  };
};
