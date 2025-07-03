/**
 * Scroll Jump Operations
 */
import { ListManagerState, ListManagerConfig } from "../types";
import { PAGINATION, BOUNDARIES } from "../constants";
import {
  calcViewportPages,
  calcViewportOffset,
  devLog,
  logError,
} from "./utils";
import { SCROLL } from "../constants";

export interface ScrollJumpDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  container: HTMLElement;
  loadPage: (
    pageNumber: number,
    options?: any
  ) => Promise<{ hasNext: boolean; items: any[] }>;
  loadItems: (params?: any) => Promise<{ items: any[]; meta: any }>;
  updateVisibleItems: (scrollTop?: number, isPageJump?: boolean) => void;
  timeoutManager: {
    setScrollJumpState: (callback: () => void, delay?: number) => void;
    getState: () => { isScrollJumpInProgress: boolean };
    updateState: (updates: any) => void;
  };
}

export const createScrollJumpFunctions = (deps: ScrollJumpDependencies) => {
  const {
    state,
    config,
    container,
    loadPage,
    loadItems,
    updateVisibleItems,
    timeoutManager,
  } = deps;

  /**
   * Load data using offset-based pagination
   */
  const loadOffsetData = async (offset: number, limit: number) => {
    // 🎯 DIRECT OFFSET API CALL: Let the route adapter handle parameter building
    const apiParams = { offset, limit };

    console.log(
      `🚀 [OFFSET-API] Making direct API call with offset=${offset}, limit=${limit}`
    );

    try {
      // Direct API call - the route adapter will handle parameter naming
      const response = await loadItems(apiParams);

      console.log(
        `✅ [OFFSET-API] Direct API call successful: ${response.items.length} items loaded`
      );

      return response;
    } catch (error) {
      console.error(`❌ [OFFSET-API] Direct API call failed:`, error);

      // Fallback to page-based loading if offset API fails
      console.log(`🔄 [OFFSET-FALLBACK] Converting to page-based loading`);
      const pageSize = config.pageSize || 20;
      const startPage = Math.floor(offset / pageSize) + 1;
      const endPage = Math.floor((offset + limit - 1) / pageSize) + 1;

      const pagePromises = [];
      for (let page = startPage; page <= endPage; page++) {
        pagePromises.push(
          loadPage(page, {
            setScrollPosition: false,
            replaceCollection: false,
            animate: false,
          })
        );
      }

      const results = await Promise.all(pagePromises);
      return { items: results.flatMap((r) => r.items) };
    }
  };

  const loadAdditionalRangesInBackground = (pages: number[]): void => {
    setTimeout(async () => {
      for (const page of pages) {
        try {
          await loadPage(page, {
            setScrollPosition: false,
            replaceCollection: false,
          });
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          logError(`Background load failed for page ${page}`, error);
        }
      }
    }, 10);
  };

  const loadScrollToIndexWithBackgroundRanges = async (
    targetIndex: number,
    animate: boolean = false,
    isProgrammatic: boolean = true
  ): Promise<void> => {
    console.log(
      `🚀 [SCROLL-JUMP] Starting: targetIndex=${targetIndex}, animate=${animate}, isProgrammatic=${isProgrammatic}`
    );
    const currentState = timeoutManager.getState();
    const itemHeight = config.itemHeight || 84;
    const targetScrollPosition = targetIndex * itemHeight;
    const currentScrollTop = state.scrollTop || 0;

    // Prevent duplicate operations
    const lastOp = (state as any).lastScrollOperation;
    const now = performance.now();
    if (lastOp?.targetIndex === targetIndex && now - lastOp.timestamp < 100) {
      devLog("Duplicate scroll prevented");
      return;
    }

    // Check if already at position with correct data
    const scrollDiff = Math.abs(currentScrollTop - targetScrollPosition);
    const pageSize = config.pageSize || 30;
    const targetPage = Math.floor(targetIndex / pageSize) + 1;
    const hasCorrectData = state.visibleItems.some((item) => {
      const idx = state.items.findIndex((s) => s.id === item.id);
      const start = (targetPage - 1) * pageSize;
      return idx >= start && idx < start + pageSize;
    });

    if (scrollDiff < itemHeight && hasCorrectData) {
      console.log(
        `✅ [SCROLL-JUMP] Already at target position: targetIndex=${targetIndex}`
      );
      return;
    }

    console.log(
      `🔄 [SCROLL-JUMP] Position check passed, continuing with loading`
    );

    // 🔥 REMOVED: Race condition prevention - let all operations proceed
    // This was blocking legitimate scrollbar data loading
    if (currentState.isScrollJumpInProgress) {
      console.log(
        `🔄 [SCROLL-JUMP] Operation in progress, but proceeding anyway (user needs data)`
      );
    }

    if (state.visibleItems.length === 0 && state.items.length > 0) {
      setTimeout(
        () =>
          loadScrollToIndexWithBackgroundRanges(
            targetIndex,
            animate,
            isProgrammatic
          ),
        50
      );
      return;
    }

    (state as any).lastScrollOperation = { targetIndex, timestamp: now };
    console.log(
      `🔍 [DEBUG] Setting isScrollJumpInProgress=true for targetIndex=${targetIndex}, isProgrammatic=${isProgrammatic}`
    );
    timeoutManager.updateState({ isScrollJumpInProgress: true });

    // Check if target data exists
    const targetPageNum = Math.floor(targetIndex / (config.pageSize || 20)) + 1;
    const hasTargetData = state.items.some((item) => {
      const id = parseInt(item.id);
      const start = (targetPageNum - 1) * (config.pageSize || 20);
      return id >= start + 1 && id <= start + (config.pageSize || 20);
    });

    if (!hasTargetData && updateVisibleItems) {
      const pos = animate ? currentScrollTop : targetScrollPosition;
      updateVisibleItems(pos, true);
    }

    try {
      const containerHeight = state.containerHeight || 400;
      const pageSize = config.pageSize || 20;
      const paginationStrategy = config.pagination?.strategy || "page";
      let loadedPages: number[] = []; // Track loaded pages for preloading

      if (paginationStrategy === "offset") {
        // 🎯 OPTIMIZED: Offset-based loading - ONE precise API call
        const offsetCalc = calcViewportOffset(
          targetScrollPosition,
          containerHeight,
          itemHeight,
          state.itemCount
        );

        console.log(
          `🎯 [OFFSET-LOAD] Loading ${offsetCalc.limit} items from offset ${offsetCalc.offset}`
        );

        // Single precise API call instead of multiple page calls
        const response = await loadOffsetData(
          offsetCalc.offset,
          offsetCalc.limit
        );
        console.log(
          `✅ [OFFSET-LOAD] Loaded ${response.items.length} items successfully!`
        );

        // 🎯 CRITICAL: Trigger re-render after data loads to show items immediately
        console.log(
          `🎨 [OFFSET-LOAD] Triggering re-render with newly loaded data`
        );
        updateVisibleItems(targetScrollPosition, isProgrammatic);

        // Calculate equivalent pages for preloading compatibility
        const startPage = Math.floor(offsetCalc.offset / pageSize) + 1;
        const endPage =
          Math.floor((offsetCalc.offset + offsetCalc.limit - 1) / pageSize) + 1;
        for (let page = startPage; page <= endPage; page++) {
          loadedPages.push(page);
        }
      } else {
        // 📄 LEGACY: Page-based loading - multiple API calls
        const calc = calcViewportPages(
          targetIndex,
          containerHeight,
          itemHeight,
          pageSize,
          targetScrollPosition,
          state.itemCount
        );

        // Load viewport pages
        const promises = calc.pages.map((page) =>
          loadPage(page, {
            setScrollPosition: false,
            replaceCollection: false,
            animate: false,
          })
        );
        await Promise.all(promises);
        console.log(
          `✅ [SCROLL-JUMP] All ${promises.length} pages loaded successfully!`
        );

        loadedPages = calc.pages;
      }

      // Background preloading (only for page-based strategy)
      if (paginationStrategy === "page") {
        const before =
          config.adjacentPagesPreloadBefore ??
          Math.floor(
            (config.adjacentPagesPreload ?? PAGINATION.ADJACENT_PAGES_PRELOAD) /
              2
          );
        const after =
          config.adjacentPagesPreloadAfter ??
          Math.ceil(
            (config.adjacentPagesPreload ?? PAGINATION.ADJACENT_PAGES_PRELOAD) /
              2
          );

        if (before > 0 || after > 0) {
          const totalPages = state.itemCount
            ? Math.ceil(state.itemCount / pageSize)
            : null;
          const additional: number[] = [];
          const firstPage = Math.min(...loadedPages);
          const lastPage = Math.max(...loadedPages);

          for (let i = 1; i <= before; i++) {
            const p = firstPage - i;
            if (p >= 1 && !loadedPages.includes(p)) additional.push(p);
          }
          for (let i = 1; i <= after; i++) {
            const p = lastPage + i;
            if ((!totalPages || p <= totalPages) && !loadedPages.includes(p))
              additional.push(p);
          }

          if (additional.length > 0)
            loadAdditionalRangesInBackground(additional);
        }
      } else {
        console.log(
          `🎯 [OFFSET-STRATEGY] Background preloading disabled for offset-based pagination - using on-demand loading`
        );
      }

      // Set scroll position
      if (!animate && isProgrammatic) {
        container.scrollTop = targetScrollPosition;
        state.scrollTop = targetScrollPosition;
        console.log(
          `🔍 [DEBUG] Clearing isScrollJumpInProgress (instant programmatic)`
        );
        timeoutManager.updateState({ isScrollJumpInProgress: false });
      } else if (animate && isProgrammatic) {
        container.scrollTo({ top: targetScrollPosition, behavior: "smooth" });
        const distance = Math.abs(targetScrollPosition - currentScrollTop);
        const time = Math.min(Math.max(distance / 2000, 500), 2000);
        console.log(
          `🔍 [DEBUG] Clearing isScrollJumpInProgress after ${time}ms (animated programmatic)`
        );
        setTimeout(
          () => timeoutManager.updateState({ isScrollJumpInProgress: false }),
          time
        );
      }
    } catch (error) {
      logError(`Scroll jump failed for index ${targetIndex}`, error);
    } finally {
      if (!animate || !isProgrammatic) {
        console.log(
          `🔍 [DEBUG] Clearing isScrollJumpInProgress (finally block for non-animated or non-programmatic)`
        );
        timeoutManager.updateState({ isScrollJumpInProgress: false });
      }
    }
  };

  const loadScrollJumpWithBackgroundRanges = async (
    targetPage: number,
    animate: boolean = false
  ): Promise<void> => {
    const currentState = timeoutManager.getState();
    if (currentState.isScrollJumpInProgress) return;

    timeoutManager.updateState({ isScrollJumpInProgress: true });

    try {
      const pageSize = config.pageSize || 20;
      const itemHeight = config.itemHeight || 84;
      const containerHeight = state.containerHeight || 400;
      const targetScrollPosition = (targetPage - 1) * pageSize * itemHeight;

      const calc = calcViewportPages(
        (targetPage - 1) * pageSize,
        containerHeight,
        itemHeight,
        pageSize,
        targetScrollPosition,
        state.itemCount
      );

      const promises = calc.pages.map((page) =>
        loadPage(page, {
          setScrollPosition: false,
          replaceCollection: false,
          animate: false,
        })
      );
      await Promise.all(promises);

      if (animate) {
        container.scrollTo({ top: targetScrollPosition, behavior: "smooth" });
      } else {
        container.scrollTop = targetScrollPosition;
        state.scrollTop = targetScrollPosition;
      }
    } catch (error) {
      logError("Page scroll jump failed", error);
    } finally {
      timeoutManager.updateState({ isScrollJumpInProgress: false });
    }
  };

  const scheduleScrollStopPageLoad = (
    targetPage: number,
    scrollSpeed: number
  ): void => {
    const currentIndex = (targetPage - 1) * (config.pageSize || 20);
    console.log(
      `⏰ [SCROLL-STOP] Scheduled for page ${targetPage} → index ${currentIndex} (speed: ${scrollSpeed.toFixed(
        1
      )}px/ms, delay: ${SCROLL.JUMP_DEBOUNCE}ms)`
    );

    timeoutManager.setScrollJumpState(() => {
      const timeoutState = timeoutManager.getState();
      console.log(
        `🎯 [SCROLL-STOP] Triggered: page ${targetPage} → index ${currentIndex} (isScrollJumpInProgress: ${timeoutState.isScrollJumpInProgress})`
      );

      // 🔍 DEBUG: Track what's setting the flag during scrollbar dragging
      if (timeoutState.isScrollJumpInProgress) {
        console.log(
          `🔍 [DEBUG] isScrollJumpInProgress=true is blocking data loading for scrollbar drag!`
        );
      }

      // 🖱️ REACTIVE STRATEGY: Always check data availability and load if missing
      // Don't let programmatic flags block scrollbar data loading!
      const pageSize = config.pageSize || 20;
      const targetPageStart = (targetPage - 1) * pageSize + 1;
      const targetPageEnd = targetPage * pageSize;

      // Check if we have data for target page
      const hasPageData = state.items.some((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= targetPageStart && itemId <= targetPageEnd;
      });

      if (hasPageData) {
        console.log(
          `✅ [SCROLL-STOP] Data already available for page ${targetPage}, updating viewport only`
        );
        // Just update viewport, no need to load
        updateVisibleItems(container.scrollTop, false);
      } else {
        if (timeoutState.isScrollJumpInProgress) {
          console.log(
            `🔄 [SCROLL-STOP] DECOUPLED - Loading data despite programmatic operation in progress`
          );
        }
        console.log(
          `🖱️ [SCROLL-STOP] REACTIVE - Loading missing data for page ${targetPage} (${targetPageStart}-${targetPageEnd})`
        );
        loadScrollToIndexWithBackgroundRanges(currentIndex, false, false).catch(
          (error) => logError("REACTIVE load failed", error)
        );
      }
    }, SCROLL.JUMP_DEBOUNCE);
  };

  return {
    loadScrollToIndexWithBackgroundRanges,
    loadScrollJumpWithBackgroundRanges,
    loadAdditionalRangesInBackground,
    scheduleScrollStopPageLoad,
  };
};
