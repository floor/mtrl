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
import { fakeDataGenerator } from "../data-generator";

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
    // CRITICAL: With fake data enabled, let fake data system handle empty virtual space
    // instead of the old EmptyVirtualSpaceFix
    if (FAKE_DATA.ENABLED) {
      // Let fake data system take over - return empty to trigger fake item generation
      if (FAKE_DATA.DEBUG_LOGGING && scrollTop > 1000000) {
        console.log(
          `🎭 Empty virtual space - delegating to fake data at scroll ${Math.round(
            scrollTop / 1000
          )}k`
        );
      }
      return { start: 0, end: 0 };
    }

    // Legacy EmptyVirtualSpaceFix (only when fake data is disabled)
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

    // Lightweight debugging for critical scroll positions
    if (scrollTop > 2000000 && FAKE_DATA.DEBUG_LOGGING) {
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

      // 🚀 CRITICAL FIX: ALWAYS generate placeholders immediately when visible range changes
      // This ensures no empty space during fast scrolling - placeholders are completely decoupled from data loading
      if (FAKE_DATA.ENABLED && !justJumpedToPage) {
        // 🛡️ BOUNDARY CHECK: Determine the actual data boundaries
        const actualItemCount = state.itemCount || state.items.length;
        const maxScrollableHeight = actualItemCount * itemHeight;

        // Don't generate placeholders if we're beyond the actual data
        if (scrollTop >= maxScrollableHeight) {
          // Force scroll position to the end of actual data
          const maxScrollPosition = Math.max(
            0,
            maxScrollableHeight - state.containerHeight
          );
          if (scrollTop > maxScrollPosition) {
            container.scrollTop = maxScrollPosition;
            state.scrollTop = maxScrollPosition;
            scrollTop = maxScrollPosition;

            if (FAKE_DATA.DEBUG_LOGGING) {
              console.log(
                `🛑 Scroll clamped to data boundary: ${Math.round(
                  maxScrollPosition / 1000
                )}k (max: ${Math.round(maxScrollableHeight / 1000)}k)`
              );
            }
          }
        }

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

        // 🛡️ BOUNDARY CHECK: Constrain virtual indices to actual data range
        const maxVirtualIndex = actualItemCount - 1; // 0-based index
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
          20 // Reasonable limit for fast scrolling
        );

        // Generate immediate placeholders for the entire visible range
        const placeholderItems = [];
        for (let i = 0; i < itemsNeeded; i++) {
          const virtualIndex = constrainedFirstIndex + i;
          const virtualItemId = virtualIndex + 1; // Convert to 1-based ID

          // 🛡️ FINAL BOUNDARY CHECK: Don't create items beyond the dataset
          if (virtualItemId > actualItemCount) {
            if (FAKE_DATA.DEBUG_LOGGING) {
              console.log(
                `🛑 Stopping at boundary: item ${virtualItemId} > ${actualItemCount}`
              );
            }
            break;
          }

          // Check if we already have real data for this item
          const existingRealItem = state.items.find(
            (item) => parseInt(item.id) === virtualItemId
          );

          if (existingRealItem) {
            // Use real data if available
            placeholderItems.push(existingRealItem);
          } else {
            // Generate placeholder for missing data (only within bounds)
            const placeholderItem = fakeDataGenerator.generateFakeItem(
              virtualIndex,
              state.items
            );
            if (placeholderItem) {
              placeholderItems.push(placeholderItem);
            }
          }
        }

        // Use placeholder items as the visible items
        visibleItems = placeholderItems;

        // Update visible range to match placeholder items
        visibleRange = { start: 0, end: visibleItems.length };

        // Lightweight logging for immediate placeholder generation
        if (FAKE_DATA.DEBUG_LOGGING) {
          const realCount = visibleItems.filter(
            (item) => !fakeDataGenerator.isFakeItem(item)
          ).length;
          const placeholderCount = visibleItems.filter((item) =>
            fakeDataGenerator.isFakeItem(item)
          ).length;
          console.log(
            `⚡ Bounded render: ${realCount} real + ${placeholderCount} placeholders at scroll ${Math.round(
              scrollTop / 1000
            )}k (max: ${Math.round(maxScrollableHeight / 1000)}k)`
          );
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
              // For fake items, use the same positioning as real items (they now have real IDs)
              const itemId = parseInt(item.id);
              offset = (itemId - 1) * itemHeight; // Standard positioning

              // Light debug logging for first fake item only
              if (FAKE_DATA.DEBUG_LOGGING && localIndex === 0) {
                console.log(
                  `🎭 Fake item ${itemId} at ${Math.round(offset / 1000)}k`
                );
              }
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

                // Light debug logging for empty virtual space repositioning
                if (FAKE_DATA.DEBUG_LOGGING && localIndex === 0) {
                  console.log(
                    `🎯 Repositioning item ${itemId} to scroll position`
                  );
                }
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

    // Calculate total height with proper boundary constraints
    if (state.totalHeightDirty && !isPageJump) {
      let totalHeight: number;

      if (state.useStatic) {
        totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      } else if (state.itemCount) {
        // 🛡️ BOUNDARY FIX: Use actual item count for total height calculation
        totalHeight = state.itemCount * itemHeight;

        if (FAKE_DATA.DEBUG_LOGGING) {
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
        // Try to find a matching real item (direct ID matching since fake items now use real IDs)
        const fakeItemId = parseInt(item.id);
        const matchingRealItem = newRealItems.find(
          (realItem) => parseInt(realItem.id) === fakeItemId
        );

        if (matchingRealItem) {
          hasReplacements = true;
          if (FAKE_DATA.DEBUG_LOGGING) {
            console.log(`🔄 Replaced fake ${fakeItemId} with real`);
          }
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
