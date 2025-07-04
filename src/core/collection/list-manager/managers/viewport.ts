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
 * Cursor-specific viewport calculation that constrains to actually loaded items
 * Unlike page/offset pagination, cursor pagination can't assume virtual items exist
 * @param scrollTop Current scroll position
 * @param containerHeight Container height
 * @param items Actually loaded items array
 * @param itemHeight Height of each item
 * @param overscan Number of extra items to render
 * @returns Visible range constrained to loaded items
 */
const calculateCursorViewport = (
  scrollTop: number,
  containerHeight: number,
  items: any[],
  itemHeight: number,
  overscan: number = 3
): VisibleRange => {
  if (items.length === 0) {
    return { start: 0, end: 0 };
  }

  // Calculate which array indices should be visible based on sequential positioning
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.floor((scrollTop + containerHeight) / itemHeight) + 1;

  // Add overscan buffer
  const bufferedStart = Math.max(0, startIndex - overscan);
  const bufferedEnd = Math.min(items.length, endIndex + overscan);

  // Special case: if we've scrolled beyond loaded items, show the last available items
  if (bufferedStart >= items.length) {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const lastItemsStart = Math.max(0, items.length - visibleCount);
    return { start: lastItemsStart, end: items.length };
  }

  return { start: bufferedStart, end: bufferedEnd };
};

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

  // Now find which of these virtual items exist in our current collection
  const visibleIndices: number[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item?.id) continue;

    const itemId = parseInt(item.id);

    // Check if this item ID falls within the visible virtual range (includes overscan via buffered bounds)
    if (itemId >= firstVirtualItemId && itemId <= lastVirtualItemId) {
      visibleIndices.push(i);
    }
  }

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

  // 🚀 PERFORMANCE: Cache frequently accessed values to avoid repeated lookups
  const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
  const pageLimit =
    config.pagination?.limitSize || config.pageSize || DEFAULTS.pageLimit;
  const overscanDefault = config.overscan || RENDERING.DEFAULT_OVERSCAN_COUNT;
  const isPageStrategy = () => state.paginationStrategy === "page";
  const isOffsetStrategy = () => state.paginationStrategy === "offset";
  const isCursorStrategy = () => state.paginationStrategy === "cursor";

  // 🚀 PERFORMANCE: Cache pagination flags to avoid function calls on every scroll
  let cachedPaginationFlags = {
    justJumpedToPage: false,
    isPreloadingPages: false,
    isBoundaryLoading: false,
  };
  let flagsCacheTime = 0;
  const CACHE_DURATION = 16; // Cache for ~1 frame (16ms)

  const getCachedPaginationFlags = () => {
    const now = performance.now();
    if (now - flagsCacheTime > CACHE_DURATION) {
      const flags = paginationManager.getPaginationFlags();
      cachedPaginationFlags = {
        justJumpedToPage: flags.justJumpedToPage,
        isPreloadingPages: flags.isPreloadingPages,
        isBoundaryLoading: flags.isBoundaryLoading || false,
      };
      flagsCacheTime = now;
    }
    return cachedPaginationFlags;
  };

  // 🚀 PERFORMANCE: Pre-allocate arrays to avoid garbage collection
  const reusablePositions: Array<{ index: number; item: any; offset: number }> =
    [];
  const reusableNeededIds: number[] = [];

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

    // 🚀 PERFORMANCE: Use cached pagination flags to avoid function call overhead
    const paginationFlags = getCachedPaginationFlags();
    const { justJumpedToPage, isPreloadingPages, isBoundaryLoading } =
      paginationFlags;

    // Skip updates if we're in the middle of a page jump or preloading
    // BUT only for page-based pagination (offset-based doesn't use these concepts)
    // Always allow placeholder replacement updates (they're essential for UX)
    if (
      !isPlaceholderReplacement &&
      isPageStrategy() &&
      (justJumpedToPage || isPreloadingPages || isBoundaryLoading)
    ) {
      return;
    }

    // Get container height - cache it to avoid repeated DOM access
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

    // 🚀 PERFORMANCE: Calculate scroll speed once and reuse
    const scrollSpeed = calculateScrollSpeed(
      scrollTop,
      previousScrollTop,
      currentTime,
      previousTime
    );

    // Update page for page-based pagination
    if (isPageStrategy() && !isPageJump) {
      // 🚀 PERFORMANCE: Cache calculation and avoid repeated Math operations
      const scrollTopRounded = Math.round(scrollTop);
      const virtualItemIndex = Math.floor(scrollTopRounded / itemHeight);
      const calculatedPage = Math.floor(virtualItemIndex / pageLimit) + 1;

      if (calculatedPage !== state.page && calculatedPage >= 1) {
        // Don't update page during initial load phase
        if (scrollTop <= 10 && state.page === 1) {
          return;
        }

        // Schedule scroll-stop loading for page changes
        paginationManager.scheduleScrollLoad(calculatedPage, scrollSpeed);

        state.page = calculatedPage;
      }
    }

    // Check for page changes
    checkPageChange(scrollTop, state.paginationStrategy);

    // 🚀 PERFORMANCE: Use cached overscan value and strategy checks
    const overscan = isOffsetStrategy() ? 0 : overscanDefault;

    let visibleRange = isCursorStrategy()
      ? calculateCursorViewport(
          scrollTop,
          state.containerHeight,
          state.items,
          itemHeight,
          overscan
        )
      : calculateMechanicalViewport(
          scrollTop,
          state.containerHeight,
          state.items,
          itemHeight,
          overscan
        );

    // Check viewport fill percentage for offset strategy
    if (
      isOffsetStrategy() &&
      !isPageJump &&
      !state.loading &&
      state.items.length > 0
    ) {
      // 🚀 PERFORMANCE: Cache expensive calculations
      const itemsPerViewport = Math.ceil(state.containerHeight / itemHeight);
      const actualVisibleItems = visibleRange.end - visibleRange.start;
      const viewportFillPercentage = actualVisibleItems / itemsPerViewport;

      // Check for missing data based on viewport fill percentage
      if (viewportFillPercentage < OFFSET.AUTO_LOAD_THRESHOLD) {
        // 🚀 PERFORMANCE: Cache scroll calculations and avoid repeated Math operations
        const scrollTopRounded = Math.round(scrollTop);
        const scrollBottomRounded = Math.round(
          scrollTop + state.containerHeight
        );
        const firstVirtualItemId =
          Math.floor(scrollTopRounded / itemHeight) + 1;
        const lastVirtualItemId =
          Math.floor(scrollBottomRounded / itemHeight) + 1;

        // 🚀 PERFORMANCE: Use Map for O(1) item lookup instead of O(n) array searches
        const itemIdMap = new Map<number, boolean>();
        for (let i = 0; i < state.items.length; i++) {
          const item = state.items[i];
          if (item?.id) {
            itemIdMap.set(parseInt(item.id), true);
          }
        }

        // 🚀 PERFORMANCE: Check if we have all needed items without creating arrays
        let hasAllNeededItems = true;
        let firstMissingItemId = null;

        for (
          let itemId = firstVirtualItemId;
          itemId <= lastVirtualItemId;
          itemId++
        ) {
          if (!itemIdMap.has(itemId)) {
            hasAllNeededItems = false;
            if (firstMissingItemId === null) {
              firstMissingItemId = itemId;
            }
          }
        }

        if (hasAllNeededItems) {
          return; // Don't load anything, we have what we need
        }

        // 🚀 PERFORMANCE: Use cached multiplier calculation
        const viewportMultiplier = DEFAULTS.viewportMultiplier;
        const optimalLoadSize = Math.max(
          OFFSET.MIN_LOAD_SIZE,
          Math.min(
            OFFSET.MAX_LOAD_SIZE,
            Math.ceil(itemsPerViewport * viewportMultiplier)
          )
        );

        const startOffset = firstMissingItemId
          ? firstMissingItemId - 1
          : firstVirtualItemId - 1;

        // Schedule load with current speed for speed-based decision
        paginationManager.scheduleScrollLoad(
          startOffset,
          scrollSpeed,
          optimalLoadSize
        );
      }
    }

    // Handle empty viewport case
    if (visibleRange.end - visibleRange.start === 0) {
      // Empty viewport - no items visible
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

      // Generate placeholders if we have missing data
      if (
        visibleItems.length === 0 &&
        PLACEHOLDER.ENABLED &&
        !justJumpedToPage
      ) {
        const actualItemCount = state.itemCount || state.items.length;

        if (!(scrollTop === 0 && state.items.length > 0)) {
          // Calculate which virtual items should be visible based on scroll position
          const overscanBuffer = (config.overscan || 3) * itemHeight;
          const viewportTop = Math.max(0, scrollTop - overscanBuffer);
          const viewportBottom =
            scrollTop + state.containerHeight + overscanBuffer;

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

            if (virtualItemId > actualItemCount) break;

            // Check if we already have real data for this item
            const existingRealItem = state.items.find(
              (item) => parseInt(item.id) === virtualItemId
            );

            if (existingRealItem) {
              placeholderItems.push(existingRealItem);
            } else {
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

      const stateUpdates = updateStateVisibleItems(
        state,
        visibleItems,
        visibleRange
      );
      state.visibleItems = stateUpdates.visibleItems;
      state.visibleRange = stateUpdates.visibleRange;
    }

    // Calculate offsets
    if (typeof itemMeasurement.calculateOffsets === "function") {
      itemMeasurement.calculateOffsets(state.items);
    }

    // Render visible items with placeholder data support
    if (hasRangeChanged || isPageJump) {
      if (isPageStrategy() || isOffsetStrategy()) {
        // Get items to render (could be real or fake)
        const itemsToRender = state.visibleItems || [];

        // 🚀 PERFORMANCE: Reuse pre-allocated array to avoid garbage collection
        reusablePositions.length = 0;
        for (
          let localIndex = 0;
          localIndex < itemsToRender.length;
          localIndex++
        ) {
          const item = itemsToRender[localIndex];
          if (!item?.id) continue;

          const itemId = parseInt(item.id);
          const offset = Math.round((itemId - 1) * itemHeight);

          reusablePositions.push({
            index: localIndex,
            item,
            offset,
          });
        }

        renderingManager.renderItemsWithVirtualPositions(reusablePositions);
      } else {
        // Standard rendering for cursor-based pagination only
        renderer.renderVisibleItems(state.items, visibleRange);
      }
    }

    // Calculate total height with proper boundary constraints
    if (state.totalHeightDirty && !isPageJump) {
      let totalHeight: number;

      if (state.useStatic) {
        totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      } else if (state.paginationStrategy === "cursor") {
        // Cursor pagination: Use loaded items + dynamic buffer for height calculation
        const loadedItemCount = state.items.length;

        // Reduce buffer size when nearing end of data
        const hasMoreData = state.hasNext !== false; // Default to true if undefined
        const baseBufferSize = Math.max(config.pageSize || 20, 50);

        const bufferSize = !hasMoreData
          ? Math.min(10, baseBufferSize / 5) // End of data: minimal buffer
          : baseBufferSize; // More data: full buffer

        // Use loaded items + dynamic buffer instead of total item count
        totalHeight = Math.round((loadedItemCount + bufferSize) * itemHeight);
      } else if (state.itemCount) {
        // Use actual item count for total height calculation (page/offset pagination)
        totalHeight = Math.round(state.itemCount * itemHeight);
      } else {
        // Keep existing height if we have one and it's reasonable
        if (state.totalHeight > 0) {
          // Sanity check: If existing height is unreasonably large, recalculate
          const actualItemCount = state.items.length;
          const expectedHeight = Math.round(actualItemCount * itemHeight);

          if (state.totalHeight > expectedHeight * 10) {
            // More than 10x expected
            totalHeight = expectedHeight;
          } else {
            state.totalHeightDirty = false;
            return;
          }
        } else {
          totalHeight = itemMeasurement.calculateTotalHeight(state.items);
        }
      }

      const heightUpdates = updateTotalHeight(state, totalHeight);
      state.totalHeight = heightUpdates.totalHeight;
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
    // 🚀 PERFORMANCE: Use cached pagination flags
    const paginationFlags = getCachedPaginationFlags();
    const { justJumpedToPage, isPreloadingPages, isBoundaryLoading } =
      paginationFlags;

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

    if (isPageStrategy()) {
      // Let page boundaries handle loading for page-based pagination
      paginationManager.checkPageBoundaries(scrollTop);
    } else if (isOffsetStrategy()) {
      // Handle offset-based auto-loading when viewport detects missing data
      const offsetAutoLoad = (state as any).offsetAutoLoadNeeded;

      if (offsetAutoLoad) {
        // Clear the auto-load request
        delete (state as any).offsetAutoLoadNeeded;

        // Trigger loading via the scroll manager if available
        if (deps.scrollManager?.loadOffsetRange) {
          deps.scrollManager.loadOffsetRange(
            offsetAutoLoad.offset,
            offsetAutoLoad.limit
          );
        }
      }
    } else {
      // Handle traditional infinite scroll (cursor-based)
      // 🚀 PERFORMANCE: Use cached itemHeight and avoid repeated calculation
      const loadedContentHeight = state.items.length * itemHeight;
      const scrollProgress =
        (scrollTop + state.containerHeight) / loadedContentHeight;
      const threshold = config.loadThreshold || 0.8;

      // Get current scroll speed for throttling
      const currentTime = performance.now();
      const previousTime = (state as any).lastScrollTime || currentTime;
      const scrollSpeed = calculateScrollSpeed(
        scrollTop,
        state.scrollTop,
        currentTime,
        previousTime
      );

      // Don't load if no more data is available
      const hasMoreData = state.hasNext !== false; // Default to true if undefined

      const shouldLoadMore = isLoadThresholdReached(
        scrollTop,
        state.containerHeight,
        loadedContentHeight,
        threshold
      );

      if (hasMoreData && shouldLoadMore) {
        // Speed-based throttling: Only load immediately during slow scrolling
        const isFastScroll = scrollSpeed > SCROLL.FAST_SCROLL_THRESHOLD;

        if (isFastScroll) {
          // Schedule load for when scrolling stops/slows down
          paginationManager.scheduleScrollLoad(
            Math.floor(scrollTop / itemHeight), // Current virtual index
            scrollSpeed // Current scroll speed
          );
        } else {
          paginationManager.loadNext();
        }
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
