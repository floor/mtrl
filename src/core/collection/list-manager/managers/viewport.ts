import {
  ListManagerState,
  ListManagerConfig,
  ListManagerElements,
  VisibleRange,
} from "../types";
import {
  updateVisibleItems as updateStateVisibleItems,
  updateTotalHeight,
} from "../utils/state";
import { updateSpacerHeight } from "../dom/elements";
import {
  calculateVisibleRange,
  isLoadThresholdReached,
} from "../utils/viewport";
import {
  RENDERING,
  PAGINATION,
  BOUNDARIES,
  SCROLL,
  DEFAULTS,
  PLACEHOLDER,
} from "../constants";
import { placeholderDataGenerator } from "../data/generator";

/**
 * Visibility management dependencies
 */
/**
 * Return type for viewport manager including placeholder replacement
 */
export interface ViewportManager {
  updateVisibleItems: (scrollTop?: number, isPageJump?: boolean) => void;
  checkLoadMore: (scrollTop: number) => void;
  replacePlaceholdersWithReal: (newRealItems: any[]) => void;
}

export interface ViewportDependencies {
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
 * Enhanced mechanical viewport calculation with placeholder data support
 * Provides seamless infinite content by generating placeholder items when needed
 */
const calculateMechanicalViewport = (
  scrollTop: number,
  containerHeight: number,
  items: any[],
  itemHeight: number,
  overscan: number = 3
): VisibleRange => {
  // Initialize placeholder data patterns if we have real items
  if (items.length > 0 && PLACEHOLDER.ENABLED) {
    placeholderDataGenerator.analyzePatterns(items);
  }

  // If no items and placeholder data disabled, return empty
  if (items.length === 0 && !PLACEHOLDER.ENABLED) {
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
    // CRITICAL: With placeholder data enabled, let placeholder data system handle empty virtual space
    // instead of the old EmptyVirtualSpaceFix
    if (PLACEHOLDER.ENABLED) {
      // Let placeholder data system take over - return empty to trigger fake item generation
      if (PLACEHOLDER.DEBUG_LOGGING && scrollTop > 1000000) {
        console.log(
          `🎭 Empty virtual space - delegating to placeholder data at scroll ${Math.round(
            scrollTop / 1000
          )}k`
        );
      }
      return { start: 0, end: 0 };
    }

    // Legacy EmptyVirtualSpaceFix (only when placeholder data is disabled)
    if (scrollTop > collectionEndPx * 2 && items.length > 0) {
      const endBuffer = Math.min(overscan, items.length);
      return {
        start: Math.max(0, items.length - endBuffer),
        end: items.length,
      };
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
 * Creates a viewport manager for handling scroll and viewport calculations
 * @param deps Dependencies from the main list manager
 * @returns Viewport management functions
 */
export const createViewportManager = (
  deps: ViewportDependencies
): ViewportManager => {
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
        // Don't update page during initial load phase
        if (scrollTop <= 10 && state.page === 1) {
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(
              `🚫 Skip page update - initial load (staying on page ${state.page})`
            );
          }
          return;
        }

        const pageDifference = Math.abs(calculatedPage - state.page);

        // Handle large scroll jumps
        if (pageDifference > PAGINATION.LARGE_SCROLL_JUMP_THRESHOLD) {
          paginationManager.scheduleScrollStopPageLoad(calculatedPage);
        }

        if (PLACEHOLDER.DEBUG_LOGGING) {
          console.log(
            `📄 Page change: ${state.page} → ${calculatedPage} (scroll: ${scrollTop})`
          );
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

    let visibleRange = calculateMechanicalViewport(
      scrollTop,
      state.containerHeight,
      state.items,
      itemHeight,
      overscan
    );

    // Lightweight debugging for critical scroll positions
    if (scrollTop > 2000000 && PLACEHOLDER.DEBUG_LOGGING) {
      const firstItemId = state.items[0] ? parseInt(state.items[0].id) : null;
      const lastItemId = state.items[state.items.length - 1]
        ? parseInt(state.items[state.items.length - 1].id)
        : null;

      console.log(
        `🔍 High scroll: ${Math.round(
          scrollTop / 1000
        )}k, items ${firstItemId}-${lastItemId} (${state.items.length})`
      );
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

      // If we have all the real items we need, use them directly
      // Only generate placeholders when we have missing data
      if (visibleItems.length > 0) {
        // We have real items - use them and log what we're showing
        if (PLACEHOLDER.DEBUG_LOGGING) {
          console.log(
            `✅ Using ${visibleItems.length} real items at scroll ${Math.round(
              scrollTop / 1000
            )}k`
          );
        }
      } else if (PLACEHOLDER.ENABLED && !justJumpedToPage) {
        // We don't have real items for this range - generate placeholders only as a fallback
        const actualItemCount = state.itemCount || state.items.length;

        if (scrollTop === 0 && state.items.length > 0) {
          // Special case: if we're at the top and have items, don't generate placeholders
          // This prevents the initial replacement issue
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(`🚫 Skipping placeholders - have real items at top`);
          }
        } else {
          // Calculate which virtual items should be visible based on scroll position
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

          // Constrain virtual indices to actual data range
          const maxVirtualIndex = actualItemCount - 1;
          const constrainedFirstIndex = Math.max(
            0,
            Math.min(firstVirtualIndex, maxVirtualIndex)
          );
          const constrainedLastIndex = Math.max(
            0,
            Math.min(lastVirtualIndex, maxVirtualIndex)
          );

          const itemsNeeded = Math.min(
            constrainedLastIndex - constrainedFirstIndex + 1,
            20
          );

          // Generate placeholders only for missing data
          const placeholderItems = [];
          for (let i = 0; i < itemsNeeded; i++) {
            const virtualIndex = constrainedFirstIndex + i;
            const virtualItemId = virtualIndex + 1;

            if (virtualItemId > actualItemCount) {
              break;
            }

            // Check if we already have real data for this item
            const existingRealItem = state.items.find(
              (item) => parseInt(item.id) === virtualItemId
            );

            if (existingRealItem) {
              placeholderItems.push(existingRealItem);
            } else {
              // Generate placeholder only for missing data
              const placeholderItem =
                placeholderDataGenerator.generatePlaceholderItem(
                  virtualIndex,
                  state.items
                );
              if (placeholderItem) {
                placeholderItems.push(placeholderItem);
              }
            }
          }

          if (placeholderItems.length > 0) {
            visibleItems = placeholderItems;
            visibleRange = { start: 0, end: visibleItems.length };

            if (PLACEHOLDER.DEBUG_LOGGING) {
              const realCount = visibleItems.filter(
                (item) => !placeholderDataGenerator.isPlaceholderItem(item)
              ).length;
              const placeholderCount = visibleItems.filter((item) =>
                placeholderDataGenerator.isPlaceholderItem(item)
              ).length;
              console.log(
                `⚡ Fallback render: ${realCount} real + ${placeholderCount} placeholders at scroll ${Math.round(
                  scrollTop / 1000
                )}k`
              );
            }
          }
        }
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

    // RENDER visible items with placeholder data support
    if (hasRangeChanged || isPageJump) {
      if (state.paginationStrategy === "page") {
        // Get items to render (could be real or fake)
        const itemsToRender = state.visibleItems || [];

        // Calculate positions for virtual rendering
        const positions = itemsToRender
          .map((item, localIndex) => {
            if (!item?.id) return null;

            let offset: number;

            // Handle placeholder items differently than real items
            if (placeholderDataGenerator.isPlaceholderItem(item)) {
              // For placeholder items, use the same positioning as real items (they now have real IDs)
              const itemId = parseInt(item.id);
              offset = (itemId - 1) * itemHeight; // Standard positioning

              // Light debug logging for first fake item only
              if (PLACEHOLDER.DEBUG_LOGGING && localIndex === 0) {
                console.log(
                  `🎭 Placeholder item ${itemId} at ${Math.round(
                    offset / 1000
                  )}k`
                );
              }
            } else {
              // Real items always use their precise natural position
              const itemId = parseInt(item.id);
              offset = (itemId - 1) * itemHeight; // Precise calculation - no repositioning
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

    // Calculate total height with proper boundary constraints
    if (state.totalHeightDirty && !isPageJump) {
      let totalHeight: number;

      if (state.useStatic) {
        totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      } else if (state.itemCount) {
        // 🛡️ BOUNDARY FIX: Use actual item count for total height calculation
        totalHeight = state.itemCount * itemHeight;

        if (PLACEHOLDER.DEBUG_LOGGING) {
          console.log(
            `📐 Total height calculated: ${Math.round(
              totalHeight / 1000
            )}k for ${state.itemCount} items`
          );
        }
      } else {
        // Keep existing height if we have one and it's reasonable
        if (state.totalHeight > 0) {
          // 🛡️ SANITY CHECK: If existing height is unreasonably large compared to actual data, recalculate
          const actualItemCount = state.items.length;
          const expectedHeight = actualItemCount * itemHeight;

          if (state.totalHeight > expectedHeight * 10) {
            // More than 10x expected
            console.warn(
              `⚠️ Total height too large (${Math.round(
                state.totalHeight / 1000
              )}k), recalculating from actual items`
            );
            totalHeight = expectedHeight;
          } else {
            state.totalHeightDirty = false;
            return;
          }
        } else {
          totalHeight = itemMeasurement.calculateTotalHeight(state.items);
        }
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

    // Don't run load checks during the initial phase (scroll near 0, low page numbers)
    // This prevents boundary detection from corrupting the initial load
    if (scrollTop <= 10 && state.page <= 2) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🚫 Skip load check - initial phase (scroll: ${scrollTop}, page: ${state.page})`
        );
      }
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
   * Replace placeholder items with real items when they load
   * This provides seamless transition from fake to real content
   */
  const replacePlaceholdersWithReal = (newRealItems: any[]): void => {
    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `🔄 [PlaceholderReplace] Processing ${newRealItems.length} new real items`
      );
    }

    if (!PLACEHOLDER.ENABLED || !state.visibleItems) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🚫 [PlaceholderReplace] Skipped - placeholders disabled or no visible items`
        );
      }
      return;
    }

    const visiblePlaceholders = state.visibleItems.filter((item) =>
      placeholderDataGenerator.isPlaceholderItem(item)
    );

    if (PLACEHOLDER.DEBUG_LOGGING) {
      console.log(
        `🔍 [PlaceholderReplace] Found ${visiblePlaceholders.length} placeholder(s) in ${state.visibleItems.length} visible items`
      );
    }

    let hasReplacements = false;
    let replacementCount = 0;

    const updatedVisibleItems = state.visibleItems.map((item) => {
      if (placeholderDataGenerator.isPlaceholderItem(item)) {
        // Try to find a matching real item (direct ID matching since placeholder items now use real IDs)
        const fakeItemId = parseInt(item.id);
        const matchingRealItem = newRealItems.find(
          (realItem) => parseInt(realItem.id) === fakeItemId
        );

        if (matchingRealItem) {
          hasReplacements = true;
          replacementCount++;
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(
              `✅ [PlaceholderReplace] Replaced placeholder ${fakeItemId} with real item`
            );
          }
          return matchingRealItem;
        } else {
          if (PLACEHOLDER.DEBUG_LOGGING) {
            console.log(
              `⏭️ [PlaceholderReplace] No matching real item found for placeholder ${fakeItemId}`
            );
          }
        }
      }
      return item;
    });

    if (hasReplacements) {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `🎉 [PlaceholderReplace] Successfully replaced ${replacementCount} placeholder(s), triggering re-render`
        );
      }

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
    } else {
      if (PLACEHOLDER.DEBUG_LOGGING) {
        console.log(
          `ℹ️ [PlaceholderReplace] No replacements made - no matching items found`
        );
      }
    }
  };

  return {
    updateVisibleItems,
    checkLoadMore,
    replacePlaceholdersWithReal,
  };
};
