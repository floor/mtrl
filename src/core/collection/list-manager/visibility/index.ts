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
  FAKE_DATA,
} from "../constants";
import { fakeDataGenerator } from "../fake-data-generator";

/**
 * Visibility management dependencies
 */
/**
 * Return type for visibility manager including fake item replacement
 */
export interface VisibilityManager {
  updateVisibleItems: (scrollTop?: number, isPageJump?: boolean) => void;
  checkLoadMore: (scrollTop: number) => void;
  replaceFakeItemsWithReal: (newRealItems: any[]) => void;
}

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
 * Enhanced mechanical visibility calculation with fake data support
 * Provides seamless infinite content by generating fake items when needed
 */
const calculateMechanicalVisibility = (
  scrollTop: number,
  containerHeight: number,
  items: any[],
  itemHeight: number,
  overscan: number = 3
): VisibleRange => {
  // Initialize fake data patterns if we have real items
  if (items.length > 0 && FAKE_DATA.ENABLED) {
    fakeDataGenerator.analyzePatterns(items);
  }

  // If no items and fake data disabled, return empty
  if (items.length === 0 && !FAKE_DATA.ENABLED) {
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
    // SPECIAL CASE: If viewport is way beyond our data (empty virtual space)
    // and we're at a very high scroll position, show the end of our actual data
    if (scrollTop > collectionEndPx * 2 && items.length > 0) {
      // Show the last few items instead of empty space
      const endBuffer = Math.min(overscan, items.length);
      const result = {
        start: Math.max(0, items.length - endBuffer),
        end: items.length,
      };

      // Debug log for empty virtual space fix
      console.log(
        `🔧 [EmptyVirtualSpaceFix] Applied fix for high scroll position:`,
        {
          scrollTop: scrollTop.toLocaleString(),
          collectionEndPx: collectionEndPx.toLocaleString(),
          itemsLength: items.length,
          endBuffer,
          resultRange: result,
          itemsToShow: items
            .slice(result.start, result.end)
            .map((item) => ({ id: item?.id, headline: item?.headline })),
        }
      );

      return result;
    }

    // Debug log for when viewport is outside collection
    if (scrollTop > 1000000) {
      // Only log for high scroll positions
      console.log(
        `❌ [ViewportOutside] Viewport completely outside collection:`,
        {
          scrollTop: scrollTop.toLocaleString(),
          viewportRange: `${viewportTop.toLocaleString()} - ${viewportBottom.toLocaleString()}`,
          collectionRange: `${collectionStartPx.toLocaleString()} - ${collectionEndPx.toLocaleString()}`,
          itemsLength: items.length,
          shouldApplyFix: scrollTop > collectionEndPx * 2,
          fixNotAppliedBecause:
            items.length === 0 ? "No items" : "Scroll not high enough",
        }
      );
    }

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
export const createVisibilityManager = (
  deps: VisibilityDependencies
): VisibilityManager => {
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

    let visibleRange = calculateMechanicalVisibility(
      scrollTop,
      state.containerHeight,
      state.items,
      itemHeight,
      overscan
    );

    // Strategic logging for bottom scroll debugging
    if (scrollTop > 1000000) {
      // Only log for very high scroll positions
      const firstItemId = state.items[0] ? parseInt(state.items[0].id) : null;
      const lastItemId = state.items[state.items.length - 1]
        ? parseInt(state.items[state.items.length - 1].id)
        : null;
      const collectionStartPx = firstItemId
        ? (firstItemId - 1) * itemHeight
        : 0;
      const collectionEndPx = lastItemId ? lastItemId * itemHeight : 0;
      const viewportTop = Math.max(0, scrollTop - overscan * itemHeight);
      const viewportBottom =
        scrollTop + state.containerHeight + overscan * itemHeight;

      console.log(`🔍 [VisibilityDebug] High scroll position detected:`, {
        scrollTop: scrollTop.toLocaleString(),
        containerHeight: state.containerHeight,
        itemHeight,
        totalItems: state.items.length,
        firstItemId,
        lastItemId,
        collectionStartPx: collectionStartPx.toLocaleString(),
        collectionEndPx: collectionEndPx.toLocaleString(),
        viewportTop: viewportTop.toLocaleString(),
        viewportBottom: viewportBottom.toLocaleString(),
        calculatedVisibleRange: visibleRange,
        viewportOutsideCollection:
          viewportTop >= collectionEndPx || viewportBottom <= collectionStartPx,
        isEmptyVirtualSpace: scrollTop > collectionEndPx * 2,
        emptyVirtualSpaceFix:
          scrollTop > collectionEndPx * 2 &&
          visibleRange.start !== visibleRange.end
            ? "Applied"
            : "Not needed",
      });

      // DETAILED COLLECTION DEBUG - Show what's actually in the collection
      console.log(`📋 [CollectionDebug] State items analysis:`, {
        stateItemsLength: state.items.length,
        firstFewItems: state.items
          .slice(0, 3)
          .map((item) => ({ id: item?.id, headline: item?.headline })),
        lastFewItems: state.items
          .slice(-3)
          .map((item) => ({ id: item?.id, headline: item?.headline })),
        allItemIds: state.items.map((item) => item?.id),
        itemsWithMissingIds: state.items.filter((item) => !item?.id).length,
        calculationDetails: {
          collectionRange: `${firstItemId} - ${lastItemId}`,
          collectionPixelRange: `${collectionStartPx} - ${collectionEndPx}`,
          viewportPixelRange: `${viewportTop} - ${viewportBottom}`,
          scrollTooHigh: scrollTop > collectionEndPx * 2,
          shouldShowEmptyVirtualSpaceFix:
            scrollTop > collectionEndPx * 2 && state.items.length > 0,
        },
      });
    }

    if (visibleRange.end - visibleRange.start === 0) {
      // Log details when no items are visible to debug the issue
      const firstItemId = state.items[0] ? parseInt(state.items[0].id) : null;
      const lastItemId = state.items[state.items.length - 1]
        ? parseInt(state.items[state.items.length - 1].id)
        : null;
      const viewportTop = Math.max(0, scrollTop - overscan * itemHeight);
      const viewportBottom =
        scrollTop + state.containerHeight + overscan * itemHeight;

      // Debug: viewport and collection don't intersect
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
      let visibleItems = state.items
        .slice(visibleRange.start, visibleRange.end)
        .filter(Boolean);

      // SEAMLESS INFINITE CONTENT: Generate fake items if no real items visible
      if (visibleItems.length === 0 && FAKE_DATA.ENABLED && !justJumpedToPage) {
        // Calculate which virtual items should be visible
        const viewportTop = Math.max(
          0,
          scrollTop - (config.overscan || 3) * itemHeight
        );
        const viewportBottom =
          scrollTop +
          state.containerHeight +
          (config.overscan || 3) * itemHeight;
        const firstVirtualIndex = Math.floor(viewportTop / itemHeight);
        const lastVirtualIndex = Math.floor(viewportBottom / itemHeight);
        const itemsNeeded = Math.min(
          lastVirtualIndex - firstVirtualIndex + 1,
          10
        ); // Reasonable limit

        // Generate fake items for the viewport
        visibleItems = [];
        for (let i = 0; i < itemsNeeded; i++) {
          const virtualIndex = firstVirtualIndex + i;
          const fakeItem = fakeDataGenerator.generateFakeItem(
            virtualIndex,
            state.items
          );
          if (fakeItem) {
            visibleItems.push(fakeItem);
          }
        }

        console.log(
          `🎭 [FakeData] Generated ${visibleItems.length} fake items for seamless scrolling:`,
          {
            scrollTop: scrollTop.toLocaleString(),
            virtualRange: `${firstVirtualIndex} - ${lastVirtualIndex}`,
            fakeItemIds: visibleItems.map((item) => item.id),
          }
        );

        // Update visible range to match fake items
        visibleRange = { start: 0, end: visibleItems.length };
      }

      Object.assign(
        state,
        updateStateVisibleItems(state, visibleItems, visibleRange)
      );
    }

    // Calculate offsets
    if (typeof itemMeasurement.calculateOffsets === "function") {
      itemMeasurement.calculateOffsets(state.items);
    }

    // RENDER visible items with fake data support
    if (hasRangeChanged || isPageJump) {
      if (state.paginationStrategy === "page") {
        // Get items to render (could be real or fake)
        const itemsToRender = state.visibleItems || [];

        // Calculate positions for virtual rendering
        const positions = itemsToRender
          .map((item, localIndex) => {
            if (!item?.id) return null;

            let offset: number;

            // Handle fake items differently than real items
            if (fakeDataGenerator.isFakeItem(item)) {
              // For fake items, calculate position based on the virtual index
              const fakeIdNumber = parseInt(
                item.id.replace(FAKE_DATA.ID_PREFIX, "")
              );
              offset = fakeIdNumber * itemHeight;

              console.log(`🎭 [FakeRender] Positioning fake item:`, {
                itemId: item.id,
                virtualIndex: fakeIdNumber,
                offset: offset.toLocaleString(),
                scrollTop: scrollTop.toLocaleString(),
              });
            } else {
              // Real items use their natural position or empty virtual space fix
              const itemId = parseInt(item.id);
              offset = (itemId - 1) * itemHeight; // Natural calculation

              // CRITICAL FIX: When in empty virtual space, position items within current viewport
              const lastItemId = state.items[state.items.length - 1]
                ? parseInt(state.items[state.items.length - 1].id)
                : 1;
              const collectionEndPx = lastItemId * itemHeight;
              const isEmptyVirtualSpace = scrollTop > collectionEndPx * 2;

              if (isEmptyVirtualSpace) {
                offset = scrollTop + localIndex * itemHeight;

                console.log(
                  `🎯 [EmptyVirtualSpaceRender] Repositioning real item for visibility:`,
                  {
                    itemId,
                    naturalOffset: (itemId - 1) * itemHeight,
                    newOffset: offset.toLocaleString(),
                    localIndex,
                  }
                );
              }
            }

            return {
              index: localIndex,
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

  /**
   * Replace fake items with real items when they load
   * This provides seamless transition from fake to real content
   */
  const replaceFakeItemsWithReal = (newRealItems: any[]): void => {
    if (!FAKE_DATA.ENABLED || !state.visibleItems) return;

    let hasReplacements = false;
    const updatedVisibleItems = state.visibleItems.map((item) => {
      if (fakeDataGenerator.isFakeItem(item)) {
        // Try to find a matching real item
        const fakeIdNumber = parseInt(item.id.replace(FAKE_DATA.ID_PREFIX, ""));
        const matchingRealItem = newRealItems.find(
          (realItem) => parseInt(realItem.id) === fakeIdNumber + 1 // Adjust for 1-based real IDs
        );

        if (matchingRealItem) {
          hasReplacements = true;
          console.log(
            `🔄 [FakeReplace] Replacing fake item ${item.id} with real item ${matchingRealItem.id}`
          );
          return matchingRealItem;
        }
      }
      return item;
    });

    if (hasReplacements) {
      // Update state with replaced items
      state.visibleItems = updatedVisibleItems;

      // Trigger re-render with the real items
      if (state.paginationStrategy === "page") {
        const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
        const positions = updatedVisibleItems.map((item, localIndex) => ({
          index: localIndex,
          item,
          offset: (parseInt(item.id) - 1) * itemHeight,
        }));

        renderingManager.renderItemsWithVirtualPositions(positions);
      }
    }
  };

  return {
    updateVisibleItems,
    checkLoadMore,
    replaceFakeItemsWithReal,
  };
};
