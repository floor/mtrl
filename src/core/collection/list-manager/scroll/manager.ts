/**
 * Main Scrolling Manager for List Manager
 * Central hub for all scrolling operations including programmatic scrolling
 */

import {
  ListManagerState,
  ListManagerConfig,
  ScrollToPosition,
} from "../types";
import { DEFAULTS } from "../constants";
import { createScrollJumpFunctions, type ScrollJumpDependencies } from "./jump";
import { calcScrollPos, devLog, logError } from "./utils";

export interface ScrollingManagerDependencies {
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
  itemMeasurement?: {
    calculateOffsets?: (items: any[]) => void;
    getItemOffset?: (items: any[], itemId: string) => number;
    getItemHeight?: (item: any) => number;
  };
  collection?: string;
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
 * Creates a scrolling manager - the central hub for all scrolling operations
 * @param deps Dependencies from the main list manager
 * @returns Scrolling management functions
 */
export const createScrollingManager = (deps: ScrollingManagerDependencies) => {
  const {
    state,
    config,
    container,
    loadPage,
    updateVisibleItems,
    timeoutManager,
    itemMeasurement,
    collection,
  } = deps;

  // Create scroll jump functions
  const scrollJumpFunctions = createScrollJumpFunctions({
    state,
    config,
    container,
    loadPage,
    updateVisibleItems,
    timeoutManager,
  });

  /**
   * Scroll to a specific index in the list
   * @param index 0-based index to scroll to
   * @param position Position ('start', 'center', 'end')
   * @param animate Whether to animate the scroll (defaults to false for instant scroll)
   */
  const scrollToIndex = async (
    index: number,
    position: ScrollToPosition = "start",
    animate: boolean = false
  ): Promise<void> => {
    if (index < 0) {
      devLog(`Invalid index: ${index}`);
      return;
    }

    devLog(`Scrolling to index: ${index}`);

    // Static mode
    if (state.useStatic) {
      if (index >= state.items.length) {
        devLog(`Index ${index} out of bounds`);
        return;
      }

      const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
      const scrollPosition = calcScrollPos(
        index,
        position,
        itemHeight,
        state.containerHeight,
        state.items.length
      );

      if (animate) {
        container.scrollTo({ top: scrollPosition, behavior: "smooth" });
      } else {
        container.scrollTop = scrollPosition;
      }
      return;
    }

    // 🎯 PREDICTIVE STRATEGY: Load data immediately (async) + start scroll in parallel
    try {
      const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
      const scrollPosition = calcScrollPos(
        index,
        position,
        itemHeight,
        state.containerHeight
      );

      // Start data loading immediately (async, non-blocking)
      console.log(
        `🎯 [PREDICTIVE] Starting data load for index ${index} + scroll to ${scrollPosition}px`
      );
      const dataLoadPromise =
        scrollJumpFunctions.loadScrollToIndexWithBackgroundRanges(
          index,
          animate,
          true // isProgrammatic = true
        );

      // Start scroll immediately in parallel (don't wait for data)
      if (animate) {
        container.scrollTo({ top: scrollPosition, behavior: "smooth" });
      } else {
        container.scrollTop = scrollPosition;
        state.scrollTop = scrollPosition;
      }

      // Update viewport with placeholders immediately
      updateVisibleItems(scrollPosition, true);

      // Wait for data in background (for completion logging)
      dataLoadPromise.catch((error) => {
        logError(`PREDICTIVE data load failed for index ${index}`, error);
      });
    } catch (error) {
      logError(`Failed to scroll to index ${index}`, error);
    }
  };

  /**
   * Scroll to a specific item by ID using backend lookup
   * @param itemId Item ID to scroll to
   * @param position Position ('start', 'center', 'end')
   * @param animate Whether to animate the scroll (defaults to false for instant scroll)
   */
  const scrollToItemById = async (
    itemId: string,
    position: ScrollToPosition = "start",
    animate: boolean = false
  ): Promise<void> => {
    if (!collection) {
      logError("Collection name not provided");
      return;
    }

    try {
      const response = await fetch(
        `/api/${collection}/find-position/${itemId}`
      );

      if (!response.ok) {
        logError(`API call failed: ${response.status}`);
        return;
      }

      const result = await response.json();

      if (!result.exists) {
        devLog(`Item ${itemId} not found`);
        return;
      }

      await scrollToIndex(result.index, position, animate);
      requestAnimationFrame(() => scrollToItem(itemId, position, animate));
    } catch (error) {
      logError(`Failed to find item ${itemId}`, error);
    }
  };

  /**
   * Scroll to a specific item by ID
   * @param itemId Item ID to scroll to
   * @param position Position ('start', 'center', 'end')
   * @param animate Whether to animate the scroll (defaults to true for backward compatibility)
   */
  const scrollToItem = (
    itemId: string,
    position: ScrollToPosition = "start",
    animate: boolean = true
  ): void => {
    const itemIndex = state.items.findIndex((item) => item?.id === itemId);
    if (itemIndex === -1) return;

    const itemHeight = config.itemHeight || 48;
    const scrollPosition = calcScrollPos(
      itemIndex,
      position,
      itemHeight,
      state.containerHeight
    );

    if (animate) {
      container.scrollTo({ top: scrollPosition, behavior: "smooth" });
    } else {
      container.scrollTop = scrollPosition;
    }
  };

  return {
    // Programmatic scrolling functions
    scrollToItem,
    scrollToIndex,
    scrollToItemById,
    // Scroll jump functions
    ...scrollJumpFunctions,
  };
};
