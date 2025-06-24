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
 * Simple positioning system for virtual scrolling
 * Always uses natural coordinates - no complex scaling needed
 */
class UnifiedPositioning {
  private readonly itemHeight: number;

  constructor(totalItems: number, itemHeight: number) {
    this.itemHeight = itemHeight;
    const fullVirtualHeight = totalItems * itemHeight;

    console.log(`🎯 [UnifiedPositioning] Natural positioning:`, {
      totalItems: totalItems.toLocaleString(),
      itemHeight,
      fullVirtualHeight: fullVirtualHeight.toLocaleString(),
      strategy: "Natural spacing - no scaling complexity",
    });
  }

  /**
   * Get the virtual position for an item ID (1-based)
   */
  getItemPosition(itemId: number): number {
    const virtualIndex = itemId - 1; // Convert to 0-based
    return virtualIndex * this.itemHeight;
  }

  /**
   * Get the virtual item index from scroll position
   */
  getVirtualItemIndex(scrollTop: number): number {
    return Math.floor(scrollTop / this.itemHeight);
  }

  /**
   * Get total height for the virtual space
   */
  getTotalHeight(itemCount: number): number {
    return itemCount * this.itemHeight;
  }
}

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

  // Initialize unified positioning system
  let positioning: UnifiedPositioning | null = null;

  const initializePositioning = () => {
    if (!positioning && state.itemCount) {
      const itemHeight = config.itemHeight || 84;
      positioning = new UnifiedPositioning(state.itemCount, itemHeight);
    }
  };

  /**
   * Check if we need to load previous pages
   * @param scrollTop Current scroll position
   */
  const checkLoadPrevious = (scrollTop: number): void => {
    // Only for page-based pagination
    if (state.paginationStrategy !== "page") return;

    // Check if we're at the top and need to load previous data
    if (scrollTop <= 100 && state.page && state.page > 1) {
      console.log(
        `⬆️ [CheckLoadPrevious] Near top, considering previous page load`
      );
      // This would trigger loading of previous pages
    }
  };

  /**
   * Pre-bound update visible items function to avoid recreation
   * @param scrollTop Current scroll position
   * @param isPageJump Whether this is a page jump operation
   */
  const updateVisibleItems = (
    scrollTop = state.scrollTop,
    isPageJump = false
  ): void => {
    if (!state.mounted) return;

    // Initialize positioning system if needed
    initializePositioning();

    const { justJumpedToPage, isPreloadingPages } =
      paginationManager.getPaginationFlags();

    // Skip updates if we're in the middle of a page jump or preloading
    if (justJumpedToPage || isPreloadingPages) {
      console.log(`🚫 [UpdateVisible] Skipping update:`, {
        justJumpedToPage,
        isPreloadingPages,
        scrollTop,
        reason: "Page jump or preloading in progress",
      });
      return;
    }

    // Get current container dimensions if not available
    if (state.containerHeight === 0) {
      state.containerHeight = container.clientHeight;

      // If still 0, use a sensible default to avoid division by zero
      if (state.containerHeight === 0) {
        console.warn(
          "[UpdateVisibleItems] Container height is 0, using default of 400px"
        );
        state.containerHeight = 400;
      }
    }

    // Update scroll position
    state.scrollTop = scrollTop;

    // For page-based pagination, update the current page based on scroll position
    if (state.paginationStrategy === "page" && !isPageJump && positioning) {
      const pageSize = config.pageSize || 20;

      // Use unified positioning system to get virtual item index
      const virtualItemIndex = positioning.getVirtualItemIndex(scrollTop);
      const calculatedPage = Math.floor(virtualItemIndex / pageSize) + 1;

      if (calculatedPage !== state.page && calculatedPage >= 1) {
        const pageDifference = Math.abs(calculatedPage - state.page);

        console.log(`📍 [ScrollSync] Unified page calculation:`, {
          scrollTop,
          virtualItemIndex,
          calculatedPage,
          previousPage: state.page,
          pageDifference,
        });

        // Detect large scroll jumps (scrollbar dragging) - use debounced loading
        if (pageDifference > 5) {
          console.log(
            `🚀 [ScrollJump] Large scroll jump detected (${pageDifference} pages) - will debounce and load when scrolling stops`
          );

          // Set up debounced page loading for when scrolling stops
          paginationManager.scheduleScrollStopPageLoad(calculatedPage);
        }

        state.page = calculatedPage;
      }
    }

    // Check for page changes during scroll
    checkPageChange(scrollTop, state.paginationStrategy);

    // Check if we need to load previous pages (for page-based pagination)
    // But skip if we just jumped to a page
    if (!justJumpedToPage) {
      checkLoadPrevious(scrollTop);
    }

    // Calculate which items should be visible
    let visibleRange: VisibleRange;

    if (state.paginationStrategy === "page" && positioning) {
      // Unified visibility calculation for page-based pagination
      const viewportTop = scrollTop;
      const viewportBottom = viewportTop + state.containerHeight;
      const itemHeight = config.itemHeight || 84;

      // Find which items in our collection would be visible at this scroll position
      const visibleItems: number[] = [];

      state.items.forEach((item, index) => {
        if (!item || !item.id) return;

        const itemId = parseInt(item.id);
        const virtualOffset = positioning.getItemPosition(itemId);
        const itemBottom = virtualOffset + itemHeight;

        // Check if this item would be visible in the viewport
        if (virtualOffset <= viewportBottom && itemBottom >= viewportTop) {
          visibleItems.push(index);
        }
      });

      if (visibleItems.length > 0) {
        visibleRange = {
          start: Math.min(...visibleItems),
          end: Math.max(...visibleItems) + 1, // +1 because end is exclusive
        };
      } else {
        // No items are visible at this scroll position - render nothing
        visibleRange = { start: 0, end: 0 };
      }

      console.log(`📍 [UnifiedVisibility] Simplified visibility calculation:`, {
        scrollTop,
        viewportTop: viewportTop.toFixed(0),
        viewportBottom: viewportBottom.toFixed(0),
        totalItems: state.items.length,
        visibleRange,
        visibleItemCount: visibleRange.end - visibleRange.start,
        itemIds:
          visibleItems.length > 0
            ? state.items
                .slice(visibleRange.start, visibleRange.end)
                .map((item) => item?.id)
                .join(", ")
            : "none visible",
      });
    } else {
      // Use standard calculation for non-page-based pagination
      visibleRange = calculateVisibleRange(
        scrollTop,
        state.items,
        state.containerHeight,
        itemMeasurement,
        config
      );
    }

    // Early return if range hasn't changed (except for sparse data where we need boundary detection)
    const hasRangeChanged =
      visibleRange.start !== state.visibleRange.start ||
      visibleRange.end !== state.visibleRange.end;
    const needsBoundaryDetection = state.paginationStrategy === "page";

    if (!hasRangeChanged && !needsBoundaryDetection) {
      console.log(
        `🚫 [UpdateVisible] Early return - range unchanged and no boundary detection needed`
      );
      return;
    }

    if (!hasRangeChanged && needsBoundaryDetection) {
      console.log(
        `🎯 [UpdateVisible] Range unchanged but continuing for boundary detection`
      );
    }

    // Update state with new visible range (only if range changed)
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

    // Ensure offsets are cached for efficient access
    if (typeof itemMeasurement.calculateOffsets === "function") {
      itemMeasurement.calculateOffsets(state.items);
    }

    // Calculate total height if needed
    if (state.totalHeightDirty && !isPageJump) {
      let totalHeight: number;

      if (state.useStatic) {
        // For static data, calculate from actual items
        totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      } else if (state.itemCount && positioning) {
        // Use unified positioning system for total height
        totalHeight = positioning.getTotalHeight(state.itemCount);

        console.log(
          `📐 [UnifiedHeight] Using unified positioning for total height:`,
          {
            apiTotalCount: state.itemCount.toLocaleString(),
            totalHeight: totalHeight.toLocaleString(),
          }
        );
      } else {
        // CRITICAL: Never override definitive height with local collection size
        // Check if we already have a reasonable total height (likely from API)
        const hasDefinitiveHeight =
          state.totalHeight >
          state.items.length * (config.itemHeight || 84) * 10;

        if (hasDefinitiveHeight) {
          console.log(
            `📐 [TotalHeight] Preserving existing definitive height:`,
            {
              existingHeight: state.totalHeight.toLocaleString(),
              localCollectionWouldBe: (
                state.items.length * (config.itemHeight || 84)
              ).toLocaleString(),
              reason:
                "Existing height is much larger than local collection - likely from API total",
            }
          );
          // Don't recalculate - keep existing definitive height
          state.totalHeightDirty = false;
          return;
        }

        // Fallback to local collection size only if no API total available and no definitive height
        totalHeight = state.items.length * (config.itemHeight || 84);
        console.log(`📐 [TotalHeight] Fallback to local collection size:`, {
          localItemsLength: state.items.length,
          itemHeight: config.itemHeight || 84,
          calculatedHeight: totalHeight.toLocaleString(),
        });
      }

      Object.assign(state, updateTotalHeight(state, totalHeight));

      // Update DOM elements with new height
      updateSpacerHeight(elements, totalHeight);
    } else if (isPageJump) {
      console.log(
        `📐 [TotalHeight] Skipping recalculation during page jump - using existing:`,
        {
          existingTotalHeight: state.totalHeight.toLocaleString(),
          isPageJump: true,
        }
      );
    }

    // Render visible items (only if range changed or it's a page jump)
    if (hasRangeChanged || isPageJump) {
      if (state.paginationStrategy === "page" && positioning) {
        // Unified rendering for page-based pagination
        console.log(
          `🎨 [UnifiedRender] Rendering with unified positioning system`
        );

        const positions = state.items
          .slice(visibleRange.start, visibleRange.end)
          .map((item, localIndex) => {
            if (!item || !item.id) return null;

            const itemId = parseInt(item.id);
            const absoluteOffset = positioning.getItemPosition(itemId);

            return {
              index: visibleRange.start + localIndex,
              item,
              offset: absoluteOffset,
            };
          })
          .filter(Boolean);

        console.log(`🎨 [UnifiedRender] Unified positions:`, {
          totalPositions: positions.length,
          firstItemId: positions[0]?.item.id,
          firstItemOffset: positions[0]?.offset,
          lastItemId: positions[positions.length - 1]?.item.id,
          lastItemOffset: positions[positions.length - 1]?.offset,
        });

        renderingManager.renderItemsWithVirtualPositions(positions);
      } else {
        // Standard rendering for cursor-based pagination
        renderer.renderVisibleItems(state.items, visibleRange);
      }
    } else {
      console.log(`⏩ [VirtualRender] Skipping render - range unchanged`);
    }

    // Now measure elements that needed measurement
    const heightsChanged = itemMeasurement.measureMarkedElements(
      elements.content,
      state.items
    );

    // Recalculate total height after measurements if needed
    // CRITICAL: Only recalculate if we don't have API total count (preserves consistent virtual scrolling)
    if (heightsChanged && (!state.itemCount || state.useStatic)) {
      const totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      Object.assign(state, updateTotalHeight(state, totalHeight));
      updateSpacerHeight(elements, totalHeight);

      console.log(`📐 [TotalHeight] Recalculated after height measurement:`, {
        reason: "Item height measurements changed",
        useStatic: state.useStatic,
        hasApiTotal: !!state.itemCount,
        newHeight: totalHeight.toLocaleString(),
      });
    } else if (heightsChanged && state.itemCount) {
      console.log(
        `📐 [TotalHeight] Skipping recalculation after measurement:`,
        {
          reason:
            "API total count available - preserving consistent virtual height",
          lockedHeight: state.totalHeight.toLocaleString(),
          apiTotal: state.itemCount.toLocaleString(),
        }
      );
    }

    // Check if we need to load more data
    console.log(`🔍 [UpdateVisible] About to call checkLoadMore:`, {
      scrollTop,
      justJumpedToPage,
      isPreloadingPages,
      paginationStrategy: state.paginationStrategy,
      currentPage: state.page,
      itemsLength: state.items.length,
    });
    checkLoadMore(scrollTop);
  };

  /**
   * Check if we need to load more data based on scroll position
   * For sparse page data, we use page boundary detection instead of percentage thresholds
   * @param scrollTop Current scroll position
   */
  const checkLoadMore = (scrollTop: number): void => {
    const { justJumpedToPage } = paginationManager.getPaginationFlags();

    console.log(`🔍 [CheckLoadMore] Unified approach:`, {
      scrollTop,
      loading: state.loading,
      justJumpedToPage,
      paginationStrategy: state.paginationStrategy,
      currentPage: state.page,
    });

    // Skip if loading
    if (state.loading) {
      console.log(`🚫 [CheckLoadMore] Skipped: loading=${state.loading}`);
      return;
    }

    // Don't auto-load immediately after page jumps - let the page settle first
    if (justJumpedToPage) {
      console.log(
        `🚫 [CheckLoadMore] Skipped: just jumped to page, letting it settle`
      );
      return;
    }

    // For page-based pagination with sparse data, use page boundary detection
    if (state.paginationStrategy === "page") {
      console.log(`🎯 [CheckLoadMore] Using unified page boundary detection`);
      // Use consistent scroll position (no adjustment needed with unified system)
      paginationManager.checkPageBoundaries(scrollTop);
      return;
    }

    // Original logic for continuous data (cursor-based pagination)
    if (!state.hasNext) {
      return;
    }

    const shouldLoadMore = isLoadThresholdReached(
      scrollTop,
      state.containerHeight,
      state.totalHeight,
      config.loadThreshold!
    );

    const scrollFraction =
      (scrollTop + state.containerHeight) / state.totalHeight;

    console.log(`📏 [CheckLoadMore] Threshold check:`, {
      scrollTop,
      containerHeight: state.containerHeight,
      totalHeight: state.totalHeight,
      loadThreshold: config.loadThreshold,
      scrollFraction: scrollFraction.toFixed(4),
      shouldLoadMore,
      currentPage: state.page,
      itemsLength: state.items.length,
      justJumpedToPage,
    });

    // Additional safeguard: don't auto-load if scroll position seems unrealistic
    if (scrollFraction > 2.0) {
      console.warn(
        `🚫 [CheckLoadMore] Suspicious scroll fraction (${scrollFraction.toFixed(
          2
        )}), skipping auto-load. This suggests virtual scrolling issues.`
      );
      return;
    }

    if (shouldLoadMore) {
      console.log(
        `🔄 [CheckLoadMore] Triggering loadNext() for scroll-based loading`
      );
      paginationManager.loadNext();
    }
  };

  return {
    updateVisibleItems,
    checkLoadMore,
    checkLoadPrevious,
  };
};
