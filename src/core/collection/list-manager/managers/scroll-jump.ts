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

    // Calculate how many items and pages are needed to fill the viewport
    const itemsPerViewport = Math.ceil(containerHeight / itemHeight);
    const pagesNeededForViewport = Math.ceil(itemsPerViewport / pageSize);

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `📊 [ScrollJump] Viewport analysis: ${itemsPerViewport} items needed, ${pagesNeededForViewport} pages minimum`
      );
    }

    // Step 1: First load the target page to establish scroll position
    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(`🎯 [ScrollJump] Loading target page ${targetPage} first`);
    }

    try {
      await loadPage(targetPage, {
        setScrollPosition: true, // This will set the scroll position
        replaceCollection: false, // Don't clear existing data
      });

      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`✅ [ScrollJump] Target page ${targetPage} loaded`);
      }
    } catch (error) {
      console.error(`❌ [ScrollJump] Failed to load target page:`, error);
      return;
    }

    // Step 2: Wait a moment for scroll position to stabilize, then use ACTUAL scroll position
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Get the ACTUAL scroll position after the jump
    const actualScrollPosition = state.scrollTop;

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `📍 [ScrollJump] Actual scroll position after jump: ${actualScrollPosition}px`
      );
    }

    // Phase 1: Calculate which pages are needed to fill the viewport based on ACTUAL scroll position
    // Add larger buffer zone to account for scroll position drift and between-page landings
    const bufferItems = Math.max(pageSize, Math.ceil(pageSize * 0.5)); // 50% of page size or full page minimum
    const bufferPixels = bufferItems * itemHeight;

    // Calculate expanded viewport to handle scroll position uncertainties
    const viewportStartPixel = Math.max(0, actualScrollPosition - bufferPixels);
    const viewportEndPixel =
      actualScrollPosition + containerHeight + bufferPixels;

    const viewportStartItem = Math.floor(viewportStartPixel / itemHeight);
    const viewportEndItem = Math.floor(viewportEndPixel / itemHeight);

    const startPage = Math.max(1, Math.floor(viewportStartItem / pageSize) + 1);
    const endPage = Math.max(
      startPage,
      Math.floor(viewportEndItem / pageSize) + 1
    );

    // Build conservative page range
    const viewportPages: number[] = [];
    for (let page = startPage; page <= endPage; page++) {
      viewportPages.push(page);
    }

    // Add adjacent pages for extra safety when landing between pages
    const minPage = Math.max(1, targetPage - 1);
    const maxPage = targetPage + 1;

    for (let page = minPage; page <= maxPage; page++) {
      if (!viewportPages.includes(page)) {
        viewportPages.push(page);
      }
    }

    viewportPages.sort((a, b) => a - b);

    // Remove the target page since we already loaded it
    const additionalViewportPages = viewportPages.filter(
      (page) => page !== targetPage
    );

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `🎯 [ScrollJump] Actual scroll position: ${actualScrollPosition}px (±${bufferPixels}px buffer)`
      );
      console.log(
        `📍 [ScrollJump] Expanded viewport spans items ${viewportStartItem}-${viewportEndItem} (with large buffer)`
      );
      console.log(
        `📄 [ScrollJump] Additional pages needed: [${additionalViewportPages.join(
          ", "
        )}] (${
          additionalViewportPages.length
        } pages, target page ${targetPage} already loaded)`
      );
    }

    // Phase 1: Load additional viewport pages in PARALLEL (essential for filling viewport)
    if (additionalViewportPages.length > 0) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `⚡ [VIEWPORT] Loading ${
            additionalViewportPages.length
          } additional pages in PARALLEL: [${additionalViewportPages.join(
            ", "
          )}]`
        );
      }

      try {
        const startTime = performance.now();

        const viewportPromises = additionalViewportPages.map((page, index) => {
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(
              `⚡ [VIEWPORT] Starting parallel load of page ${page} (${
                index + 1
              }/${additionalViewportPages.length})`
            );
          }

          return loadPage(page, {
            setScrollPosition: false, // Don't change scroll position for additional pages
            replaceCollection: false, // Never clear collection during scroll jumps - only append new data
          });
        });

        await Promise.all(viewportPromises);

        const endTime = performance.now();

        if (PLACEHOLDER.DEBUG_LOGGING) {
          console.log(
            `✅ [VIEWPORT] All ${
              additionalViewportPages.length
            } additional pages loaded in parallel (${Math.round(
              endTime - startTime
            )}ms)`
          );
        }
      } catch (error) {
        console.error(
          `❌ [VIEWPORT] Failed to load additional viewport pages:`,
          error
        );
      }
    } else {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(`ℹ️ [VIEWPORT] No additional pages needed for viewport`);
      }
    }

    // Phase 2: Additional preloading based on scrollJumpRangesToFetch
    const rangesToFetch =
      config.scrollJumpRangesToFetch || PAGINATION.SCROLL_JUMP_RANGES_TO_FETCH;

    if (rangesToFetch <= 0) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🔄 [PRELOAD] No additional preloading (scrollJumpRangesToFetch: ${rangesToFetch})`
        );
      }
      return; // No additional preloading
    }

    // Calculate additional pages to preload (exclude already loaded pages)
    const totalPages = state.itemCount
      ? Math.ceil(state.itemCount / pageSize)
      : null;
    const additionalPages: number[] = [];
    const pagesNeeded = rangesToFetch; // Total additional pages to preload
    const allLoadedPages = [targetPage, ...additionalViewportPages]; // All pages we've already loaded

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `🔄 [PRELOAD] Calculating ${pagesNeeded} additional pages to preload (excluding already loaded pages: [${allLoadedPages.join(
          ", "
        )}])`
      );
    }

    // Smart adjacent page calculation for preloading
    if (totalPages && targetPage >= totalPages) {
      // We're on the last page, load previous pages only
      for (let i = 1; i <= pagesNeeded && targetPage - i >= 1; i++) {
        const prevPage = targetPage - i;
        if (!allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }
    } else if (totalPages && targetPage > totalPages - 2) {
      // We're near the end, prioritize previous pages
      const prevPagesCount = Math.min(pagesNeeded, targetPage - 1);
      for (let i = 1; i <= prevPagesCount; i++) {
        const prevPage = targetPage - i;
        if (!allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }
      // Add any remaining as next pages (if they exist)
      const remainingSlots = pagesNeeded - additionalPages.length;
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
      for (let i = 1; i <= pagesNeeded; i++) {
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
      const prevPagesCount = Math.floor(pagesNeeded / 2);
      const nextPagesCount = Math.ceil(pagesNeeded / 2);

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

    // Phase 2: Load additional pages in background (don't await - fire and forget)
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
            console.log(`✅ Page ${targetPage} loaded`);
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
  };
};
