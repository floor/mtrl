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
  OFFSET,
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
  cleanup: () => void;
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
    scheduleScrollLoad: (
      targetPageOrOffset: number,
      scrollSpeed: number,
      loadSize?: number
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
  // Optional scroll manager for offset-based auto-loading
  scrollManager?: {
    loadOffsetRange: (offset: number, limit: number) => Promise<void>;
  };
  // Optional deferred loading manager for offset strategy
  deferredLoadManager?: {
    scheduleDeferredLoad: (
      offset: number,
      limit: number,
      scrollSpeed: number
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
    `🔍 [VIEWPORT] Virtual range: items ${firstVirtualItemId}-${lastVirtualItemId} should be visible`
  );
  console.log(
    `🔍 [VIEWPORT] Scroll: ${scrollTop}, Height: ${containerHeight}, ItemHeight: ${itemHeight}`
  );

  console.log(
    `🔍 [VIEWPORT] Buffered viewport: ${bufferedViewportTop}-${bufferedViewportBottom}`
  );
  // console.log(
  //   `🔍 [VIEWPORT] Available items: [${items
  //     .map((item) => item?.id || "null")
  //     .join(", ")}]`
  // );

  // Now find which of these virtual items exist in our current collection
  const visibleIndices: number[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item?.id) continue;

    const itemId = parseInt(item.id);

    // Check if this item ID falls within the visible virtual range (includes overscan via buffered bounds)
    if (itemId >= firstVirtualItemId && itemId <= lastVirtualItemId) {
      visibleIndices.push(i);
      // console.log(`✅ [VIEWPORT] Item ID ${itemId} (index ${i}) is visible`);
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

  // Note: Scroll stop detection is now handled by the unified pagination manager

  /**
   * Unified scroll speed calculation for both page and offset strategies
   * @param scrollTop Current scroll position
   * @param previousScrollTop Previous scroll position
   * @param currentTime Current time
   * @param previousTime Previous time
   * @returns Scroll speed in pixels per millisecond (always positive)
   */
  const calculateScrollSpeed = (
    scrollTop: number,
    previousScrollTop: number,
    currentTime: number,
    previousTime: number
  ): number => {
    const scrollDistance = Math.abs(scrollTop - previousScrollTop);
    const timeDelta = Math.max(currentTime - previousTime, 1); // Avoid division by zero
    return scrollDistance / timeDelta;
  };

  // Note: scheduleScrollStopCheck function removed - using unified scheduleScrollStopLoad instead

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

    // 🔧 UNIFIED SCROLL SPEED: Calculate once and use for both page and offset strategies
    const scrollSpeed = calculateScrollSpeed(
      scrollTop,
      previousScrollTop,
      currentTime,
      previousTime
    );

    // Debug: Show unified scroll speed calculation
    if (scrollSpeed > 0) {
      console.log(
        `🏃 [SCROLL-SPEED] ${scrollSpeed.toFixed(1)}px/ms (${
          state.paginationStrategy
        } strategy)`
      );
    }

    // 🔧 Note: Scroll stop detection is now handled by the unified scheduleScrollStopLoad function

    // Update page for page-based pagination
    if (state.paginationStrategy === "page" && !isPageJump) {
      // For page strategy, use pagination.limitSize or fallback to legacy pageSize
      const pageLimit =
        config.pagination?.limitSize || config.pageSize || DEFAULTS.pageLimit;
      const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
      // 🔧 FIX: Ensure consistent rounding to prevent floating point precision issues
      const virtualItemIndex = Math.floor(Math.round(scrollTop) / itemHeight);
      const calculatedPage = Math.floor(virtualItemIndex / pageLimit) + 1;

      if (calculatedPage !== state.page && calculatedPage >= 1) {
        // Don't update page during initial load phase
        if (scrollTop <= 10 && state.page === 1) {
          return;
        }

        const pageDifference = Math.abs(calculatedPage - state.page);

        // Handle scroll jumps based on speed (pixels per millisecond)
        // Use the already calculated unified scroll speed

        // Always schedule scroll-stop loading for ANY page change - let speed detection handle the rest
        console.log(
          `⏸️ [SCROLL-STOP] Page change detected: page ${
            state.page
          } → ${calculatedPage} (speed: ${scrollSpeed.toFixed(1)}px/ms)`
        );
        paginationManager.scheduleScrollLoad(calculatedPage, scrollSpeed);

        state.page = calculatedPage;
      }
    }

    // Check for page changes
    checkPageChange(scrollTop, state.paginationStrategy);

    // Calculate visible range - pure mechanical calculation
    const itemHeight = config.itemHeight || DEFAULTS.itemHeight;

    // 🎯 SMOOTH SCROLLING: Use viewport multiplier for offset strategy for better UX
    const overscan =
      state.paginationStrategy === "offset"
        ? 0 // No overscan for offset - we use viewport multiplier instead
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

    // 🎯 SMART AUTO-LOADING: Check viewport fill percentage for offset strategy
    if (
      state.paginationStrategy === "offset" &&
      !isPageJump &&
      !state.loading &&
      state.items.length > 0
    ) {
      // Calculate what should be visible vs what is actually visible
      const itemsPerViewport = Math.ceil(state.containerHeight / itemHeight);
      const expectedVisibleItems = itemsPerViewport;
      const actualVisibleItems = visibleRange.end - visibleRange.start;
      const viewportFillPercentage = actualVisibleItems / expectedVisibleItems;

      // 🔧 SCROLL SPEED PROTECTION: Use the already calculated unified scroll speed

      // Define speed thresholds for offset auto-loading
      const isFastScroll = scrollSpeed > SCROLL.FAST_SCROLL_THRESHOLD;

      // Always check for missing data - let scheduleScrollLoad decide based on speed
      if (viewportFillPercentage < OFFSET.AUTO_LOAD_THRESHOLD) {
        const firstItemId = state.items[0] ? parseInt(state.items[0].id) : null;
        const lastItemId = state.items[state.items.length - 1]
          ? parseInt(state.items[state.items.length - 1].id)
          : null;

        console.log(
          `🎯 [OFFSET-AUTO] Viewport fill: ${(
            viewportFillPercentage * 100
          ).toFixed(
            1
          )}% (${actualVisibleItems}/${expectedVisibleItems}) - below ${
            OFFSET.AUTO_LOAD_THRESHOLD * 100
          }% threshold`
        );

        // Calculate what data we need based on current scroll position
        const firstVirtualItemId =
          Math.floor(Math.round(scrollTop) / itemHeight) + 1;
        const lastVirtualItemId =
          Math.floor(
            Math.round(scrollTop + state.containerHeight) / itemHeight
          ) + 1;

        // 🎯 VIEWPORT MULTIPLIER: Use configurable multiplier for smart offset loading
        const viewportMultiplier = DEFAULTS.viewportMultiplier; // From constants
        const optimalLoadSize = Math.max(
          OFFSET.MIN_LOAD_SIZE,
          Math.min(
            OFFSET.MAX_LOAD_SIZE,
            Math.ceil(itemsPerViewport * viewportMultiplier)
          )
        );

        console.log(
          `🎯 [OFFSET-AUTO] Need items ${firstVirtualItemId}-${lastVirtualItemId}, have items ${firstItemId}-${lastItemId}`
        );
        console.log(
          `🎯 [OFFSET-AUTO] Loading ${optimalLoadSize} items (${itemsPerViewport} per viewport × ${viewportMultiplier})`
        );

        // 🔧 FIX: Check if we actually HAVE the needed items to avoid loading wrong ranges
        let startOffset: number;

        // Check if we actually have the items we need in the viewport range
        const neededItemIds = [];
        for (let i = firstVirtualItemId; i <= lastVirtualItemId; i++) {
          neededItemIds.push(i);
        }

        const hasAllNeededItems = neededItemIds.every((itemId) =>
          state.items.some((item) => parseInt(item.id) === itemId)
        );

        if (hasAllNeededItems) {
          console.log(
            `🎯 [OFFSET-AUTO] Already have all needed items (${firstVirtualItemId}-${lastVirtualItemId}) - skipping load`
          );
          return; // Don't load anything, we have what we need
        }

        // Find the first missing item in the needed range
        const firstMissingItemId = neededItemIds.find(
          (itemId) => !state.items.some((item) => parseInt(item.id) === itemId)
        );

        if (firstMissingItemId) {
          startOffset = firstMissingItemId - 1; // 0-based offset
          console.log(
            `🎯 [OFFSET-AUTO] Loading missing items starting from ID ${firstMissingItemId} (offset: ${startOffset})`
          );
        } else {
          // Fallback to original logic
          startOffset = firstVirtualItemId - 1;
          console.log(`🎯 [OFFSET-AUTO] Using fallback offset: ${startOffset}`);
        }

        // Always call scheduleScrollLoad - let it decide based on speed
        console.log(
          `🎯 [MISSING-DATA] Missing data detected: need offset ${startOffset} (speed: ${scrollSpeed.toFixed(
            1
          )}px/ms)`
        );

        // Use scheduleScrollLoad with current speed - purely speed-based decision
        paginationManager.scheduleScrollLoad(
          startOffset,
          scrollSpeed,
          optimalLoadSize
        );
      }
    }

    // Legacy logging for completely empty viewport (for debugging)
    if (visibleRange.end - visibleRange.start === 0) {
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
      } else if (state.paginationStrategy === "cursor") {
        // 🎯 CURSOR PAGINATION: Use loaded items + buffer for height calculation
        // Don't use total itemCount since cursor pagination can't jump to arbitrary positions
        const loadedItemCount = state.items.length;
        const bufferSize = Math.max(config.pageSize || 20, 50); // Buffer for smooth scrolling

        // Use loaded items + buffer instead of total item count
        totalHeight = Math.round((loadedItemCount + bufferSize) * itemHeight);

        console.log(
          `🎯 [CURSOR] Container height: ${loadedItemCount} loaded + ${bufferSize} buffer = ${totalHeight}px`
        );
      } else if (state.itemCount) {
        // 🛡️ BOUNDARY FIX: Use actual item count for total height calculation (page/offset pagination)
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
    } else if (state.paginationStrategy === "offset") {
      // Handle offset-based auto-loading when viewport detects missing data
      const offsetAutoLoad = (state as any).offsetAutoLoadNeeded;

      if (offsetAutoLoad) {
        console.log(
          `🎯 [OFFSET-AUTO] Loading missing data: offset=${offsetAutoLoad.offset}, limit=${offsetAutoLoad.limit}`
        );

        // Clear the auto-load request
        delete (state as any).offsetAutoLoadNeeded;

        // Trigger loading via the scroll manager if available
        if (deps.scrollManager?.loadOffsetRange) {
          console.log(
            `🎯 [OFFSET-AUTO] Triggering auto-load for offset=${offsetAutoLoad.offset}, limit=${offsetAutoLoad.limit}`
          );
          deps.scrollManager.loadOffsetRange(
            offsetAutoLoad.offset,
            offsetAutoLoad.limit
          );
        } else {
          // Fallback: log for debugging
          console.log(
            `🎯 [OFFSET-AUTO] Would load offset=${offsetAutoLoad.offset}, limit=${offsetAutoLoad.limit} (scroll manager not available)`
          );
        }
      }
    } else {
      // Handle traditional infinite scroll (cursor-based)
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

  /**
   * Cleanup function
   */
  const cleanup = (): void => {
    // Speed threshold listener cleanup is handled by lifecycle manager
  };

  return {
    updateVisibleItems,
    checkLoadMore,
    replacePlaceholdersWithReal,
    cleanup,
  };
};
