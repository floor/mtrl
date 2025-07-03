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
  updateVisibleItems: (
    scrollTop?: number,
    isPageJump?: boolean,
    isPlaceholderReplacement?: boolean
  ) => void;
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
    scheduleScrollStopPageLoad: (
      targetPage: number,
      scrollSpeed: number
    ) => void;
    checkPageBoundaries: (scrollTop: number) => void;
    loadNext: () => Promise<{ hasNext: boolean; items: any[] }>;
    getPaginationFlags: () => {
      justJumpedToPage: boolean;
      isPreloadingPages: boolean;
      isBoundaryLoading?: boolean;
    };
  };
  renderingManager: {
    renderItemsWithVirtualPositions: (
      positions: Array<{ index: number; item: any; offset: number }>
    ) => void;
  };
}

/**
 * 🔧 STABLE viewport calculation - position-based, not data-based
 * This ensures the viewport calculation is consistent regardless of what data is loaded
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

  // 🔧 NEW APPROACH: Calculate which VIRTUAL ITEMS should be visible based on scroll position
  // This is stable regardless of what data is currently loaded
  const bufferHeight = overscan * itemHeight;

  // Use actual viewport boundaries for determining visible items
  const actualViewportTop = scrollTop;
  const actualViewportBottom = scrollTop + containerHeight;

  // Use buffered boundaries for item collection (includes overscan)
  const bufferedViewportTop = Math.max(0, scrollTop - bufferHeight);
  const bufferedViewportBottom = scrollTop + containerHeight + bufferHeight;

  // Calculate which virtual item IDs should be visible (using actual viewport, not buffered)
  // 🔧 FIX: Use actual viewport bounds for visibility calculation
  const firstVirtualItemId =
    Math.floor(Math.round(actualViewportTop) / itemHeight) + 1;
  const lastVirtualItemId =
    Math.floor(Math.round(actualViewportBottom) / itemHeight) + 1;

  console.log(
    `🔍 [VIEWPORT] Calculation: firstVirtualItemId = floor(${Math.round(
      actualViewportTop
    )}) / ${itemHeight}) + 1 = ${firstVirtualItemId}`
  );
  console.log(
    `🔍 [VIEWPORT] Calculation: lastVirtualItemId = floor(${Math.round(
      actualViewportBottom
    )}) / ${itemHeight}) + 1 = ${lastVirtualItemId}`
  );

  console.log(
    `🔍 [VIEWPORT] Virtual range: items ${firstVirtualItemId}-${lastVirtualItemId} should be visible`
  );
  console.log(
    `🔍 [VIEWPORT] Scroll: ${scrollTop}, Height: ${containerHeight}, ItemHeight: ${itemHeight}`
  );
  console.log(
    `🔍 [VIEWPORT] Actual viewport: ${actualViewportTop}-${actualViewportBottom}`
  );
  console.log(
    `🔍 [VIEWPORT] Buffered viewport: ${bufferedViewportTop}-${bufferedViewportBottom}`
  );
  console.log(
    `🔍 [VIEWPORT] Available items: [${items
      .map((item) => item?.id || "null")
      .join(", ")}]`
  );

  // Now find which of these virtual items exist in our current collection
  const visibleIndices: number[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item?.id) continue;

    const itemId = parseInt(item.id);

    // Check if this item ID falls within the visible virtual range (includes overscan via buffered bounds)
    if (itemId >= firstVirtualItemId && itemId <= lastVirtualItemId) {
      visibleIndices.push(i);
      console.log(`✅ [VIEWPORT] Item ID ${itemId} (index ${i}) is visible`);
    }
  }

  console.log(
    `🔍 [VIEWPORT] Found ${visibleIndices.length} visible items from ${items.length} total items`
  );

  // If no items from the collection are visible, delegate to placeholder system
  if (visibleIndices.length === 0) {
    if (PLACEHOLDER.ENABLED) {
      // Let placeholder data system handle empty virtual space
      return { start: 0, end: 0 };
    }

    // Legacy EmptyVirtualSpaceFix (only when placeholder data is disabled)
    if (items.length > 0) {
      const endBuffer = Math.min(overscan, items.length);
      return {
        start: Math.max(0, items.length - endBuffer),
        end: items.length,
      };
    }

    return { start: 0, end: 0 };
  }

  // Return the indices of visible items in the current collection
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
   * @param isPlaceholderReplacement Whether this update is for placeholder replacement
   */
  const updateVisibleItems = (
    scrollTop = state.scrollTop,
    isPageJump = false,
    isPlaceholderReplacement = false
  ): void => {
    if (!state.mounted) return;

    const paginationFlags = paginationManager.getPaginationFlags();
    const { justJumpedToPage, isPreloadingPages } = paginationFlags;
    const isBoundaryLoading = paginationFlags.isBoundaryLoading || false;

    // Skip updates if we're in the middle of a page jump or preloading
    // BUT only for page-based pagination (offset-based doesn't use these concepts)
    // Always allow placeholder replacement updates (they're essential for UX)
    if (
      !isPlaceholderReplacement &&
      state.paginationStrategy === "page" &&
      (justJumpedToPage || isPreloadingPages || isBoundaryLoading)
    ) {
      console.log(
        `⏸️ [VIEWPORT] Skipping render due to pagination flags: justJumped=${justJumpedToPage}, preloading=${isPreloadingPages}, boundary=${isBoundaryLoading}`
      );
      return;
    }

    // For offset-based pagination, always allow rendering (no page-based blocking)
    if (state.paginationStrategy === "offset") {
      console.log(
        `🎯 [VIEWPORT] Offset-based rendering - bypassing page-based flags`
      );
      console.log(
        `📊 [VIEWPORT] Items count: ${state.items.length}, scrollTop: ${scrollTop}`
      );
    }

    // Get container height
    if (state.containerHeight === 0) {
      state.containerHeight =
        container.clientHeight || DEFAULTS.containerHeight;
    }

    // Update scroll position and track timing for speed calculation
    const previousScrollTop = state.scrollTop;
    const currentTime = performance.now();
    const previousTime = (state as any).lastScrollTime || currentTime;
    (state as any).lastScrollTime = currentTime;
    state.scrollTop = scrollTop;

    // Update page for page-based pagination
    if (state.paginationStrategy === "page" && !isPageJump) {
      const pageSize = config.pageSize || 20;
      const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
      // 🔧 FIX: Ensure consistent rounding to prevent floating point precision issues
      const virtualItemIndex = Math.floor(Math.round(scrollTop) / itemHeight);
      const calculatedPage = Math.floor(virtualItemIndex / pageSize) + 1;

      if (calculatedPage !== state.page && calculatedPage >= 1) {
        // Don't update page during initial load phase
        if (scrollTop <= 10 && state.page === 1) {
          return;
        }

        const pageDifference = Math.abs(calculatedPage - state.page);

        // Handle scroll jumps based on speed (pixels per millisecond)
        const scrollDistance = Math.abs(scrollTop - previousScrollTop);
        const timeDelta = Math.max(currentTime - previousTime, 1); // Avoid division by zero
        const scrollSpeed = scrollDistance / timeDelta;

        // Always schedule scroll-stop loading for ANY page change - let speed detection handle the rest
        console.log(
          `⏸️ [SCROLL-STOP] Page change detected: page ${
            state.page
          } → ${calculatedPage} (speed: ${scrollSpeed.toFixed(1)}px/ms)`
        );
        paginationManager.scheduleScrollStopPageLoad(
          calculatedPage,
          scrollSpeed
        );

        state.page = calculatedPage;
      }
    }

    // Check for page changes
    checkPageChange(scrollTop, state.paginationStrategy);

    // Calculate visible range - pure mechanical calculation
    const itemHeight = config.itemHeight || DEFAULTS.itemHeight;

    // 🎯 ULTRA-EFFICIENT: Minimal overscan for offset strategy since we load on-demand
    const overscan =
      state.paginationStrategy === "offset"
        ? 0 // No overscan - load exactly what's visible
        : config.overscan || RENDERING.DEFAULT_OVERSCAN_COUNT;

    console.log(
      `🎯 [VIEWPORT] Using overscan: ${overscan} for ${state.paginationStrategy} strategy`
    );

    let visibleRange = calculateMechanicalViewport(
      scrollTop,
      state.containerHeight,
      state.items,
      itemHeight,
      overscan
    );

    console.log(
      `📐 [VIEWPORT] Visible range calculated: start=${visibleRange.start}, end=${visibleRange.end}`
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

      console.log(
        `❌ [VIEWPORT] No items visible - firstItemId: ${firstItemId}, lastItemId: ${lastItemId}`
      );
      console.log(
        `❌ [VIEWPORT] Viewport range: ${viewportTop} to ${viewportBottom}`
      );
    }

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
        // We have real items - use them
      } else if (PLACEHOLDER.ENABLED && !justJumpedToPage) {
        // We don't have real items for this range - generate placeholders only as a fallback
        const actualItemCount = state.itemCount || state.items.length;

        if (scrollTop === 0 && state.items.length > 0) {
          // Special case: if we're at the top and have items, don't generate placeholders
          // This prevents the initial replacement issue
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
          // 🔧 FIX: Ensure consistent rounding to prevent floating point precision issues
          const firstVirtualIndex = Math.floor(
            Math.round(viewportTop) / itemHeight
          );
          const lastVirtualIndex = Math.floor(
            Math.round(viewportBottom) / itemHeight
          );

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
      console.log(
        `🎨 [VIEWPORT] Rendering - hasRangeChanged: ${hasRangeChanged}, isPageJump: ${isPageJump}`
      );
      console.log(
        `🎨 [VIEWPORT] Pagination strategy: ${state.paginationStrategy}`
      );
      console.log(
        `🎨 [VIEWPORT] Visible items count: ${state.visibleItems?.length || 0}`
      );

      if (
        state.paginationStrategy === "page" ||
        state.paginationStrategy === "offset"
      ) {
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
              offset = Math.round((itemId - 1) * itemHeight); // 🔧 FIX: Round to prevent floating point precision issues
            } else {
              // Real items always use their precise natural position
              const itemId = parseInt(item.id);
              offset = Math.round((itemId - 1) * itemHeight); // 🔧 FIX: Round to prevent floating point precision issues
            }

            return {
              index: localIndex,
              item,
              offset,
            };
          })
          .filter(Boolean);

        console.log(
          `🎨 [VIEWPORT] Rendering ${positions.length} items with virtual positions (${state.paginationStrategy} strategy)`
        );
        renderingManager.renderItemsWithVirtualPositions(positions);
      } else {
        // Standard rendering for cursor-based pagination only
        console.log(
          `🎨 [VIEWPORT] Standard rendering - items: ${state.items.length}, range: ${visibleRange.start}-${visibleRange.end}`
        );
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
        totalHeight = Math.round(state.itemCount * itemHeight); // 🔧 FIX: Round to prevent floating point precision issues
      } else {
        // Keep existing height if we have one and it's reasonable
        if (state.totalHeight > 0) {
          // 🛡️ SANITY CHECK: If existing height is unreasonably large compared to actual data, recalculate
          const actualItemCount = state.items.length;
          const expectedHeight = Math.round(actualItemCount * itemHeight); // 🔧 FIX: Round to prevent floating point precision issues

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
    const paginationFlags = paginationManager.getPaginationFlags();
    const { justJumpedToPage, isPreloadingPages } = paginationFlags;
    const isBoundaryLoading = paginationFlags.isBoundaryLoading || false;

    if (
      state.loading ||
      justJumpedToPage ||
      isPreloadingPages ||
      isBoundaryLoading
    ) {
      return;
    }

    // Don't run load checks during the initial phase (scroll near 0, low page numbers)
    // This prevents boundary detection from corrupting the initial load
    if (scrollTop <= 10 && state.page <= 2) {
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
    if (!PLACEHOLDER.ENABLED || !state.visibleItems) {
      return;
    }

    const visiblePlaceholders = state.visibleItems.filter((item) =>
      placeholderDataGenerator.isPlaceholderItem(item)
    );

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
          return matchingRealItem;
        }
      }
      return item;
    });

    if (hasReplacements) {
      // Update state with replaced items
      state.visibleItems = updatedVisibleItems;

      // Trigger re-render with the real items using placeholder replacement flag
      updateVisibleItems(state.scrollTop, false, true);
    }
  };

  return {
    updateVisibleItems,
    checkLoadMore,
    replacePlaceholdersWithReal,
  };
};
