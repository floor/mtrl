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
  updateVisibleItems: (scrollTop?: number, isPageJump?: boolean) => void;
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

  // Removed verbose viewport calculation logging

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
  const { state, config, loadPage, updateVisibleItems, timeoutManager } = deps;

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
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        try {
          await loadPage(page, {
            setScrollPosition: false,
            replaceCollection: false,
          });
          successCount++;

          // Small delay between background requests to avoid overwhelming the API
          if (i < pages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } catch (error) {
          failureCount++;
          // Continue loading other pages even if one fails
        }
      }

      if (failureCount > 0) {
        console.warn(
          `⚠️ [BackgroundLoad] ${failureCount}/${pages.length} pages failed`
        );
      }
    }, 10);
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
    animate: boolean = false,
    isProgrammatic: boolean = true
  ): Promise<void> => {
    const currentState = timeoutManager.getState();
    const timestamp = performance.now();

    // Pre-calculate common values to avoid redeclaration
    const itemHeight = config.itemHeight || 84;
    const targetScrollPosition = targetIndex * itemHeight;
    const currentScrollTop = state.scrollTop || 0;

    // 🚨 FEEDBACK LOOP PREVENTION: Check if we're repeatedly trying to scroll to the same position
    const lastOperation = (state as any).lastScrollOperation;
    const now = performance.now();
    const timeSinceLastSame =
      lastOperation?.targetIndex === targetIndex
        ? now - lastOperation.timestamp
        : Infinity;

    if (timeSinceLastSame < 300) {
      // Prevent same operation within 300ms (reduced from 500ms for better responsiveness)
      console.warn(
        "🚨 [FEEDBACK LOOP] Preventing repeated scroll to same position:",
        {
          targetIndex,
          timeSinceLastSame: `${timeSinceLastSame.toFixed(0)}ms`,
          action: "CANCELING_DUPLICATE_SCROLL",
        }
      );
      return;
    }

    // 🎯 POSITION CHECK: If we're already at the correct position with the RIGHT data, skip
    const scrollDifference = Math.abs(currentScrollTop - targetScrollPosition);

    // Check if visible items are actually for the target position
    const targetPageSize = config.pageSize || 30;
    const targetPage = Math.floor(targetIndex / targetPageSize) + 1;
    const targetPageStartIndex = (targetPage - 1) * targetPageSize;
    const targetPageEndIndex = targetPageStartIndex + targetPageSize - 1;

    const hasCorrectData = state.visibleItems.some((item) => {
      const itemIndex = state.items.findIndex(
        (stateItem) => stateItem.id === item.id
      );
      return (
        itemIndex >= targetPageStartIndex && itemIndex <= targetPageEndIndex
      );
    });

    if (
      scrollDifference < itemHeight &&
      state.visibleItems.length > 0 &&
      hasCorrectData
    ) {
      console.log(
        "🎯 [POSITION CHECK] Already at target position with correct data:",
        {
          targetIndex,
          currentScrollTop,
          targetScrollPosition,
          scrollDifference,
          visibleItems: state.visibleItems.length,
          targetPage,
          targetPageRange: `${targetPageStartIndex}-${targetPageEndIndex}`,
          hasCorrectData,
          action: "SKIPPING_SCROLL_JUMP",
        }
      );
      return;
    } else if (
      scrollDifference < itemHeight &&
      state.visibleItems.length > 0 &&
      !hasCorrectData
    ) {
      console.warn(
        "🚨 [POSITION CHECK] At target position but with WRONG data:",
        {
          targetIndex,
          currentScrollTop,
          targetScrollPosition,
          scrollDifference,
          visibleItems: state.visibleItems.length,
          targetPage,
          targetPageRange: `${targetPageStartIndex}-${targetPageEndIndex}`,
          hasCorrectData,
          action: "PROCEEDING_WITH_SCROLL_JUMP",
          reason: "Need to load correct data for this position",
        }
      );
    }

    // Store current operation to prevent feedback loops
    (state as any).lastScrollOperation = { targetIndex, timestamp: now };

    console.log("🚀 [ScrollJump] Starting scroll-to-index:", {
      targetIndex,
      animate,
      isProgrammatic,
      currentState: currentState.isScrollJumpInProgress,
    });

    // 🚨 RACE CONDITION DETECTION & PREVENTION
    console.log("🔍 [RACE CHECK] Checking for race condition:", {
      isScrollJumpInProgress: currentState.isScrollJumpInProgress,
      isProgrammatic,
      targetIndex,
    });

    if (currentState.isScrollJumpInProgress) {
      console.warn(
        "⚠️ [RACE CONDITION] Canceling - another scroll jump in progress!",
        {
          targetIndex,
          isProgrammatic,
          currentState,
          action: "CANCELING_SCROLL_JUMP",
        }
      );
      return;
    }

    console.log("✅ [RACE CHECK] No race condition detected, proceeding");

    // Set scroll jump flag to prevent boundary detection interference
    timeoutManager.updateState({ isScrollJumpInProgress: true });

    // 🎬 SIMPLE PLACEHOLDER RENDERING: Use current position only for manual scrolling
    const scrollMovement = Math.abs(currentScrollTop - targetScrollPosition);
    const useCurrentPosition =
      !isProgrammatic && scrollMovement > itemHeight * 3; // Only for manual scrolling

    const placeholderPosition = useCurrentPosition
      ? currentScrollTop
      : targetScrollPosition;

    console.log("🎬 [PLACEHOLDER] Rendering placeholders:", {
      targetIndex,
      isProgrammatic,
      useCurrentPosition,
      placeholderPosition: placeholderPosition.toFixed(0),
    });

    // Force immediate viewport update with placeholders
    if (typeof updateVisibleItems === "function") {
      updateVisibleItems(placeholderPosition, true);
    }

    try {
      const pageSize = config.pageSize || 20;
      const containerHeight = state.containerHeight || 400;

      // Use precise viewport calculation - adjust for scrollbar dragging
      const adjustedIndex = useCurrentPosition
        ? Math.floor(currentScrollTop / itemHeight)
        : targetIndex;
      const viewportCalc = calculatePreciseViewportPages(
        adjustedIndex,
        containerHeight,
        itemHeight,
        pageSize,
        useCurrentPosition ? currentScrollTop : state.scrollTop || 0,
        state.itemCount
      );

      if (useCurrentPosition) {
        console.log("📐 [VIEWPORT CALC] Using current position:", {
          originalTargetIndex: targetIndex,
          adjustedIndex,
          currentScrollTop,
          viewportPages: viewportCalc.viewportPages,
          targetPage: viewportCalc.targetPage,
        });
      }

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

          // Reduced logging for cleaner output

          return loadPage(page, loadOptions);
        });

        // Wait for ALL viewport pages to load before proceeding
        const results = await Promise.all(viewportPromises);

        const totalItemsLoaded = results.reduce(
          (sum, r) => sum + r.items.length,
          0
        );
        console.log(
          `✅ [ViewportLoading] Loaded ${allViewportPages.length} pages (${totalItemsLoaded} items)`
        );

        // 🚨 CRITICAL CHECK: Detect empty page loads
        results.forEach((result, index) => {
          const pageNumber = allViewportPages[index];
          if (result.items.length === 0) {
            console.error(
              `🚨 [EMPTY PAGE] Page ${pageNumber} returned 0 items:`,
              {
                pageNumber,
                targetIndex,
                hasNext: result.hasNext,
                expectedItems: config.pageSize || 30,
                totalItems: state.itemCount,
                maxPage: state.itemCount
                  ? Math.ceil(state.itemCount / (config.pageSize || 30))
                  : "unknown",
                possibleCauses: [
                  "Page beyond data range",
                  "API/data source returned empty",
                  "Page calculation error",
                  "Race condition in data loading",
                ],
              }
            );
          }
        });
      } catch (error) {
        console.error("❌ [ViewportLoading] FAILED:", error.message);
        return;
      }

      // Background preloading based on adjacentPagesPreload configuration
      let preloadBefore: number;
      let preloadAfter: number;

      if (
        config.adjacentPagesPreloadBefore !== undefined ||
        config.adjacentPagesPreloadAfter !== undefined
      ) {
        preloadBefore =
          config.adjacentPagesPreloadBefore ??
          PAGINATION.ADJACENT_PAGES_PRELOAD_BEFORE;
        preloadAfter =
          config.adjacentPagesPreloadAfter ??
          PAGINATION.ADJACENT_PAGES_PRELOAD_AFTER;
      } else {
        const legacyTotal =
          config.adjacentPagesPreload ?? PAGINATION.ADJACENT_PAGES_PRELOAD;
        preloadBefore = Math.floor(legacyTotal / 2);
        preloadAfter = Math.ceil(legacyTotal / 2);
      }

      if (preloadBefore <= 0 && preloadAfter <= 0) {
        return;
      }

      // Calculate additional pages to preload
      const totalPages = state.itemCount
        ? Math.ceil(state.itemCount / pageSize)
        : null;
      const additionalPages: number[] = [];
      const allLoadedPages = [...allViewportPages];

      const firstViewportPage = Math.min(...viewportCalc.viewportPages);
      const lastViewportPage = Math.max(...viewportCalc.viewportPages);

      // Add BEFORE pages
      for (let i = 1; i <= preloadBefore; i++) {
        const prevPage = firstViewportPage - i;
        if (prevPage >= 1 && !allLoadedPages.includes(prevPage)) {
          additionalPages.push(prevPage);
        }
      }

      // Add AFTER pages
      for (let i = 1; i <= preloadAfter; i++) {
        const nextPage = lastViewportPage + i;
        if (
          (!totalPages || nextPage <= totalPages) &&
          !allLoadedPages.includes(nextPage)
        ) {
          additionalPages.push(nextPage);
        }
      }

      // Load additional pages in background
      if (additionalPages.length > 0) {
        loadAdditionalRangesInBackground(additionalPages, "PRELOAD");
      }

      console.log(`✅ [ScrollJump] Completed for index ${targetIndex}`);
    } catch (error) {
      console.error(
        `❌ [ScrollJump] FAILED for index ${targetIndex}:`,
        error.message
      );
    } finally {
      // Always clear the scroll jump flag when done
      timeoutManager.updateState({ isScrollJumpInProgress: false });

      // 🚨 SIMPLE FINAL RENDER: Use current position only for manual scrolling
      setTimeout(() => {
        const currentScrollTop = state.scrollTop || 0;
        const currentIndex = Math.floor(currentScrollTop / itemHeight);
        const currentPage =
          Math.floor(currentIndex / (config.pageSize || 20)) + 1;

        // Only use current position for manual scrolling, not programmatic
        const movement = Math.abs(currentScrollTop - targetScrollPosition);
        const useCurrentPosition = !isProgrammatic && movement > itemHeight * 3;

        const finalPage = useCurrentPosition
          ? currentPage
          : Math.floor(targetIndex / (config.pageSize || 20)) + 1;

        console.log(
          `🔄 [FINAL RENDER] Loading page ${finalPage} ${
            useCurrentPosition ? "(current position)" : "(original target)"
          }`
        );

        // Force load the page with scroll position set to ensure rendering
        loadPage(finalPage, {
          setScrollPosition: true,
          replaceCollection: true,
          animate: false,
        })
          .then((result) => {
            console.log(
              `✅ [FINAL RENDER] Page ${finalPage} complete: ${result.items.length} items`
            );
          })
          .catch((error) => {
            console.error(`❌ [FINAL RENDER] Failed:`, error.message);
          });
      }, 50);
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
    const currentState = timeoutManager.getState();
    const timestamp = performance.now();

    console.log(
      "🚀 [ScrollJump-Page] Starting scroll-to-page with background ranges:",
      {
        targetPage,
        animate,
        scrollJumpInProgress: currentState.isScrollJumpInProgress,
        timestamp,
        timeoutState: currentState,
      }
    );

    // 🚨 RACE CONDITION DETECTION & PREVENTION
    if (currentState.isScrollJumpInProgress) {
      console.warn(
        "⚠️ [RACE CONDITION] Canceling new page scroll jump - another is in progress!",
        {
          targetPage,
          existingState: currentState,
          timestamp,
          possibleCause: "User scrolled before previous scroll jump completed",
          action: "CANCELING_NEW_PAGE_SCROLL_JUMP",
        }
      );

      // 🛑 CANCEL this scroll jump to prevent viewport data mismatch
      return;
    }

    // Set scroll jump flag to prevent boundary detection interference
    timeoutManager.updateState({ isScrollJumpInProgress: true });

    console.log(
      "🔗 [loadScrollJumpWithBackgroundRanges] Loading page:",
      targetPage
    );

    try {
      const pageSize = config.pageSize || 20;
      const containerHeight = state.containerHeight || 400;

      // Use ACTUAL current scroll position instead of page start
      // This ensures we calculate viewport pages based on where the user actually is
      const actualScrollPosition = state.scrollTop || 0;
      const itemHeight = config.itemHeight || 84;
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

      console.log(
        "🎉 [ScrollJump-Page] Scroll-to-page operation completed successfully:",
        {
          targetPage,
          viewportPagesLoaded: allViewportPages,
          preloadPagesScheduled:
            additionalPages.length > 0 ? additionalPages : "none",
        }
      );
    } catch (error) {
      console.error(
        "💥 [ScrollJump-Page] CRITICAL ERROR in scroll-to-page operation:",
        {
          targetPage,
          error: error.message,
          stack: error.stack,
        }
      );
    } finally {
      // Always clear the scroll jump flag when done
      console.log("🔄 [ScrollJump-Page] Clearing scroll jump flag");
      timeoutManager.updateState({ isScrollJumpInProgress: false });
    }
  };

  /**
   * Schedule a page load when scrolling stops (debounced)
   * @param targetPage Page to load when scrolling stops
   */
  const scheduleScrollStopPageLoad = (targetPage: number): void => {
    // Use timeout manager to handle debounced scroll jump
    timeoutManager.setScrollJumpState(() => {
      // For manual scrolling, use current position instead of target page
      const currentScrollTop = state.scrollTop || 0;
      const itemHeight = config.itemHeight || 84;
      const currentIndex = Math.floor(currentScrollTop / itemHeight);

      const currentState = timeoutManager.getState();

      console.log(
        `🚀 [ScheduledScroll] Loading for current position: index ${currentIndex} (was page ${targetPage})`,
        {
          currentScrollTop,
          currentIndex,
          targetPage,
          isScrollJumpInProgress: currentState.isScrollJumpInProgress,
          timestamp: performance.now(),
        }
      );

      // If there's already a scroll jump in progress, wait a bit and try again
      if (currentState.isScrollJumpInProgress) {
        console.log(
          "⏳ [ScheduledScroll] Waiting for existing scroll jump to complete..."
        );
        setTimeout(() => {
          const retryState = timeoutManager.getState();
          if (!retryState.isScrollJumpInProgress) {
            console.log(
              "🔄 [ScheduledScroll] Retrying after scroll jump completed"
            );
            loadScrollToIndexWithBackgroundRanges(
              currentIndex,
              false,
              false
            ).catch(handleError);
          } else {
            console.warn(
              "⚠️ [ScheduledScroll] Giving up - scroll jump still in progress after retry"
            );
          }
        }, 100);
        return;
      }

      const handleError = (error) => {
        console.error(
          `❌ [ScheduledScroll] Failed for index ${currentIndex}:`,
          error.message
        );
        // Fallback to simple page load
        const currentPage =
          Math.floor(currentIndex / (config.pageSize || 20)) + 1;
        loadPage(currentPage);
      };

      loadScrollToIndexWithBackgroundRanges(currentIndex, false, false).catch(
        handleError
      );
    }, BOUNDARIES.SCROLL_JUMP_LOAD_DEBOUNCE);
  };

  return {
    scheduleScrollStopPageLoad,
    loadScrollJumpWithBackgroundRanges,
    loadAdditionalRangesInBackground,
    loadScrollToIndexWithBackgroundRanges,
  };
};
