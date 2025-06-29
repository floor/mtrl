/**
 * Scroll Jump Manager for List Manager
 * Handles complex scroll jump operations and background range loading
 */

import { ListManagerState, ListManagerConfig } from "../types";
import { PAGINATION, PLACEHOLDER, BOUNDARIES } from "../constants";

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
  };
}

/**
 * Precisely calculate which pages are needed to fill the viewport from a target index
 * @param targetIndex The 0-based index we're scrolling to
 * @param viewportHeight Height of the viewport in pixels
 * @param itemHeight Height of each item in pixels
 * @param pageSize Number of items per page
 * @param totalItems Total number of items (optional, for bounds checking)
 * @returns Object with target page and all pages needed for viewport
 */
export const calculatePreciseViewportPages = (
  targetIndex: number,
  viewportHeight: number,
  itemHeight: number,
  pageSize: number,
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

  // Calculate exact scroll position for the target index
  const scrollPosition = targetIndex * itemHeight;

  // Calculate how many items fit in the viewport
  const itemsInViewport = Math.ceil(viewportHeight / itemHeight);

  // Calculate viewport boundaries
  const viewportStartPixel = scrollPosition;
  const viewportEndPixel = scrollPosition + viewportHeight;

  // Calculate which items are visible in this viewport
  const viewportStartIndex = Math.floor(viewportStartPixel / itemHeight);
  const viewportEndIndex = Math.floor(viewportEndPixel / itemHeight);

  // Ensure we don't go beyond total items if provided
  const actualViewportEndIndex = totalItems
    ? Math.min(viewportEndIndex, totalItems - 1)
    : viewportEndIndex;

  // Calculate which pages contain the visible items
  const startPage = Math.floor(viewportStartIndex / pageSize) + 1;
  const endPage = Math.floor(actualViewportEndIndex / pageSize) + 1;

  // Build array of all pages needed for the viewport
  const viewportPages: number[] = [];
  for (let page = startPage; page <= endPage; page++) {
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
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🔄 [${phase}] Starting background loading: [${pages.join(", ")}]`
        );
      }

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        try {
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(`🔄 [${phase}] Loading page ${page}...`);
          }

          await loadPage(page, {
            setScrollPosition: false,
            replaceCollection: false,
          });

          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(`✅ [${phase}] Page ${page} loaded successfully`);
          }

          // Small delay between background requests to avoid overwhelming the API
          if (i < pages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`❌ [${phase}] Failed to load page ${page}:`, error);
          // Continue loading other pages even if one fails
        }
      }

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`✅ [${phase}] Background loading completed`);
      }
    }, 10); // Small delay to ensure target page renders first
  };

  /**
   * Load target page immediately, then load additional ranges in background
   * Specialized version for scrolling to a specific index with precise viewport calculation
   * @param targetIndex 0-based index to scroll to
   * @returns Promise that resolves when target page is loaded
   */
  const loadScrollToIndexWithBackgroundRanges = async (
    targetIndex: number
  ): Promise<void> => {
    const pageSize = config.pageSize || 20;
    const itemHeight = config.itemHeight || 84;
    const containerHeight = state.containerHeight || 400;

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(`🚀 [ScrollToIndex] Starting scroll to index ${targetIndex}`);
      console.log(
        `📏 [ScrollToIndex] Config: pageSize=${pageSize}, itemHeight=${itemHeight}, containerHeight=${containerHeight}`
      );
    }

    // Use precise viewport calculation with exact target index
    const viewportCalc = calculatePreciseViewportPages(
      targetIndex,
      containerHeight,
      itemHeight,
      pageSize,
      state.itemCount
    );

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `📊 [ScrollToIndex] Precise calculation for index ${targetIndex}:`
      );
      console.log(`  Target page: ${viewportCalc.targetPage}`);
      console.log(
        `  Index position in page: ${viewportCalc.targetIndexInPage}`
      );
      console.log(`  Scroll position: ${viewportCalc.scrollPosition}px`);
      console.log(`  Items in viewport: ${viewportCalc.itemsInViewport}`);
      console.log(`  Pages in viewport: ${viewportCalc.pagesInViewport}`);
      console.log(
        `  Viewport pages needed: [${viewportCalc.viewportPages.join(", ")}]`
      );
    }

    // Load ALL viewport pages in parallel (target page + additional viewport pages)
    // This avoids the glitch of seeing target page first, then additional pages
    const allViewportPages = viewportCalc.viewportPages;

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `⚡ [VIEWPORT] Loading ALL ${
          allViewportPages.length
        } viewport pages in PARALLEL: [${allViewportPages.join(", ")}]`
      );
    }

    try {
      const startTime = performance.now();

      // Load all viewport pages in parallel
      const viewportPromises = allViewportPages.map((page, index) => {
        if (PLACEHOLDER.DEBUG_LOGGING) {
          console.log(
            `⚡ [VIEWPORT] Starting parallel load of page ${page} (${
              index + 1
            }/${allViewportPages.length})`
          );
        }

        // Only the target page should set scroll position, others just load data
        return loadPage(page, {
          setScrollPosition: page === viewportCalc.targetPage,
          replaceCollection: false,
        });
      });

      // Wait for ALL viewport pages to load before proceeding
      await Promise.all(viewportPromises);

      const endTime = performance.now();

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `✅ [VIEWPORT] All ${
            allViewportPages.length
          } viewport pages loaded in parallel (${Math.round(
            endTime - startTime
          )}ms)`
        );
        console.log(
          `🎯 [VIEWPORT] Viewport is now complete - no visual glitches!`
        );
      }
    } catch (error) {
      console.error(`❌ [VIEWPORT] Failed to load viewport pages:`, error);
      return;
    }

    // Phase 3: Background preloading based on scrollJumpRangesToFetch
    const rangesToFetch =
      config.scrollJumpRangesToFetch || PAGINATION.SCROLL_JUMP_RANGES_TO_FETCH;

    if (rangesToFetch <= 0) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🔄 [PRELOAD] No additional preloading (scrollJumpRangesToFetch: ${rangesToFetch})`
        );
      }
      return;
    }

    // Calculate additional pages to preload (exclude already loaded pages)
    const totalPages = state.itemCount
      ? Math.ceil(state.itemCount / pageSize)
      : null;
    const additionalPages: number[] = [];
    const allLoadedPages = [...allViewportPages]; // All viewport pages are already loaded

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `🔄 [PRELOAD] Calculating ${rangesToFetch} additional pages to preload (excluding already loaded pages: [${allLoadedPages.join(
          ", "
        )}])`
      );
    }

    // Smart adjacent page calculation for preloading
    const targetPage = viewportCalc.targetPage;
    if (totalPages && targetPage >= totalPages) {
      // We're on the last page, load previous pages only
      for (let i = 1; i <= rangesToFetch && targetPage - i >= 1; i++) {
        const prevPage = targetPage - i;
        if (!allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }
    } else if (totalPages && targetPage > totalPages - 2) {
      // We're near the end, prioritize previous pages
      const prevPagesCount = Math.min(rangesToFetch, targetPage - 1);
      for (let i = 1; i <= prevPagesCount; i++) {
        const prevPage = targetPage - i;
        if (!allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }
      // Add any remaining as next pages (if they exist)
      const remainingSlots = rangesToFetch - additionalPages.length;
      for (
        let i = 1;
        i <= remainingSlots && targetPage + i <= totalPages;
        i++
      ) {
        const nextPage = targetPage + i;
        if (!allLoadedPages.includes(nextPage)) {
          additionalPages.push(nextPage);
        }
      }
    } else if (targetPage === 1) {
      // We're on first page, load next pages only
      for (let i = 1; i <= rangesToFetch; i++) {
        const nextPage = targetPage + i;
        if (
          !allLoadedPages.includes(nextPage) &&
          (!totalPages || nextPage <= totalPages)
        ) {
          additionalPages.push(nextPage);
        }
      }
    } else {
      // We're in the middle, balance previous and next pages
      const prevPagesCount = Math.floor(rangesToFetch / 2);
      const nextPagesCount = Math.ceil(rangesToFetch / 2);

      // Add previous pages
      for (let i = 1; i <= prevPagesCount && targetPage - i >= 1; i++) {
        const prevPage = targetPage - i;
        if (!allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }

      // Add next pages
      for (let i = 1; i <= nextPagesCount; i++) {
        const nextPage = targetPage + i;
        if (
          !allLoadedPages.includes(nextPage) &&
          (!totalPages || nextPage <= totalPages)
        ) {
          additionalPages.push(nextPage);
        }
      }
    }

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `🔄 [PRELOAD] Additional pages to preload: [${additionalPages.join(
          ", "
        )}] (scrollJumpRangesToFetch: ${rangesToFetch})`
      );
    }

    // Load additional pages in background (fire and forget)
    if (additionalPages.length > 0) {
      loadAdditionalRangesInBackground(additionalPages, "PRELOAD");
    } else {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `ℹ️ [PRELOAD] No additional pages to preload (all adjacent pages already loaded)`
        );
      }
    }
  };

  /**
   * Load target page immediately, then load additional ranges in background
   * @param targetPage Target page number to jump to
   * @returns Promise that resolves when target page is loaded
   */
  const loadScrollJumpWithBackgroundRanges = async (
    targetPage: number
  ): Promise<void> => {
    const pageSize = config.pageSize || 20;
    const itemHeight = config.itemHeight || 84;
    const containerHeight = state.containerHeight || 400;

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(`🚀 [ScrollJump] Starting jump to page ${targetPage}`);
      console.log(
        `📏 [ScrollJump] Config: pageSize=${pageSize}, itemHeight=${itemHeight}, containerHeight=${containerHeight}`
      );
    }

    // Use ACTUAL current scroll position instead of page start
    // This ensures we calculate viewport pages based on where the user actually is
    const actualScrollPosition = state.scrollTop || 0;
    const actualIndex = Math.floor(actualScrollPosition / itemHeight);

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `📍 [ScrollJump] Using ACTUAL scroll position: ${actualScrollPosition}px (index ${actualIndex})`
      );
    }

    // Use precise viewport calculation with actual current position
    const viewportCalc = calculatePreciseViewportPages(
      actualIndex,
      containerHeight,
      itemHeight,
      pageSize,
      state.itemCount
    );

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `📊 [ScrollJump] Precise calculation for ACTUAL index ${actualIndex}:`
      );
      console.log(`  Target page (from scroll): ${targetPage}`);
      console.log(
        `  Calculated page (from position): ${viewportCalc.targetPage}`
      );
      console.log(`  Scroll position: ${viewportCalc.scrollPosition}px`);
      console.log(`  Items in viewport: ${viewportCalc.itemsInViewport}`);
      console.log(`  Pages in viewport: ${viewportCalc.pagesInViewport}`);
      console.log(
        `  Viewport pages needed: [${viewportCalc.viewportPages.join(", ")}]`
      );
    }

    // Load ALL viewport pages in parallel based on actual position
    const allViewportPages = viewportCalc.viewportPages;

    // Ensure target page is included even if not in calculated viewport
    if (!allViewportPages.includes(targetPage)) {
      allViewportPages.push(targetPage);
      allViewportPages.sort((a, b) => a - b);

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🔧 [ScrollJump] Added target page ${targetPage} to viewport pages: [${allViewportPages.join(
            ", "
          )}]`
        );
      }
    }

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `⚡ [VIEWPORT] Loading ALL ${
          allViewportPages.length
        } viewport pages in PARALLEL: [${allViewportPages.join(", ")}]`
      );
    }

    try {
      const startTime = performance.now();

      // Load all viewport pages in parallel
      const viewportPromises = allViewportPages.map((page, index) => {
        if (PLACEHOLDER.DEBUG_LOGGING) {
          console.log(
            `⚡ [VIEWPORT] Starting parallel load of page ${page} (${
              index + 1
            }/${allViewportPages.length})`
          );
        }

        // Only the target page should set scroll position
        return loadPage(page, {
          setScrollPosition: page === targetPage,
          replaceCollection: false,
        });
      });

      // Wait for ALL viewport pages to load before proceeding
      await Promise.all(viewportPromises);

      const endTime = performance.now();

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `✅ [VIEWPORT] All ${
            allViewportPages.length
          } viewport pages loaded in parallel (${Math.round(
            endTime - startTime
          )}ms)`
        );
        console.log(
          `🎯 [VIEWPORT] Viewport is now complete - no visual glitches!`
        );
      }
    } catch (error) {
      console.error(`❌ [VIEWPORT] Failed to load viewport pages:`, error);
      return;
    }

    // Step 3: Background preloading based on scrollJumpRangesToFetch
    const rangesToFetch =
      config.scrollJumpRangesToFetch || PAGINATION.SCROLL_JUMP_RANGES_TO_FETCH;

    if (rangesToFetch <= 0) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🔄 [PRELOAD] No additional preloading (scrollJumpRangesToFetch: ${rangesToFetch})`
        );
      }
      return;
    }

    // Calculate additional pages to preload (exclude already loaded pages)
    const totalPages = state.itemCount
      ? Math.ceil(state.itemCount / pageSize)
      : null;
    const additionalPages: number[] = [];
    const allLoadedPages = [...allViewportPages]; // All viewport pages are already loaded

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `🔄 [PRELOAD] Calculating ${rangesToFetch} additional pages to preload (excluding already loaded pages: [${allLoadedPages.join(
          ", "
        )}])`
      );
    }

    // Smart adjacent page calculation for preloading (use calculated target page, not input target page)
    const calculatedTargetPage = viewportCalc.targetPage;
    if (totalPages && calculatedTargetPage >= totalPages) {
      // We're on the last page, load previous pages only
      for (
        let i = 1;
        i <= rangesToFetch && calculatedTargetPage - i >= 1;
        i++
      ) {
        const prevPage = calculatedTargetPage - i;
        if (!allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }
    } else if (totalPages && calculatedTargetPage > totalPages - 2) {
      // We're near the end, prioritize previous pages
      const prevPagesCount = Math.min(rangesToFetch, calculatedTargetPage - 1);
      for (let i = 1; i <= prevPagesCount; i++) {
        const prevPage = calculatedTargetPage - i;
        if (!allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }
      // Add any remaining as next pages (if they exist)
      const remainingSlots = rangesToFetch - additionalPages.length;
      for (
        let i = 1;
        i <= remainingSlots && calculatedTargetPage + i <= totalPages;
        i++
      ) {
        const nextPage = calculatedTargetPage + i;
        if (!allLoadedPages.includes(nextPage)) {
          additionalPages.push(nextPage);
        }
      }
    } else if (calculatedTargetPage === 1) {
      // We're on first page, load next pages only
      for (let i = 1; i <= rangesToFetch; i++) {
        const nextPage = calculatedTargetPage + i;
        if (
          !allLoadedPages.includes(nextPage) &&
          (!totalPages || nextPage <= totalPages)
        ) {
          additionalPages.push(nextPage);
        }
      }
    } else {
      // We're in the middle, balance previous and next pages
      const prevPagesCount = Math.floor(rangesToFetch / 2);
      const nextPagesCount = Math.ceil(rangesToFetch / 2);

      // Add previous pages
      for (
        let i = 1;
        i <= prevPagesCount && calculatedTargetPage - i >= 1;
        i++
      ) {
        const prevPage = calculatedTargetPage - i;
        if (!allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }

      // Add next pages
      for (let i = 1; i <= nextPagesCount; i++) {
        const nextPage = calculatedTargetPage + i;
        if (
          !allLoadedPages.includes(nextPage) &&
          (!totalPages || nextPage <= totalPages)
        ) {
          additionalPages.push(nextPage);
        }
      }
    }

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `🔄 [PRELOAD] Additional pages to preload: [${additionalPages.join(
          ", "
        )}] (scrollJumpRangesToFetch: ${rangesToFetch})`
      );
    }

    // Load additional pages in background (fire and forget)
    if (additionalPages.length > 0) {
      loadAdditionalRangesInBackground(additionalPages, "PRELOAD");
    } else {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `ℹ️ [PRELOAD] No additional pages to preload (all adjacent pages already loaded)`
        );
      }
    }
  };

  /**
   * Schedule a page load when scrolling stops (debounced)
   * @param targetPage Page to load when scrolling stops
   */
  const scheduleScrollStopPageLoad = (targetPage: number): void => {
    const timeoutState = timeoutManager.getState();

    // If we're already debouncing a scroll jump, reset the timer
    if (timeoutState.isScrollJumpInProgress) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`⏰ Updating scroll jump to page ${targetPage}`);
      }
    } else {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`⏰ Scroll jump to page ${targetPage}`);
      }
    }

    // Use timeout manager to handle debounced scroll jump
    timeoutManager.setScrollJumpState(() => {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`🚀 Loading page ${targetPage}`);
      }
      loadScrollJumpWithBackgroundRanges(targetPage)
        .then(() => {
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(
              `✅ [SCROLL_JUMP] Page ${targetPage} loaded successfully`
            );
            console.log(
              `📊 [SCROLL_JUMP] POST-LOAD: Scroll position: ${state.scrollTop}, Page: ${state.page}`
            );
            console.log(
              `📊 [SCROLL_JUMP] POST-LOAD: Items in state: ${
                state.items.length
              }, Visible items: ${state.visibleItems?.length || 0}`
            );
          }
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
