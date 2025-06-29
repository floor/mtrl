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
    updateState: (updates: any) => void;
  };
}

/**
 * Precisely calculate which pages are needed to fill the viewport from a target index
 * @param targetIndex The 0-based index we're scrolling to
 * @param viewportHeight Height of the viewport in pixels
 * @param itemHeight Height of each item in pixels
 * @param pageSize Number of items per page
 * @param actualScrollPosition The actual current scroll position in pixels
 * @param totalItems Total number of items (optional, for bounds checking)
 * @returns Object with target page and all pages needed for viewport
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

  // Use actual scroll position instead of calculated position
  const scrollPosition = actualScrollPosition;

  // Calculate how many items fit in the viewport
  const itemsInViewport = Math.ceil(viewportHeight / itemHeight);

  // Calculate viewport boundaries with a small buffer for precision
  // The buffer accounts for partial items and scroll position variations
  const bufferItems = 1; // Add 1 item buffer on each side
  const bufferPixels = bufferItems * itemHeight;

  const viewportStartPixel = Math.max(0, scrollPosition - bufferPixels);
  const viewportEndPixel = scrollPosition + viewportHeight + bufferPixels;

  // Calculate which items are visible in this expanded viewport
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

  // Debug logging
  if (PLACEHOLDER.DEBUG_LOGGING) {
    console.log(
      `🧮 [ViewportCalc] Detailed calculation (with ${bufferItems} item buffer):`
    );
    console.log(`  Target index: ${targetIndex}, Target page: ${targetPage}`);
    console.log(
      `  Actual scroll position: ${scrollPosition}px (was: ${
        targetIndex * itemHeight
      }px calculated)`
    );
    console.log(
      `  Buffered viewport: ${viewportStartPixel}px - ${viewportEndPixel}px (${viewportHeight}px + ${
        bufferPixels * 2
      }px buffer)`
    );
    console.log(
      `  Visible items: ${viewportStartIndex} - ${viewportEndIndex} (${itemsInViewport} items + buffer)`
    );
    console.log(
      `  Page range: ${startPage} - ${endPage} = [${viewportPages.join(", ")}]`
    );
  }

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
    // Set scroll jump flag to prevent boundary detection interference
    timeoutManager.updateState({ isScrollJumpInProgress: true });

    try {
      // Clear console for cleaner debugging
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.clear();
        console.log(`🧹 [ScrollToIndex] Console cleared for clean debugging`);
        console.log(`🔒 [ScrollToIndex] Scroll jump protection ENABLED`);
      }

      const pageSize = config.pageSize || 20;
      const itemHeight = config.itemHeight || 84;
      const containerHeight = state.containerHeight || 400;

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🚀 [ScrollToIndex] Starting scroll to index ${targetIndex}`
        );
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
        state.scrollTop || 0,
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

      // Load ALL viewport pages in parallel based on actual position
      const allViewportPages = viewportCalc.viewportPages;

      // Note: We don't force-add the target page since the precise calculation
      // already determines which pages are actually needed for the viewport
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
        if (PLACEHOLDER.DEBUG_LOGGING) {
          console.log(
            `🔄 [PRELOAD] No additional preloading (before: ${preloadBefore}, after: ${preloadAfter})`
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
          `🔄 [PRELOAD] Calculating pages to preload: ${preloadBefore} before + ${preloadAfter} after (excluding already loaded pages: [${allLoadedPages.join(
            ", "
          )}])`
        );
      }

      // Smart adjacent page calculation for preloading
      const firstViewportPage = Math.min(...viewportCalc.viewportPages); // First page in viewport
      const lastViewportPage = Math.max(...viewportCalc.viewportPages); // Last page in viewport

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`🔄 [PRELOAD] Preload calculation details:`);
        console.log(`  First viewport page: ${firstViewportPage}`);
        console.log(`  Last viewport page: ${lastViewportPage}`);
        console.log(`  Preload before: ${preloadBefore} pages`);
        console.log(`  Preload after: ${preloadAfter} pages`);
      }

      // Add BEFORE pages (start from FIRST page of viewport, not target page)
      for (let i = 1; i <= preloadBefore; i++) {
        const prevPage = firstViewportPage - i;
        if (prevPage >= 1 && !allLoadedPages.includes(prevPage)) {
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(
              `  ⬅️ Adding BEFORE page: ${prevPage} (${firstViewportPage} - ${i})`
            );
          }
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
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(
              `  ➡️ Adding AFTER page: ${nextPage} (${lastViewportPage} + ${i})`
            );
          }
          additionalPages.push(nextPage);
        }
      }

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🔄 [PRELOAD] Additional pages to preload: [${additionalPages.join(
            ", "
          )}] (before: ${preloadBefore}, after: ${preloadAfter})`
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
    } catch (error) {
      console.error(`❌ [ScrollToIndex] Scroll jump failed:`, error);
    } finally {
      // Always clear the scroll jump flag when done
      timeoutManager.updateState({ isScrollJumpInProgress: false });
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`🔓 [ScrollToIndex] Scroll jump protection DISABLED`);
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
    // Set scroll jump flag to prevent boundary detection interference
    timeoutManager.updateState({ isScrollJumpInProgress: true });

    try {
      // Clear console for cleaner debugging
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.clear();
        console.log(`🧹 [ScrollJump] Console cleared for clean debugging`);
        console.log(`🔒 [ScrollJump] Scroll jump protection ENABLED`);
      }

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
        actualScrollPosition,
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
        console.log(
          `  First viewport page: ${Math.min(...viewportCalc.viewportPages)}`
        );
        console.log(
          `  Last viewport page: ${Math.max(...viewportCalc.viewportPages)}`
        );

        if (targetPage !== viewportCalc.targetPage) {
          console.log(
            `⚠️ [ScrollJump] Target page mismatch! Input: ${targetPage}, Calculated: ${
              viewportCalc.targetPage
            } (${Math.abs(
              targetPage - viewportCalc.targetPage
            )} pages difference)`
          );
          console.log(
            `⚠️ [ScrollJump] This suggests scroll jump was triggered with stale information or user scrolled during debounce`
          );
        }
      }

      // Load ALL viewport pages in parallel based on actual position
      const allViewportPages = viewportCalc.viewportPages;

      // Note: We don't force-add the target page since the precise calculation
      // already determines which pages are actually needed for the viewport
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
        if (PLACEHOLDER.DEBUG_LOGGING) {
          console.log(
            `🔄 [PRELOAD] No additional preloading (before: ${preloadBefore}, after: ${preloadAfter})`
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
          `🔄 [PRELOAD] Calculating pages to preload: ${preloadBefore} before + ${preloadAfter} after (excluding already loaded pages: [${allLoadedPages.join(
            ", "
          )}])`
        );
      }

      // Smart adjacent page calculation for preloading
      const firstViewportPage = Math.min(...viewportCalc.viewportPages); // First page in viewport
      const lastViewportPage = Math.max(...viewportCalc.viewportPages); // Last page in viewport

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`🔄 [PRELOAD] Preload calculation details:`);
        console.log(`  First viewport page: ${firstViewportPage}`);
        console.log(`  Last viewport page: ${lastViewportPage}`);
        console.log(`  Preload before: ${preloadBefore} pages`);
        console.log(`  Preload after: ${preloadAfter} pages`);
      }

      // Add BEFORE pages (start from FIRST page of viewport, not target page)
      for (let i = 1; i <= preloadBefore; i++) {
        const prevPage = firstViewportPage - i;
        if (prevPage >= 1 && !allLoadedPages.includes(prevPage)) {
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(
              `  ⬅️ Adding BEFORE page: ${prevPage} (${firstViewportPage} - ${i})`
            );
          }
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
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(
              `  ➡️ Adding AFTER page: ${nextPage} (${lastViewportPage} + ${i})`
            );
          }
          additionalPages.push(nextPage);
        }
      }

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🔄 [PRELOAD] Additional pages to preload: [${additionalPages.join(
            ", "
          )}] (before: ${preloadBefore}, after: ${preloadAfter})`
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
    } catch (error) {
      console.error(`❌ [ScrollJump] Scroll jump failed:`, error);
    } finally {
      // Always clear the scroll jump flag when done
      timeoutManager.updateState({ isScrollJumpInProgress: false });
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`🔓 [ScrollJump] Scroll jump protection DISABLED`);
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
