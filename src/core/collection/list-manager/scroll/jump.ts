/**
 * Scroll Jump Operations
 */
import { ListManagerState, ListManagerConfig } from "../types";
import { PAGINATION, BOUNDARIES, OFFSET, DEFAULTS } from "../constants";
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

    try {
      // Direct API call - the route adapter will handle parameter naming
      const response = await loadItems(apiParams);
      return response;
    } catch (error) {
      // Fallback to page-based loading if offset API fails
      const fallbackPageSize = config.pageSize || 20;
      const startPage = Math.floor(offset / fallbackPageSize) + 1;
      const endPage = Math.floor((offset + limit - 1) / fallbackPageSize) + 1;

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
    const backgroundLoadOptions = {
      setScrollPosition: false,
      replaceCollection: false,
    };

    setTimeout(async () => {
      for (const page of pages) {
        try {
          await loadPage(page, backgroundLoadOptions);
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
    const currentState = timeoutManager.getState();

    // Cache frequently used calculations
    const itemHeight = config.itemHeight || 84;
    const pageSize = config.pageSize || 20;
    const containerHeight = state.containerHeight || 400;
    const paginationStrategy = config.pagination?.strategy || "page";

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
    const targetPage = Math.floor(targetIndex / pageSize) + 1;
    const hasCorrectData = state.visibleItems.some((item) => {
      const idx = state.items.findIndex((s) => s.id === item.id);
      const start = (targetPage - 1) * pageSize;
      return idx >= start && idx < start + pageSize;
    });

    if (scrollDiff < itemHeight && hasCorrectData) {
      return;
    }

    // Allow operations to proceed even if one is in progress
    // This prevents blocking legitimate scrollbar data loading

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
    timeoutManager.updateState({ isScrollJumpInProgress: true });

    // Check if target data exists
    const targetPageNum = Math.floor(targetIndex / pageSize) + 1;
    const hasTargetData = state.items.some((item) => {
      const id = parseInt(item.id);
      const start = (targetPageNum - 1) * pageSize;
      return id >= start + 1 && id <= start + pageSize;
    });

    if (!hasTargetData && updateVisibleItems) {
      const pos = animate ? currentScrollTop : targetScrollPosition;
      updateVisibleItems(pos, true);
    }

    try {
      let loadedPages: number[] = []; // Track loaded pages for preloading

      // Handle different pagination strategies
      switch (paginationStrategy) {
        case "offset": {
          // Offset-based loading - ONE precise API call
          const offsetCalc = calcViewportOffset(
            targetScrollPosition,
            containerHeight,
            itemHeight,
            state.itemCount,
            DEFAULTS.viewportMultiplier
          );

          await loadOffsetData(offsetCalc.offset, offsetCalc.limit);

          // Calculate equivalent pages for preloading compatibility
          const startPage = Math.floor(offsetCalc.offset / pageSize) + 1;
          const endPage =
            Math.floor((offsetCalc.offset + offsetCalc.limit - 1) / pageSize) +
            1;
          for (let page = startPage; page <= endPage; page++) {
            loadedPages.push(page);
          }
          break;
        }

        case "cursor": {
          // Cursor-based: Load items using cursor pagination
          await loadItems({
            limit: pageSize,
          });
          loadedPages = [1]; // Equivalent to first page
          break;
        }

        default: {
          // Page-based loading - multiple API calls
          const calc = calcViewportPages(
            targetIndex,
            containerHeight,
            itemHeight,
            pageSize,
            targetScrollPosition,
            state.itemCount
          );

          const loadOptions = {
            setScrollPosition: false,
            replaceCollection: false,
            animate: false,
          };
          const promises = calc.pages.map((page) =>
            loadPage(page, loadOptions)
          );
          await Promise.all(promises);
          loadedPages = calc.pages;
          break;
        }
      }

      // Trigger re-render after data loads
      updateVisibleItems(targetScrollPosition, isProgrammatic);

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
        // Background preloading disabled for offset/cursor pagination - using on-demand/sequential loading
      }

      // Set scroll position
      if (isProgrammatic) {
        if (!animate) {
          container.scrollTop = targetScrollPosition;
          state.scrollTop = targetScrollPosition;
          timeoutManager.updateState({ isScrollJumpInProgress: false });
        } else {
          container.scrollTo({ top: targetScrollPosition, behavior: "smooth" });
          const distance = Math.abs(targetScrollPosition - currentScrollTop);
          const time = Math.min(Math.max(distance / 2000, 500), 2000);
          setTimeout(
            () => timeoutManager.updateState({ isScrollJumpInProgress: false }),
            time
          );
        }
      }
    } catch (error) {
      logError(`Scroll jump failed for index ${targetIndex}`, error);
    } finally {
      if (!animate || !isProgrammatic) {
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
      // Cache frequently used calculations
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

      const loadOptions = {
        setScrollPosition: false,
        replaceCollection: false,
        animate: false,
      };
      const promises = calc.pages.map((page) => loadPage(page, loadOptions));
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
    // Cache frequently used calculations
    const pageSize = config.pageSize || 20;
    const paginationStrategy = config.pagination?.strategy || "page";
    const currentIndex = (targetPage - 1) * pageSize;

    timeoutManager.setScrollJumpState(() => {
      const timeoutState = timeoutManager.getState();

      // Handle different pagination strategies
      if (paginationStrategy === "cursor") {
        // For cursor pagination, we just update viewport and let normal scrolling handle loading
        updateVisibleItems(container.scrollTop, false);
        return;
      }

      // Always check data availability and load if missing
      // Don't let programmatic flags block scrollbar data loading!
      const targetPageStart = (targetPage - 1) * pageSize + 1;
      const targetPageEnd = targetPage * pageSize;

      // Check if we have data for target page
      const hasPageData = state.items.some((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= targetPageStart && itemId <= targetPageEnd;
      });

      if (hasPageData) {
        // Just update viewport, no need to load
        updateVisibleItems(container.scrollTop, false);
      } else {
        // Load missing data for the target page
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
