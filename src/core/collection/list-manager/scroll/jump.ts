/**
 * Scroll Jump Operations
 */
import { ListManagerState, ListManagerConfig } from "../types";
import { PAGINATION, BOUNDARIES } from "../constants";
import { calcViewportPages, devLog, logError } from "./utils";
import { SCROLL } from "../constants";

export interface ScrollJumpDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  container: HTMLElement;
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

export const createScrollJumpFunctions = (deps: ScrollJumpDependencies) => {
  const {
    state,
    config,
    container,
    loadPage,
    updateVisibleItems,
    timeoutManager,
  } = deps;

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
      devLog("Already at target position");
      return;
    }

    if (currentState.isScrollJumpInProgress) {
      devLog("Race condition prevented");
      return;
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

      // Background preloading
      const before =
        config.adjacentPagesPreloadBefore ??
        Math.floor(
          (config.adjacentPagesPreload ?? PAGINATION.ADJACENT_PAGES_PRELOAD) / 2
        );
      const after =
        config.adjacentPagesPreloadAfter ??
        Math.ceil(
          (config.adjacentPagesPreload ?? PAGINATION.ADJACENT_PAGES_PRELOAD) / 2
        );

      if (before > 0 || after > 0) {
        const totalPages = state.itemCount
          ? Math.ceil(state.itemCount / pageSize)
          : null;
        const additional: number[] = [];
        const firstPage = Math.min(...calc.pages);
        const lastPage = Math.max(...calc.pages);

        for (let i = 1; i <= before; i++) {
          const p = firstPage - i;
          if (p >= 1 && !calc.pages.includes(p)) additional.push(p);
        }
        for (let i = 1; i <= after; i++) {
          const p = lastPage + i;
          if ((!totalPages || p <= totalPages) && !calc.pages.includes(p))
            additional.push(p);
        }

        if (additional.length > 0) loadAdditionalRangesInBackground(additional);
      }

      // Set scroll position
      if (!animate && isProgrammatic) {
        container.scrollTop = targetScrollPosition;
        state.scrollTop = targetScrollPosition;
        timeoutManager.updateState({ isScrollJumpInProgress: false });
      } else if (animate && isProgrammatic) {
        container.scrollTo({ top: targetScrollPosition, behavior: "smooth" });
        const distance = Math.abs(targetScrollPosition - currentScrollTop);
        const time = Math.min(Math.max(distance / 2000, 500), 2000);
        setTimeout(
          () => timeoutManager.updateState({ isScrollJumpInProgress: false }),
          time
        );
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

  const scheduleScrollStopPageLoad = (targetPage: number): void => {
    const currentIndex = (targetPage - 1) * (config.pageSize || 20);
    timeoutManager.setScrollJumpState(() => {
      const state = timeoutManager.getState();
      if (!state.isScrollJumpInProgress) {
        loadScrollToIndexWithBackgroundRanges(currentIndex, false, false).catch(
          (error) => logError("Scheduled scroll failed", error)
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
