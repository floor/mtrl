import {
  ListManagerState,
  ListManagerConfig,
  ListManagerElements,
  VisibleRange,
} from "../types";
import {
  updateVisibleItems as updateStateVisibleItems,
  updateTotalHeight,
} from "../state";
import { updateSpacerHeight } from "../dom-elements";
import {
  calculateVisibleRange,
  isLoadThresholdReached,
} from "../utils/visibility";
import {
  RENDERING,
  PAGINATION,
  BOUNDARIES,
  SCROLL,
  DEFAULTS,
} from "../constants";

/**
 * Visibility management dependencies
 */
export interface VisibilityDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  elements: ListManagerElements;
  container: HTMLElement;
  itemMeasurement: any;
  renderer: any;
  checkPageChange: (scrollTop: number, paginationStrategy?: string) => void;
  paginationManager: {
    scheduleScrollStopPageLoad: (targetPage: number) => void;
    checkPageBoundaries: (scrollTop: number) => void;
    loadNext: () => Promise<{ hasNext: boolean; items: any[] }>;
    getPaginationFlags: () => {
      justJumpedToPage: boolean;
      isPreloadingPages: boolean;
    };
  };
  renderingManager: {
    renderItemsWithVirtualPositions: (
      positions: Array<{ index: number; item: any; offset: number }>
    ) => void;
  };
}

/**
 * Simple mechanical visibility calculation
 * Works with current collection regardless of scroll position
 */
const calculateMechanicalVisibility = (
  scrollTop: number,
  containerHeight: number,
  items: any[],
  itemHeight: number,
  overscan: number = 3
): VisibleRange => {
  if (items.length === 0) {
    return { start: 0, end: 0 };
  }

  // Calculate viewport boundaries with buffer
  const bufferHeight = overscan * itemHeight;
  const viewportTop = Math.max(0, scrollTop - bufferHeight);
  const viewportBottom = scrollTop + containerHeight + bufferHeight;

  // Find the first and last item IDs to determine collection range
  const firstItemId = parseInt(items[0]?.id || "1");
  const lastItemId = parseInt(items[items.length - 1]?.id || "1");

  // Calculate where this collection starts and ends in virtual space
  const collectionStartPx = (firstItemId - 1) * itemHeight;
  const collectionEndPx = lastItemId * itemHeight;

  // Check if viewport intersects with current collection at all
  if (viewportTop >= collectionEndPx || viewportBottom <= collectionStartPx) {
    // Viewport is completely outside current collection - show nothing
    return { start: 0, end: 0 };
  }

  // Find visible items within the current collection
  const visibleIndices: number[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item?.id) continue;

    // Calculate item position based on its ID
    const itemId = parseInt(item.id);
    const itemTop = (itemId - 1) * itemHeight;
    const itemBottom = itemTop + itemHeight;

    // Check if item intersects with viewport
    if (itemTop < viewportBottom && itemBottom > viewportTop) {
      visibleIndices.push(i);
    }
  }

  if (visibleIndices.length === 0) {
    return { start: 0, end: 0 };
  }

  return {
    start: Math.min(...visibleIndices),
    end: Math.max(...visibleIndices) + 1, // +1 because end is exclusive
  };
};

/**
 * Creates a visibility management for handling scroll and visibility calculations
 * @param deps Dependencies from the main list manager
 * @returns Visibility management functions
 */
export const createVisibilityManager = (deps: VisibilityDependencies) => {
  const {
    state,
    config,
    elements,
    container,
    itemMeasurement,
    renderer,
    checkPageChange,
    paginationManager,
    renderingManager,
  } = deps;

  /**
   * Simple mechanical update visible items - no complexity, just math
   * @param scrollTop Current scroll position
   * @param isPageJump Whether this is a page jump operation
   */
  const updateVisibleItems = (
    scrollTop = state.scrollTop,
    isPageJump = false
  ): void => {
    // Removed excessive logging

    if (!state.mounted) return;

    const { justJumpedToPage, isPreloadingPages } =
      paginationManager.getPaginationFlags();

    // Skip updates if we're in the middle of a page jump or preloading
    if (justJumpedToPage || isPreloadingPages) {
      return;
    }

    // Get container height
    if (state.containerHeight === 0) {
      state.containerHeight =
        container.clientHeight || DEFAULTS.containerHeight;
    }

    // Update scroll position
    state.scrollTop = scrollTop;

    // Update page for page-based pagination
    if (state.paginationStrategy === "page" && !isPageJump) {
      const pageSize = config.pageSize || 20;
      const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
      const virtualItemIndex = Math.floor(scrollTop / itemHeight);
      const calculatedPage = Math.floor(virtualItemIndex / pageSize) + 1;

      if (calculatedPage !== state.page && calculatedPage >= 1) {
        const pageDifference = Math.abs(calculatedPage - state.page);

        // Handle large scroll jumps
        if (pageDifference > PAGINATION.LARGE_SCROLL_JUMP_THRESHOLD) {
          paginationManager.scheduleScrollStopPageLoad(calculatedPage);
        }

        state.page = calculatedPage;
      }
    }

    // Check for page changes
    checkPageChange(scrollTop, state.paginationStrategy);

    // Calculate visible range - pure mechanical calculation
    const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
    const overscan = config.overscan || RENDERING.DEFAULT_OVERSCAN_COUNT;

    // Removed excessive logging

    const visibleRange = calculateMechanicalVisibility(
      scrollTop,
      state.containerHeight,
      state.items,
      itemHeight,
      overscan
    );

    if (visibleRange.end - visibleRange.start === 0) {
      // Log details when no items are visible to debug the issue
      const firstItemId = state.items[0] ? parseInt(state.items[0].id) : null;
      const lastItemId = state.items[state.items.length - 1]
        ? parseInt(state.items[state.items.length - 1].id)
        : null;
      const viewportTop = Math.max(0, scrollTop - overscan * itemHeight);
      const viewportBottom =
        scrollTop + state.containerHeight + overscan * itemHeight;

      console.log(`🚨 [MechanicalVisibility] Found 0 items - Debug info:`, {
        scrollTop,
        viewportTop,
        viewportBottom,
        firstItemId,
        lastItemId,
        collectionStartPx: firstItemId ? (firstItemId - 1) * itemHeight : null,
        collectionEndPx: lastItemId ? lastItemId * itemHeight : null,
        itemsInCollection: state.items.length,
        reason: "Viewport and collection don't intersect",
      });
    }

    // Removed excessive logging

    // Check if range changed
    const hasRangeChanged =
      visibleRange.start !== state.visibleRange.start ||
      visibleRange.end !== state.visibleRange.end;

    const needsBoundaryDetection = state.paginationStrategy === "page";

    if (!hasRangeChanged && !needsBoundaryDetection) {
      return;
    }

    // Update state with new visible range
    if (hasRangeChanged) {
      Object.assign(
        state,
        updateStateVisibleItems(
          state,
          state.items
            .slice(visibleRange.start, visibleRange.end)
            .filter(Boolean),
          visibleRange
        )
      );
    }

    // Calculate offsets
    if (typeof itemMeasurement.calculateOffsets === "function") {
      itemMeasurement.calculateOffsets(state.items);
    }

    // RENDER visible items - this was missing!
    if (hasRangeChanged || isPageJump) {
      if (state.paginationStrategy === "page") {
        // Calculate positions for virtual rendering
        const positions = state.items
          .slice(visibleRange.start, visibleRange.end)
          .map((item, localIndex) => {
            if (!item?.id) return null;

            const itemId = parseInt(item.id);
            const offset = (itemId - 1) * itemHeight; // Simple calculation

            return {
              index: visibleRange.start + localIndex,
              item,
              offset,
            };
          })
          .filter(Boolean);

        renderingManager.renderItemsWithVirtualPositions(positions);
      } else {
        // Standard rendering for cursor-based pagination
        renderer.renderVisibleItems(state.items, visibleRange);
      }
    }

    // Calculate total height
    if (state.totalHeightDirty && !isPageJump) {
      let totalHeight: number;

      if (state.useStatic) {
        totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      } else if (state.itemCount) {
        // Simple calculation - no complex positioning system
        totalHeight = state.itemCount * itemHeight;
      } else {
        // Keep existing height if we have one
        if (state.totalHeight > 0) {
          state.totalHeightDirty = false;
          return;
        }
        totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      }

      Object.assign(state, updateTotalHeight(state, totalHeight));
      updateSpacerHeight(elements, totalHeight);
      state.totalHeightDirty = false;
    }

    // Handle loading more data
    checkLoadMore(scrollTop);
  };

  /**
   * Check if we need to load more data
   */
  const checkLoadMore = (scrollTop: number): void => {
    const { justJumpedToPage, isPreloadingPages } =
      paginationManager.getPaginationFlags();

    if (state.loading || justJumpedToPage || isPreloadingPages) {
      return;
    }

    if (state.paginationStrategy === "page") {
      // Let page boundaries handle loading for page-based pagination
      paginationManager.checkPageBoundaries(scrollTop);
    } else {
      // Handle traditional infinite scroll
      const shouldLoadMore = isLoadThresholdReached(
        scrollTop,
        state.containerHeight,
        state.totalHeight,
        config.loadThreshold || 0.8
      );

      if (shouldLoadMore) {
        paginationManager.loadNext();
      }
    }
  };

  return {
    updateVisibleItems,
    checkLoadMore,
  };
};
