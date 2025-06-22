// src/core/collection/list-manager/index.ts
import { createCollection, COLLECTION_EVENTS } from "../collection";
import { createRouteAdapter } from "../adapters/route";
import {
  ListManagerConfig,
  ListManager,
  PaginationMeta,
  LoadStatus,
  ScrollToPosition,
  PAGE_EVENTS,
  PageEvent,
  PageChangeEventData,
  VisibleRange,
} from "./types";
import { validateConfig, determineApiMode, getStaticItems } from "./config";
import {
  createDomElements,
  updateSpacerHeight,
  cleanupDomElements,
} from "./dom-elements";
import { createItemMeasurement } from "./item-measurement";
import { createRenderer } from "./renderer";
import { createScrollTracker } from "./scroll-tracker";
import { createRecyclingPool } from "./utils/recycling";
import {
  calculateVisibleRange,
  isLoadThresholdReached,
} from "./utils/visibility";
import {
  createInitialState,
  updateStateAfterLoad,
  updateVisibleItems as updateStateVisibleItems,
  updateTotalHeight,
  updateLoadingState,
  resetState,
  createLoadParams,
} from "./state";

// Params types
interface LoadParams {
  page?: number;
  cursor?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

/**
 * Creates a list manager for a specific collection
 * @param {string} collection - Collection name
 * @param {HTMLElement} container - Container element
 * @param {ListManagerConfig} config - Configuration options
 * @returns {ListManager} List manager methods
 */
export const createListManager = (
  collection: string,
  container: HTMLElement,
  config: ListManagerConfig
): ListManager => {
  // Version tracking for debugging
  console.log("🔧 [ListManager] Version: 2024.1.15-consistent-init");

  // Add collection name to config
  config.collection = collection;

  // Validate and merge configuration
  const validatedConfig = validateConfig(config);

  if (!container || !(container instanceof HTMLElement)) {
    throw new Error("List manager requires a valid container element");
  }

  // Determine API mode and get static items
  const useApi = determineApiMode(validatedConfig);
  const useStatic = !useApi;

  // Get initial static items (only if we're in static mode)
  const initialItems = useStatic ? getStaticItems(validatedConfig) : [];

  // Create state object with initial values
  const state = {
    // Core state
    ...createInitialState(validatedConfig),
    items: initialItems || [],
    useStatic: !useApi,
    mounted: false,

    // Virtual scrolling support
    virtualOffset: 0, // Offset for virtual positioning when jumping to pages

    // Measurement and layout
    containerHeight: container.clientHeight,
    totalHeightDirty: true,
  };

  // Create DOM elements
  const elements = createDomElements(container);

  // Initialize tools and utilities
  const itemMeasurement = createItemMeasurement(validatedConfig.itemHeight);
  const recyclePool = createRecyclingPool();
  const renderer = createRenderer(
    validatedConfig,
    elements,
    itemMeasurement,
    recyclePool
  );

  // Initialize collection for data management
  const itemsCollection = createCollection({
    transform: validatedConfig.transform,
    initialCapacity: useStatic ? initialItems.length : 50, // Optimize initial capacity
  });

  // Initialize route adapter (only if in API mode)
  const adapter = useApi
    ? createRouteAdapter({
        base: validatedConfig.baseUrl!,
        endpoints: {
          list: `/${collection}`,
        },
        headers: {
          "Content-Type": "application/json",
        },
        cache: true, // Enable caching for API requests
        // Pass the pagination configuration if provided
        pagination: validatedConfig.pagination
          ? {
              strategy: validatedConfig.pagination.strategy || "cursor",
              ...validatedConfig.pagination,
            }
          : { strategy: "cursor" },
      })
    : null;

  // Track cleanup functions
  const cleanupFunctions: (() => void)[] = [];

  // Flags for managing UI state during operations
  let justJumpedToPage = false;
  let pageJumpTimeout: number | null = null;
  let isPreloadingPages = false;
  let isPageJumpLoad = false; // Track when we're loading due to a page jump
  let scrollStopTimeout: NodeJS.Timeout | null = null; // Track scroll stop debouncing

  // Page change event handling
  const pageEventObservers = new Set<
    (event: PageEvent, data: PageChangeEventData) => void
  >();
  let lastEmittedPage: number | null = null;

  /**
   * Subscribe to page change events
   * @param callback Function to call when page changes
   * @returns Unsubscribe function
   */
  const onPageChange = (
    callback: (event: PageEvent, data: PageChangeEventData) => void
  ) => {
    pageEventObservers.add(callback);
    return () => {
      pageEventObservers.delete(callback);
    };
  };

  /**
   * Emit page change event
   * @param event Event type
   * @param data Event data
   */
  const emitPageChange = (event: PageEvent, data: PageChangeEventData) => {
    console.log(`📢 [PageEvent] Emitting ${event}:`, data);
    pageEventObservers.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error("Error in page change event handler:", error);
      }
    });
  };

  /**
   * Calculate current page based on scroll position
   * @param scrollTop Current scroll position
   * @returns Current page number
   */
  const calculateCurrentPage = (scrollTop: number): number => {
    if (state.paginationStrategy !== "page") return 1;

    const pageSize = validatedConfig.pageSize || 20;
    const itemHeight = validatedConfig.itemHeight || 48;
    const pageHeight = pageSize * itemHeight;

    // Calculate which page we're currently viewing based on scroll position
    const currentPage = Math.floor(scrollTop / pageHeight) + 1;
    return Math.max(1, currentPage);
  };

  /**
   * Check if current page has changed during scroll and emit event
   * @param scrollTop Current scroll position
   */
  const checkPageChange = (scrollTop: number): void => {
    if (state.paginationStrategy !== "page") return;

    const currentPage = calculateCurrentPage(scrollTop);

    if (lastEmittedPage !== null && lastEmittedPage !== currentPage) {
      emitPageChange(PAGE_EVENTS.SCROLL_PAGE_CHANGE, {
        page: currentPage,
        previousPage: lastEmittedPage,
        scrollPosition: scrollTop,
        trigger: "scroll",
      });
    }

    lastEmittedPage = currentPage;
  };

  /**
   * Load items with cursor pagination or from static data
   * @param {LoadParams} params - Query parameters
   * @returns {Promise<Object>} Response with items and pagination metadata
   */
  const loadItems = async (
    params: LoadParams = {}
  ): Promise<{ items: any[]; meta: PaginationMeta }> => {
    console.log(`🔄 [LoadItems] Called with params:`, {
      page: params.page,
      requestedPage: params.page,
      currentStatePage: state.page,
      isPageJumpLoad,
      callStack: new Error().stack?.split("\n").slice(1, 4).join(" -> "),
    });

    // PROTECTION: Prevent unwanted page loads that could corrupt state
    // Allow page jumps and adjacent page boundary loads (previous/next page)
    const isAdjacentPage =
      params.page && state.page && Math.abs(params.page - state.page) === 1;
    const shouldBlock =
      params.page &&
      params.page !== state.page &&
      !isPageJumpLoad &&
      !isAdjacentPage;

    if (shouldBlock) {
      console.warn(
        `🚨 [LoadItems] BLOCKING unexpected page load: requested page ${params.page}, current page ${state.page}, isPageJumpLoad: ${isPageJumpLoad}, isAdjacentPage: ${isAdjacentPage}`
      );
      // Don't load a different page unless it's explicitly a page jump or adjacent boundary load
      return {
        items: state.items,
        meta: { hasNext: state.hasNext, cursor: null },
      };
    } else if (isAdjacentPage && !isPageJumpLoad) {
      console.log(
        `✅ [LoadItems] Allowing adjacent page boundary load: requested page ${params.page}, current page ${state.page}`
      );
    }

    try {
      // Update loading state
      Object.assign(state, updateLoadingState(state, true));

      // If using static data, return the static items
      if (state.useStatic) {
        return {
          items: state.items,
          meta: { hasNext: false, cursor: null },
        };
      }

      // For API-connected lists, use the adapter
      if (!adapter) {
        throw new Error("Cannot load items: API adapter not initialized");
      }

      const response = await adapter.read(params);

      // Process items
      const items = Array.isArray(response.items)
        ? response.items.map(validatedConfig.transform!)
        : [];

      // Store current state.items.length before updating state
      const currentStateItemsLength = state.items.length;

      // For page-based pagination, handle the collection update appropriately
      if (
        state.paginationStrategy === "page" &&
        params.page &&
        currentStateItemsLength === 0
      ) {
        // Only replace the collection if it's truly empty (not for page jumps with existing items)
        console.log(
          `🔄 [LoadItems] Page ${params.page}: Replacing collection (empty state)`
        );
        await itemsCollection.clear();
        if (items.length > 0) {
          await itemsCollection.add(items);
        }
      } else if (state.paginationStrategy === "page") {
        // For page-based pagination with existing items, add without deduplication
        // This handles the case where we're loading adjacent pages via scrolling
        console.log(
          `📄 [LoadItems] Page ${params.page}: Appending to existing collection (scroll-based loading)`
        );
        if (items.length > 0) {
          await itemsCollection.add(items);
        }
      } else {
        // For cursor/offset pagination, use deduplication
        if (validatedConfig.dedupeItems) {
          const existingIds = new Set(
            state.items.map((item) => item.id).filter(Boolean)
          );
          const newItems = items.filter((item) => !existingIds.has(item.id));
          if (newItems.length > 0) {
            await itemsCollection.add(newItems);
          }
        } else {
          // Add all items regardless of duplication
          await itemsCollection.add(items);
        }
      }

      // Update state with new items AFTER collection operations
      if (
        isPageJumpLoad &&
        state.paginationStrategy === "page" &&
        currentStateItemsLength === 0
      ) {
        // Only replace state when collection was truly empty (not for preservePrevious scenarios)
        Object.assign(state, {
          items: [...items],
          cursor: response.meta.cursor ?? null,
          page: response.meta.page ?? params.page,
          hasNext: response.meta.hasNext ?? false,
          totalHeightDirty: true,
          itemCount: response.meta.total ?? items.length,
        });
        console.log(
          `🔄 [LoadItems] Page jump state update: replaced with ${items.length} items`
        );
      } else {
        // Use normal state update logic for regular loads and preservePrevious scenarios
        Object.assign(
          state,
          updateStateAfterLoad(
            state,
            items,
            response.meta,
            validatedConfig.dedupeItems
          )
        );
        console.log(
          `📄 [LoadItems] Regular state update: appended/deduped items`
        );
      }

      // Reset the page jump flag
      isPageJumpLoad = false;

      console.log(`✅ [LoadItems] Page ${params.page} complete:`, {
        stateItemsLength: state.items.length,
        collectionSize: itemsCollection.getSize(),
        isPageJump: isPageJumpLoad,
      });

      // Set totalHeight as dirty to trigger recalculation
      state.totalHeightDirty = true;

      // CRITICAL: If we got a total count from API, immediately set the definitive total height
      if (response.meta.total && !state.useStatic) {
        const definitiveHeight =
          response.meta.total * (validatedConfig.itemHeight || 84);
        state.totalHeight = definitiveHeight;
        state.totalHeightDirty = false; // Mark as clean since we have the definitive height
        updateSpacerHeight(elements, definitiveHeight);

        console.log(
          `🎯 [TotalHeight] Locked in definitive height from API total:`,
          {
            apiTotal: response.meta.total.toLocaleString(),
            itemHeight: validatedConfig.itemHeight || 84,
            definitiveHeight: definitiveHeight.toLocaleString(),
            note: "This height will remain consistent across all pages",
          }
        );
      }

      // Call afterLoad callback if provided
      if (validatedConfig.afterLoad) {
        // Create a read-only copy of the items array to prevent mutation
        const itemsCopy = [...state.items] as any[];

        const loadData: LoadStatus = {
          loading: false,
          hasNext: state.hasNext,
          hasPrev: !!params.cursor || (params.page && params.page > 1),
          items: [...items] as any[], // Use type assertion to satisfy the mutable array requirement
          allItems: itemsCopy,
        };

        validatedConfig.afterLoad(loadData);
      }

      // For cursor-based pagination, we need to track cursor
      if (state.paginationStrategy === "cursor" && response.meta?.cursor) {
        state.cursor = response.meta.cursor;
      } else if (state.paginationStrategy === "page" && params.page) {
        state.page = params.page;
      }

      return {
        items,
        meta: response.meta,
      };
    } catch (error) {
      console.error(`Error loading ${collection}:`, error);
      // Return empty result on error
      return {
        items: [],
        meta: {
          cursor: null,
          hasNext: false,
        },
      };
    } finally {
      // Reset loading state
      Object.assign(state, updateLoadingState(state, false));
    }
  };

  /**
   * Schedule a page load when scrolling stops (debounced)
   * @param {number} targetPage - Page to load when scrolling stops
   */
  const scheduleScrollStopPageLoad = (targetPage: number): void => {
    // Clear any existing timeout
    if (scrollStopTimeout !== null) {
      clearTimeout(scrollStopTimeout);
    }

    // Set new timeout to load page when scrolling stops
    scrollStopTimeout = setTimeout(() => {
      console.log(
        `⏰ [ScrollStop] Scrolling stopped - loading page ${targetPage}`
      );

      // Use the existing loadPage functionality which works perfectly
      loadPage(targetPage);

      scrollStopTimeout = null;
    }, 300); // 300ms debounce delay
  };

  /**
   * Pre-bound update visible items function to avoid recreation
   * @param {number} scrollTop Current scroll position
   */
  const updateVisibleItems = (
    scrollTop = state.scrollTop,
    isPageJump = false
  ): void => {
    if (!state.mounted) return;

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
    if (state.paginationStrategy === "page" && !isPageJump) {
      const itemHeight = validatedConfig.itemHeight || 84;
      const pageSize = validatedConfig.pageSize || 20;
      const virtualItemIndex = Math.floor(scrollTop / itemHeight);
      const calculatedPage = Math.floor(virtualItemIndex / pageSize) + 1;

      if (calculatedPage !== state.page && calculatedPage >= 1) {
        const pageDifference = Math.abs(calculatedPage - state.page);

        console.log(`📍 [ScrollSync] Updating page based on scroll position:`, {
          scrollTop,
          virtualItemIndex,
          calculatedPage,
          previousPage: state.page,
          pageDifference,
          calculation: `floor(${scrollTop}/${itemHeight}) = ${virtualItemIndex}, page = floor(${virtualItemIndex}/${pageSize}) + 1 = ${calculatedPage}`,
        });

        // Detect large scroll jumps (scrollbar dragging) - use debounced loading
        if (pageDifference > 5) {
          console.log(
            `🚀 [ScrollJump] Large scroll jump detected (${pageDifference} pages) - will debounce and load when scrolling stops`
          );

          // Set up debounced page loading for when scrolling stops
          scheduleScrollStopPageLoad(calculatedPage);
        }

        state.page = calculatedPage;
      }
    }

    // Check for page changes during scroll
    checkPageChange(scrollTop);

    // Check if we need to load previous pages (for page-based pagination)
    // But skip if we just jumped to a page
    if (!justJumpedToPage) {
      checkLoadPrevious(scrollTop);
    }

    // Calculate which items should be visible
    // CRITICAL FIX: For page-based navigation with sparse data, we need custom visibility calculation
    let visibleRange: VisibleRange;

    if (state.paginationStrategy === "page") {
      // For page-based pagination, always show all items since they use absolute virtual positioning
      visibleRange = { start: 0, end: state.items.length };

      console.log(`📍 [SparseData] Custom visibility for sparse page data:`, {
        scrollTop,
        totalItems: state.items.length,
        visibleRange,
        itemIds:
          state.items
            .map((item) => item?.id)
            .slice(0, 5)
            .join(", ") + (state.items.length > 5 ? "..." : ""),
        isPageJump,
        note: "Always render all items with virtual positioning for page-based pagination",
      });
    } else {
      // Use standard calculation for non-page-based pagination
      visibleRange = calculateVisibleRange(
        scrollTop,
        state.items,
        state.containerHeight,
        itemMeasurement,
        validatedConfig
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
    // CRITICAL FIX: Always use API total count for virtual scrolling, never local collection size
    if (state.totalHeightDirty && !isPageJump) {
      let totalHeight: number;

      if (state.useStatic) {
        // For static data, calculate from actual items
        totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      } else if (state.itemCount) {
        // CRITICAL: Always use API total count when available for consistent virtual scrolling
        totalHeight = state.itemCount * (validatedConfig.itemHeight || 84);
        console.log(
          `📐 [TotalHeight] Using API total count for consistent virtual scrolling:`,
          {
            apiTotalCount: state.itemCount.toLocaleString(),
            localItemsLength: state.items.length,
            itemHeight: validatedConfig.itemHeight || 84,
            calculatedHeight: totalHeight.toLocaleString(),
            note: "Height based on full dataset, not local collection",
          }
        );
      } else {
        // Fallback to local collection size only if no API total available
        totalHeight = state.items.length * (validatedConfig.itemHeight || 84);
        console.log(`📐 [TotalHeight] Fallback to local collection size:`, {
          localItemsLength: state.items.length,
          itemHeight: validatedConfig.itemHeight || 84,
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
      if (state.paginationStrategy === "page") {
        // CRITICAL FIX: For page-based pagination, always use absolute virtual positioning
        console.log(
          `🎨 [VirtualRender] Rendering with absolute positioning for page-based pagination`
        );

        const itemHeight = validatedConfig.itemHeight || 84;
        const positions = state.items
          .slice(visibleRange.start, visibleRange.end)
          .map((item, localIndex) => {
            if (!item || !item.id) return null;

            const itemId = parseInt(item.id);
            const virtualIndex = itemId - 1; // Convert to 0-based
            const absoluteOffset = virtualIndex * itemHeight;

            return {
              index: visibleRange.start + localIndex,
              item,
              offset: absoluteOffset,
            };
          })
          .filter(Boolean);

        console.log(`🎨 [VirtualRender] Absolute positions:`, {
          totalPositions: positions.length,
          firstItemId: positions[0]?.item.id,
          firstItemOffset: positions[0]?.offset,
          lastItemId: positions[positions.length - 1]?.item.id,
          lastItemOffset: positions[positions.length - 1]?.offset,
        });

        renderItemsWithVirtualPositions(positions);
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
   * @param {number} scrollTop - Current scroll position
   */
  const checkLoadMore = (scrollTop: number): void => {
    console.log(`🔍 [CheckLoadMore] Called with:`, {
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
      console.log(
        `🎯 [CheckLoadMore] Using page boundary detection for page-based pagination`
      );
      checkPageBoundaries(scrollTop);
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
      validatedConfig.loadThreshold!
    );

    const scrollFraction =
      (scrollTop + state.containerHeight) / state.totalHeight;

    console.log(`📏 [CheckLoadMore] Threshold check:`, {
      scrollTop,
      containerHeight: state.containerHeight,
      totalHeight: state.totalHeight,
      loadThreshold: validatedConfig.loadThreshold,
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
      loadNext();
    }
  };

  /**
   * Check if user has scrolled beyond current page boundaries and load adjacent pages
   * This replaces percentage-based thresholds for sparse page data
   * @param {number} scrollTop - Current scroll position
   */
  const checkPageBoundaries = (scrollTop: number): void => {
    if (!state.page || state.items.length === 0) return;

    const itemHeight = validatedConfig.itemHeight || 84;
    const pageSize = validatedConfig.pageSize || 20;

    // Calculate current page boundaries in terms of virtual positions
    const currentPageStart = (state.page - 1) * pageSize + 1;
    const currentPageEnd = state.page * pageSize;

    // Convert to pixel positions
    const currentPageStartPx = (currentPageStart - 1) * itemHeight;
    const currentPageEndPx = currentPageEnd * itemHeight;

    // Define boundary thresholds (load when within 2 item heights of boundary)
    const boundaryThreshold = itemHeight * 2;
    const viewportBottom = scrollTop + state.containerHeight;

    console.log(`🎯 [PageBoundary] Checking boundaries:`, {
      scrollTop,
      viewportBottom,
      currentPage: state.page,
      currentPageStart,
      currentPageEnd,
      currentPageStartPx,
      currentPageEndPx,
      boundaryThreshold,
      itemsInCollection: state.items.length,
      hasNext: state.hasNext,
      hasPrev: state.page > 1,
    });

    // Check if we should load next page (scrolled near bottom of current page)
    if (
      state.hasNext &&
      viewportBottom > currentPageEndPx - boundaryThreshold
    ) {
      const nextPage = state.page + 1;
      const nextPageStart = (nextPage - 1) * pageSize + 1;
      const nextPageEnd = nextPage * pageSize;

      // Check if we already have next page data
      const hasNextPageData = state.items.some((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= nextPageStart && itemId <= nextPageEnd;
      });

      if (!hasNextPageData) {
        console.log(
          `📥 [PageBoundary] Loading next page ${nextPage} (scrolled near bottom)`
        );
        loadNextPageFromBoundary(nextPage);
      }
    }

    // Check if we should load previous page (scrolled near top of current page)
    if (state.page > 1 && scrollTop < currentPageStartPx + boundaryThreshold) {
      const prevPage = state.page - 1;
      const prevPageStart = (prevPage - 1) * pageSize + 1;
      const prevPageEnd = prevPage * pageSize;

      // Check if we already have previous page data
      const hasPrevPageData = state.items.some((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= prevPageStart && itemId <= prevPageEnd;
      });

      if (!hasPrevPageData) {
        console.log(
          `📥 [PageBoundary] Loading previous page ${prevPage} (scrolled near top)`
        );
        loadPreviousPageFromBoundary(prevPage);
      }
    }
  };

  /**
   * Load next page from boundary detection (preserves existing items)
   * @param {number} pageNumber - Page number to load
   */
  const loadNextPageFromBoundary = async (
    pageNumber: number
  ): Promise<void> => {
    if (state.loading) return;

    console.log(
      `🔄 [BoundaryLoad] Loading next page ${pageNumber} from boundary detection`
    );

    const loadParams = createLoadParams(state, "page");
    loadParams.page = pageNumber;

    const perPageParam =
      validatedConfig.pagination?.perPageParamName || "per_page";
    loadParams[perPageParam] = validatedConfig.pageSize || 20;

    try {
      const result = await loadItems(loadParams);
      console.log(`✅ [BoundaryLoad] Next page ${pageNumber} loaded:`, {
        newItemsCount: result.items.length,
        totalItemsNow: state.items.length,
      });
    } catch (error) {
      console.error(
        `❌ [BoundaryLoad] Failed to load next page ${pageNumber}:`,
        error
      );
    }
  };

  /**
   * Load previous page from boundary detection (preserves existing items)
   * @param {number} pageNumber - Page number to load
   */
  const loadPreviousPageFromBoundary = async (
    pageNumber: number
  ): Promise<void> => {
    if (state.loading) return;

    console.log(
      `🔄 [BoundaryLoad] Loading previous page ${pageNumber} from boundary detection`
    );

    const loadParams = createLoadParams(state, "page");
    loadParams.page = pageNumber;

    const perPageParam =
      validatedConfig.pagination?.perPageParamName || "per_page";
    loadParams[perPageParam] = validatedConfig.pageSize || 20;

    try {
      const result = await loadItems(loadParams);
      console.log(`✅ [BoundaryLoad] Previous page ${pageNumber} loaded:`, {
        newItemsCount: result.items.length,
        totalItemsNow: state.items.length,
      });
    } catch (error) {
      console.error(
        `❌ [BoundaryLoad] Failed to load previous page ${pageNumber}:`,
        error
      );
    }
  };

  /**
   * Checks if we need to load previous data based on scroll position
   * @param {number} scrollTop - Current scroll position
   */
  const checkLoadPrevious = (scrollTop: number): void => {
    // Only check for previous pages in page-based pagination
    if (state.paginationStrategy !== "page" || !state.page || state.page <= 1) {
      return;
    }

    // If user is near the top, load previous page
    const threshold = 200; // Load when within 200px of top
    if (scrollTop < threshold && !state.loading) {
      loadPreviousPage();
    }
  };

  /**
   * Loads more items using appropriate pagination strategy
   * @returns {Promise<Object>} Load result
   */
  const loadNext = async (): Promise<{ hasNext: boolean; items: any[] }> => {
    // If we're already at the bottom or loading, do nothing
    if (state.loading || !state.hasNext) {
      return { hasNext: state.hasNext, items: [] };
    }

    // If using static data, there are no more items to load
    if (state.useStatic) {
      return { hasNext: false, items: [] };
    }

    // Get pagination strategy from configuration
    const paginationStrategy = validatedConfig.pagination?.strategy || "cursor";

    // Store the pagination strategy in state for future use
    state.paginationStrategy = paginationStrategy;

    // For page-based pagination, increment the page number for next load
    if (paginationStrategy === "page") {
      // DO NOT mark as page jump - this is normal scroll-based loading
      // isPageJumpLoad should only be true for explicit loadPage() calls

      // If we have a numeric cursor, use that to determine the next page
      if (state.cursor && /^\d+$/.test(state.cursor)) {
        state.page = parseInt(state.cursor, 10);
      }
      // Otherwise increment the current page
      else if (state.page !== undefined) {
        state.page += 1;
      }
      // If no page set yet, start with page 2 (since we're loading "next")
      else {
        state.page = 2;
      }

      console.log(
        `📄 [LoadNext] Loading next page ${state.page} via normal scroll`
      );
    }

    // Create load params for pagination
    const loadParams = createLoadParams(state, paginationStrategy);

    // Add pageSize/limit regardless of strategy
    if (!loadParams.limit && !loadParams.per_page) {
      if (paginationStrategy === "page") {
        // For page-based, use perPage parameter
        const perPageParam =
          validatedConfig.pagination?.perPageParamName || "per_page";
        loadParams[perPageParam] = validatedConfig.pageSize || 20;
      } else {
        // For other strategies, use limit parameter
        const limitParam =
          validatedConfig.pagination?.limitParamName || "limit";
        loadParams[limitParam] = validatedConfig.pageSize || 20;
      }
    }

    const result = await loadItems(loadParams);
    updateVisibleItems(state.scrollTop);

    return {
      hasNext: state.hasNext,
      items: result.items,
    };
  };

  /**
   * Refresh the list with the latest data
   * @returns {Promise<void>}
   */
  const refresh = async (): Promise<void> => {
    // Reset state
    Object.assign(state, resetState(state, initialItems));

    // Clear recycling pools
    recyclePool.clear();

    // Clear collection
    itemsCollection.clear();

    // For static data, re-add the original items
    if (state.useStatic && initialItems && initialItems.length > 0) {
      state.items = [...initialItems];
      await itemsCollection.add(initialItems);
    } else {
      // Load initial data from API
      await loadItems();
    }

    // Update view
    updateVisibleItems(0); // Reset scroll position to top
  };

  /**
   * Loads a specific page (only works with page-based pagination)
   * @param {number} pageNumber - The page number to load (1-indexed)
   * @returns {Promise<Object>} Load result
   */
  const loadPage = async (
    pageNumber: number
  ): Promise<{ hasNext: boolean; items: any[] }> => {
    console.log(`🔄 [LoadPage] Starting loadPage(${pageNumber})`, {
      currentPage: state.page,
      currentItemsLength: state.items.length,
      isAlreadyOnSamePage: state.page === pageNumber,
      callStack: new Error().stack?.split("\n").slice(1, 5).join(" -> "),
    });

    // Validate page number
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new Error("Page number must be a positive integer");
    }

    // Check if we're using page-based pagination
    const paginationStrategy = validatedConfig.pagination?.strategy || "cursor";
    if (paginationStrategy !== "page") {
      throw new Error(
        "loadPage can only be used with page-based pagination strategy"
      );
    }

    // If using static data, there's no pagination
    if (state.useStatic) {
      return { hasNext: false, items: state.items };
    }

    // CRITICAL: If we're already on the same page and have items,
    // just ensure they're rendered instead of reloading
    if (state.page === pageNumber && state.items.length > 0) {
      console.log(
        `⚡ [LoadPage] Already on page ${pageNumber} with ${state.items.length} items - ensuring render`
      );

      // Force a re-render to ensure items are visible
      state.visibleRange = { start: -1, end: -1 };
      renderer.resetVisibleRange();

      // Ensure proper scroll position for page 1
      if (pageNumber === 1) {
        container.scrollTop = 0;
        state.scrollTop = 0;
      }

      // Force immediate render
      requestAnimationFrame(() => {
        updateVisibleItems(state.scrollTop);

        // Double-check after render
        setTimeout(() => {
          if (state.visibleItems.length === 0) {
            console.warn(
              `⚠️ [LoadPage] Force-rendering page ${pageNumber} items`
            );
            updateVisibleItems(0);
          }
        }, 50);
      });

      return { hasNext: state.hasNext, items: state.items };
    }

    // Set the page number in state
    state.page = pageNumber;
    state.paginationStrategy = paginationStrategy;

    console.log(`📌 [LoadPage] Page state set to ${pageNumber}`, {
      statePage: state.page,
      requestedPage: pageNumber,
    });

    // Clear any existing page jump timeout
    if (pageJumpTimeout !== null) {
      clearTimeout(pageJumpTimeout);
      pageJumpTimeout = null;
    }

    // Set flag early to prevent updateVisibleItems from running during operations
    justJumpedToPage = true;

    // Mark this as a page jump load operation
    isPageJumpLoad = true;

    // Don't clear collection - just load the page if not already present
    // Check if we already have the page data
    const pageSize = validatedConfig.pageSize || 20;
    const pageStartId = (pageNumber - 1) * pageSize + 1;
    const pageEndId = pageNumber * pageSize;

    const hasPageData = state.items.some((item) => {
      const itemId = parseInt(item?.id);
      return itemId >= pageStartId && itemId <= pageEndId;
    });

    console.log(`📋 [LoadPage] Page data check:`, {
      pageNumber,
      pageStartId,
      pageEndId,
      hasPageData,
      currentItemsLength: state.items.length,
    });

    let result;

    if (!hasPageData) {
      // Only load if we don't already have the page data
      console.log(`📥 [LoadPage] Loading page ${pageNumber} data from API`);

      const loadParams = createLoadParams(state, paginationStrategy);
      loadParams.page = pageNumber;

      const perPageParam =
        validatedConfig.pagination?.perPageParamName || "per_page";
      loadParams[perPageParam] = validatedConfig.pageSize || 20;

      result = await loadItems(loadParams);

      // CRITICAL: When new data is loaded, give time for collection/renderer to sync
      console.log(`⏳ [LoadPage] Waiting for new data to be processed...`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else {
      // We already have the data, just create a result object
      console.log(`📋 [LoadPage] Page ${pageNumber} data already in memory`);

      const pageItems = state.items.filter((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= pageStartId && itemId <= pageEndId;
      });

      result = {
        items: pageItems,
        meta: { total: state.itemCount, hasNext: state.hasNext },
      };
    }

    // CRITICAL: Clear item measurement cache to ensure fresh calculations
    // This is the root cause - stale cached offsets from previous state
    if (typeof itemMeasurement.clear === "function") {
      itemMeasurement.clear();
    }

    // Force recalculation of all item offsets with new data
    if (typeof itemMeasurement.calculateOffsets === "function") {
      itemMeasurement.calculateOffsets(state.items);
    }

    // SIMPLIFIED: Position to show the requested page
    console.log(`📍 [LoadPage] Positioning to show page ${pageNumber}`);

    // Calculate the absolute scroll position for this page
    const defaultItemHeight = validatedConfig.itemHeight || 48;

    // CRITICAL FIX: Use absolute item position, not local collection index
    // For page 10 (items 181-200), we want to scroll to position (181-1) * itemHeight
    const targetScrollPosition = (pageStartId - 1) * defaultItemHeight;

    console.log(`📍 [LoadPage] Page ${pageNumber} absolute positioning:`, {
      pageStartId,
      itemHeight: defaultItemHeight,
      targetScrollPosition,
      calculation: `(${pageStartId} - 1) × ${defaultItemHeight} = ${targetScrollPosition}px`,
    });

    // IMPORTANT: Don't set scroll position here - it's too early!
    // The DOM hasn't been updated with new items yet, so the scroll will fail
    // We'll set it after DOM rendering in the requestAnimationFrame below
    console.log(
      `📍 [LoadPage] Preparing scroll to ${targetScrollPosition}px (will be set after DOM update)`
    );

    // Force a complete re-render by clearing the visible range first
    state.visibleRange = { start: -1, end: -1 };
    state.containerHeight = container.clientHeight;

    // CRITICAL FIX: Only set total height in loadPage if not already set from API
    if (!state.itemCount) {
      // Fallback calculation if no API total available
      const fallbackTotal = 1000000; // Default fallback
      state.totalHeight = fallbackTotal * defaultItemHeight;

      console.log(`📐 [LoadPage] Fallback total height calculation:`, {
        fallbackTotal: fallbackTotal.toLocaleString(),
        localCollectionSize: state.items.length,
        itemHeight: defaultItemHeight,
        calculatedTotalHeight: state.totalHeight.toLocaleString(),
        note: "Using fallback - API total not available",
      });

      updateSpacerHeight(elements, state.totalHeight);
      state.totalHeightDirty = false;
    } else {
      // API total already set - preserve the locked-in height
      console.log(`📐 [LoadPage] Preserving locked-in total height:`, {
        apiTotal: state.itemCount.toLocaleString(),
        lockedHeight: state.totalHeight.toLocaleString(),
        localCollectionSize: state.items.length,
        note: "Height locked in from API total",
      });
    }

    // Reset renderer and render immediately with DOM updates
    renderer.resetVisibleRange();

    requestAnimationFrame(() => {
      // Temporarily allow updates
      const wasJumpedToPage = justJumpedToPage;
      justJumpedToPage = false;
      updateVisibleItems(targetScrollPosition, true);
      justJumpedToPage = wasJumpedToPage;

      // CRITICAL FIX: Set scroll position AFTER DOM rendering is complete
      // The previous issue was setting scroll before DOM had the new items rendered
      requestAnimationFrame(() => {
        container.scrollTop = targetScrollPosition;
        state.scrollTop = targetScrollPosition;
      });

      // Reset page jump flag after short delay
      setTimeout(() => {
        console.log(
          `🔄 [LoadPage] Resetting justJumpedToPage flag after delay`
        );
        justJumpedToPage = false;
      }, 500);
    });

    // Return result
    return {
      hasNext: state.hasNext,
      items: result.items,
    };
  };

  /**
   * Loads the previous page (only works with page-based pagination)
   * @returns {Promise<Object>} Load result
   */
  const loadPreviousPage = async (): Promise<{
    hasPrev: boolean;
    items: any[];
  }> => {
    // Check if we're using page-based pagination
    const paginationStrategy = validatedConfig.pagination?.strategy || "cursor";
    if (paginationStrategy !== "page") {
      throw new Error(
        "loadPreviousPage can only be used with page-based pagination strategy"
      );
    }

    // Check if we have a current page and can go back
    if (!state.page || state.page <= 1) {
      return { hasPrev: false, items: [] };
    }

    // If using static data, there's no pagination
    if (state.useStatic) {
      return { hasPrev: false, items: [] };
    }

    // Calculate previous page number
    const previousPage = state.page - 1;

    // Create load params for the previous page
    const loadParams = createLoadParams(state, paginationStrategy);
    loadParams.page = previousPage;

    // Add pageSize parameter
    const perPageParam =
      validatedConfig.pagination?.perPageParamName || "per_page";
    loadParams[perPageParam] = validatedConfig.pageSize || 20;

    // Load the previous page
    const response = await adapter.read(loadParams);

    // Process items
    const items = Array.isArray(response.items)
      ? response.items.map(validatedConfig.transform!)
      : [];

    // Prepend items to the beginning of the collection
    if (items.length > 0) {
      // Get current items
      const currentItems = [...state.items];

      // Update state with new items at the beginning
      state.items = [...items, ...currentItems];

      // Add to collection at the beginning
      await itemsCollection.clear();
      await itemsCollection.add(state.items);

      // Update state page number
      state.page = previousPage;

      // Mark height as dirty for recalculation
      state.totalHeightDirty = true;

      // Calculate the height of the new items to adjust scroll position
      const defaultItemHeight = validatedConfig.itemHeight || 48; // Default item height
      const addedHeight = items.length * defaultItemHeight;

      // Adjust scroll position to maintain visual position
      const newScrollTop = state.scrollTop + addedHeight;
      container.scrollTop = newScrollTop;
      state.scrollTop = newScrollTop;

      // Update visible items
      updateVisibleItems(newScrollTop);
    }

    return {
      hasPrev: previousPage > 1,
      items,
    };
  };

  /**
   * Scroll to a specific item by ID
   * @param {string} itemId - Item ID to scroll to
   * @param {string} position - Position ('start', 'center', 'end')
   */
  const scrollToItem = (
    itemId: string,
    position: ScrollToPosition = "start"
  ): void => {
    // Ensure offsets are cached
    if (typeof itemMeasurement.calculateOffsets === "function") {
      itemMeasurement.calculateOffsets(state.items);
    }

    const offset = itemMeasurement.getItemOffset(state.items, itemId);
    if (offset === -1) return;

    let scrollPosition = offset;

    // Adjust position based on requested alignment
    if (position === "center") {
      scrollPosition = offset - state.containerHeight / 2;
    } else if (position === "end") {
      const itemIndex = state.items.findIndex(
        (item) => item && item.id === itemId
      );
      if (itemIndex === -1) return;

      const itemHeight = itemMeasurement.getItemHeight(state.items[itemIndex]);
      scrollPosition = offset - state.containerHeight + itemHeight;
    }

    container.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: "smooth",
    });
  };

  /**
   * Initialize the virtual list
   */
  const initialize = (): (() => void) => {
    // Set mounted flag
    state.mounted = true;

    // Set up scroll tracking with callbacks
    const scrollTracker = createScrollTracker(
      container,
      elements,
      validatedConfig,
      {
        onScroll: updateVisibleItems,
        onLoadMore: loadNext,
      }
    );

    const scrollTrackingCleanup = scrollTracker.setup();
    cleanupFunctions.push(scrollTrackingCleanup);

    // Subscribe to collection changes
    const unsubscribe = itemsCollection.subscribe(({ event }) => {
      if (event === COLLECTION_EVENTS.CHANGE) {
        // Skip updates if we're jumping to a page or preloading
        if (justJumpedToPage || isPreloadingPages) {
          return;
        }

        // Mark total height as dirty to trigger recalculation
        state.totalHeightDirty = true;

        // Use rAF to delay update to next frame for better performance
        requestAnimationFrame(() => {
          updateVisibleItems(state.scrollTop);
        });
      }
    });

    cleanupFunctions.push(unsubscribe);

    // If using static items, add them to the collection right away
    if (state.useStatic && initialItems && initialItems.length > 0) {
      itemsCollection
        .add(initialItems)
        .then(() => {
          // Force an update after adding items
          requestAnimationFrame(() => {
            updateVisibleItems(state.scrollTop);
          });
        })
        .catch((err) => {
          console.error("Error adding static items to collection:", err);
        });
    } else if (!state.useStatic) {
      // Initial load for API data - use loadPage(1) for consistent initialization
      console.log(
        "🚀 [Initialize] Using loadPage(1) for consistent initialization"
      );
      loadPage(1)
        .then(() => {
          console.log("✅ [Initialize] Initial page load complete");
        })
        .catch((err) => {
          console.error("Error loading initial page:", err);
        });
    }

    // Handle resize events with ResizeObserver if available
    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver((entries) => {
        // Only update if container dimensions changed
        for (const entry of entries) {
          if (entry.target === container) {
            const newHeight = container.clientHeight;
            if (newHeight !== state.containerHeight) {
              state.containerHeight = newHeight;

              // Debounce resize handling
              if (state.resizeRAF) {
                cancelAnimationFrame(state.resizeRAF);
              }

              state.resizeRAF = requestAnimationFrame(() => {
                updateVisibleItems(state.scrollTop);
                state.resizeRAF = null;
              });
            }
          }
        }
      });

      resizeObserver.observe(container);

      cleanupFunctions.push(() => {
        resizeObserver.disconnect();

        if (state.resizeRAF) {
          cancelAnimationFrame(state.resizeRAF);
          state.resizeRAF = null;
        }
      });
    } else {
      // Fallback to window resize event
      let resizeTimeout: number | null = null;

      const handleResize = () => {
        // Debounce resize event
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        resizeTimeout = window.setTimeout(() => {
          const newHeight = container.clientHeight;
          if (newHeight !== state.containerHeight) {
            state.containerHeight = newHeight;
            updateVisibleItems(state.scrollTop);
          }

          resizeTimeout = null;
        }, 100);
      };

      // Use 'as any' to bypass TypeScript error with window.addEventListener
      (window as any).addEventListener("resize", handleResize, {
        passive: true,
      });

      cleanupFunctions.push(() => {
        (window as any).removeEventListener("resize", handleResize);

        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
          resizeTimeout = null;
        }
      });
    }

    // Return cleanup function
    return () => {
      // Clear any pending timeouts
      if (pageJumpTimeout !== null) {
        clearTimeout(pageJumpTimeout);
        pageJumpTimeout = null;
      }
      if (scrollStopTimeout !== null) {
        clearTimeout(scrollStopTimeout);
        scrollStopTimeout = null;
      }

      // Run all cleanup functions
      cleanupFunctions.forEach((fn) => fn());
      cleanupFunctions.length = 0;

      // Clear mounted flag
      state.mounted = false;
    };
  };

  // Initialize on creation
  const cleanup = initialize();

  /**
   * Scrolls to the next page and loads it if necessary
   * @returns {Promise<Object>} Load result
   */
  const scrollNext = async (): Promise<{ hasNext: boolean; items: any[] }> => {
    // If we're already at the bottom or loading, do nothing
    if (state.loading || !state.hasNext) {
      return { hasNext: state.hasNext, items: [] };
    }

    console.log(
      `🔄 [ScrollNext] Starting from page ${state.page}, state.items.length: ${state.items.length}`
    );

    // For page-based pagination, increment the page
    if (state.paginationStrategy === "page" && state.page) {
      const nextPage = state.page + 1;
      const pageSize = validatedConfig.pageSize || 20;
      const itemHeight = validatedConfig.itemHeight || 48;

      console.log(`📊 [ScrollNext] Analysis:`, {
        currentPage: state.page,
        nextPage,
        pageSize,
        stateItemsLength: state.items.length,
      });

      // For consistency with direct page navigation, always use loadPage with preservePrevious
      // This ensures the same data is loaded regardless of navigation method
      console.log(
        `🔄 [ScrollNext] Loading page ${nextPage} via loadPage for consistency`
      );

      const result = await loadPage(nextPage);

      console.log(`📦 [ScrollNext] LoadPage result:`, {
        itemsLength: result.items.length,
        firstItemId: result.items[0]?.id,
        lastItemId: result.items[result.items.length - 1]?.id,
      });

      // Since loadPage shows the page at the top, no need to calculate virtual positions
      // The loadPage function already handles positioning

      return result;
    }

    // For other strategies, just load more
    console.log(`🔄 [ScrollNext] Using loadNext for non-page strategy`);
    return loadNext();
  };

  /**
   * Scrolls to the previous page and loads it if necessary
   * @returns {Promise<Object>} Load result
   */
  const scrollPrevious = async (): Promise<{
    hasPrev: boolean;
    items: any[];
  }> => {
    console.log(`🔄 [ScrollPrevious] Entry state check:`, {
      currentPage: state.page,
      itemsLength: state.items.length,
      canGoBack: state.page && state.page > 1,
    });

    // Check if we can go back using state.page
    if (state.loading || !state.page || state.page <= 1) {
      console.log(`❌ [ScrollPrevious] Cannot go back:`, {
        loading: state.loading,
        currentPage: state.page,
        canGoBack: state.page && state.page > 1,
      });
      return { hasPrev: false, items: [] };
    }

    // Only works with page-based pagination
    if (state.paginationStrategy !== "page") {
      return { hasPrev: false, items: [] };
    }

    const pageSize = validatedConfig.pageSize || 20;

    console.log(
      `🔄 [ScrollPrevious] Starting from page ${state.page}, state.items.length: ${state.items.length}`
    );

    const previousPage = state.page - 1;
    const defaultItemHeight = validatedConfig.itemHeight || 48;

    console.log(`📊 [ScrollPrevious] Analysis:`, {
      currentPage: state.page,
      previousPage,
      pageSize,
      stateItemsLength: state.items.length,
    });

    // For consistency with scrollNext, always use loadPage with preservePrevious
    // This ensures the same data is loaded regardless of navigation method
    console.log(
      `🔄 [ScrollPrevious] Loading page ${previousPage} via loadPage for consistency`
    );

    const result = await loadPage(previousPage);

    console.log(`📦 [ScrollPrevious] LoadPage result:`, {
      itemsLength: result.items.length,
      firstItemId: result.items[0]?.id,
      lastItemId: result.items[result.items.length - 1]?.id,
      newStatePage: state.page,
    });

    // Since loadPage shows the page at the top, no need to calculate virtual positions
    // The loadPage function already handles positioning

    return {
      hasPrev: previousPage > 1,
      items: result.items,
    };
  };

  /**
   * Calculate item positions with virtual offset support for page jumping
   * @param items All items in the local state
   * @param visibleRange Visible range with start and end indices
   * @param virtualOffset Virtual offset for positioning items (used when jumping to pages)
   * @returns Array of positions with index, item, and offset
   */
  const calculateItemPositionsWithVirtualOffset = (
    items: any[],
    visibleRange: VisibleRange,
    virtualOffset: number = 0
  ): Array<{ index: number; item: any; offset: number }> => {
    const positions: Array<{ index: number; item: any; offset: number }> = [];

    // CRITICAL: For page jumps, position items at the top of viewport (0px) so they're visible
    // The virtualOffset is used for context but items should be positioned where user can see them
    let currentOffset = 0; // Start at top of viewport, not at virtual offset

    // Calculate positions for visible items starting from the top of viewport
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      if (items[i]) {
        positions.push({
          index: i,
          item: items[i],
          offset: currentOffset,
        });

        // Add this item's height to get the next position
        currentOffset += itemMeasurement.getItemHeight(items[i]);
      }
    }

    console.log(
      `🎯 [VirtualPositioning] Calculated positions with virtual offset:`,
      {
        virtualOffset,
        visibleRangeStart: visibleRange.start,
        visibleRangeEnd: visibleRange.end,
        firstItemOffset: positions[0]?.offset,
        lastItemOffset: positions[positions.length - 1]?.offset,
        itemCount: positions.length,
        note: "Items positioned at viewport top for visibility",
      }
    );

    return positions;
  };

  /**
   * Render items with custom virtual positions
   * @param positions Array of item positions with virtual offsets
   */
  const renderItemsWithVirtualPositions = (
    positions: Array<{ index: number; item: any; offset: number }>
  ): void => {
    if (!elements.content) {
      console.warn("Cannot render items: content element missing");
      return;
    }

    // Clear existing items (except sentinels)
    const existingItems = Array.from(elements.content.children).filter(
      (child) =>
        child !== elements.topSentinel &&
        child !== elements.bottomSentinel &&
        (child as HTMLElement).classList.contains("mtrl-list-item")
    );
    existingItems.forEach((item) => item.remove());

    // Create document fragment for batch DOM updates
    const fragment = document.createDocumentFragment();

    // Render each item at its virtual position
    positions.forEach(({ index, item, offset }) => {
      if (!item) return;

      // Create the item element
      const element = validatedConfig.renderItem(item, index);
      if (!element) return;

      // Add CSS classes
      if (!element.classList.contains("mtrl-list-item")) {
        element.classList.add("mtrl-list-item");
      }

      // Set data attributes
      if (item.id && !element.hasAttribute("data-id")) {
        element.setAttribute("data-id", item.id);
      }

      // Position the element at its virtual offset
      element.style.position = "absolute";
      element.style.top = `${offset}px`;
      element.style.left = "0";
      element.style.width = "100%";

      // Apply render hook if available
      if (renderer.setRenderHook) {
        // Get the current render hook by temporarily setting a new one
        let currentRenderHook:
          | ((item: any, element: HTMLElement) => void)
          | null = null;
        const originalSetRenderHook = renderer.setRenderHook;
        renderer.setRenderHook = (hook) => {
          currentRenderHook = hook;
        };

        // Try to call the hook if it exists
        if (currentRenderHook) {
          currentRenderHook(item, element);
        }

        // Restore the original setRenderHook function
        renderer.setRenderHook = originalSetRenderHook;
      }

      fragment.appendChild(element);
    });

    // Add the fragment to the content
    elements.content.appendChild(fragment);

    // Re-add sentinel elements if they exist
    if (elements.topSentinel && !elements.topSentinel.parentNode) {
      elements.content.insertBefore(
        elements.topSentinel,
        elements.content.firstChild
      );
    }
    if (elements.bottomSentinel && !elements.bottomSentinel.parentNode) {
      elements.content.appendChild(elements.bottomSentinel);
    }

    console.log(
      `🎯 [VirtualRender] Rendered ${positions.length} items with virtual positioning`
    );
  };

  // Return public API
  return {
    // Data loading methods
    loadItems,
    loadNext,
    refresh,
    loadPage,
    loadPreviousPage,
    scrollNext,
    scrollPrevious,

    // View methods
    updateVisibleItems,
    scrollToItem,
    setItemHeights: (heightsMap) => {
      const updated = itemMeasurement.setItemHeights(heightsMap);
      if (updated) {
        state.totalHeightDirty = true;
        updateVisibleItems(state.scrollTop);
      }
      return updated; // Return whether heights were updated
    },

    // Page change events
    onPageChange,
    getCurrentPage: () => calculateCurrentPage(state.scrollTop),

    // Collection change events
    onCollectionChange: (callback) => {
      return itemsCollection.subscribe(({ event, data }) => {
        callback({ type: event, data });
      });
    },

    // Collection access
    getCollection: () => itemsCollection,

    // State accessors
    getVisibleItems: () => state.visibleItems,
    getAllItems: () => state.items,
    isLoading: () => state.loading,
    hasNextPage: () => state.hasNext,
    isApiMode: () => useApi,

    // Hook for external code to affect rendering
    setRenderHook: (hookFn) => {
      renderer.setRenderHook(hookFn);
      // Rerender visible items to apply the hook
      updateVisibleItems(state.scrollTop);
    },

    // Cleanup method
    destroy: () => {
      // Clear any pending timeouts first
      if (pageJumpTimeout !== null) {
        clearTimeout(pageJumpTimeout);
        pageJumpTimeout = null;
      }

      cleanup();

      // Clear all data
      itemsCollection.clear();

      // Clear cached state
      if (typeof itemMeasurement.clear === "function") {
        itemMeasurement.clear();
      }

      // Empty recycling pools
      recyclePool.clear();

      // Clear DOM content
      if (elements.content) {
        elements.content.innerHTML = "";
      }

      // Remove DOM elements
      cleanupDomElements(elements);

      // Disconnect adapter if exists
      if (adapter && typeof adapter.disconnect === "function") {
        adapter.disconnect();
      }
    },
  };
};

/**
 * Utility to create a cursor-based page loader
 * @param list List interface
 * @param listManager List manager instance
 * @param config Page loader configuration
 * @returns Page loader interface
 */
export const createPageLoader = (
  list: { setItems: (items: any[]) => void },
  listManager: ReturnType<typeof createListManager>,
  config: { onLoad?: (status: LoadStatus) => void; pageSize?: number } = {}
) => {
  let currentCursor: string | null = null;
  let loading = false;
  const pageHistory: (string | null)[] = [];
  const pageSize = config.pageSize || 20;

  // Use a throttle to prevent rapid load calls
  let loadThrottleTimer: number | null = null;
  const throttleMs = 200; // Minimum time between load operations

  const load = async (cursor = null, addToHistory = true) => {
    // Prevent concurrent load operations
    if (loading) return;

    // Apply throttling to prevent rapid load operations
    if (loadThrottleTimer !== null) {
      clearTimeout(loadThrottleTimer);
    }

    loading = true;
    config.onLoad?.({
      loading: true,
      hasNext: false,
      hasPrev: pageHistory.length > 0,
      items: [],
      allItems: listManager.getAllItems(),
    });

    try {
      const result = await listManager.loadItems({
        limit: pageSize,
        cursor,
      });

      if (addToHistory && cursor) {
        pageHistory.push(currentCursor);
      }
      currentCursor = result.meta.cursor;

      // Update the list with the new items
      list.setItems(result.items);

      // Notify about load completion
      config.onLoad?.({
        loading: false,
        hasNext: result.meta.hasNext,
        hasPrev: pageHistory.length > 0,
        items: result.items,
        allItems: listManager.getAllItems(),
      });

      return {
        hasNext: result.meta.hasNext,
        hasPrev: pageHistory.length > 0,
      };
    } finally {
      // Set timer to prevent rapid consecutive loads
      loadThrottleTimer = window.setTimeout(() => {
        loading = false;
        loadThrottleTimer = null;
      }, throttleMs);
    }
  };

  const loadNext = () => load(currentCursor);

  const loadPrev = () => {
    const previousCursor = pageHistory.pop();
    return load(previousCursor, false);
  };

  return {
    load,
    loadNext,
    loadPrev,
    get loading() {
      return loading;
    },
    get cursor() {
      return currentCursor;
    },
  };
};

/**
 * Transform functions for common collections
 */
export const transforms = {
  track: (track) => ({
    id: track._id,
    headline: track.title || "Untitled",
    supportingText: track.artist || "Unknown Artist",
    meta: track.year?.toString() || "",
  }),

  playlist: (playlist) => ({
    id: playlist._id,
    headline: playlist.name || "Untitled Playlist",
    supportingText: `${playlist.tracks?.length || 0} tracks`,
    meta: playlist.creator || "",
  }),

  country: (country) => ({
    id: country._id,
    headline: country.name || country.code,
    supportingText: country.continent || "",
    meta: country.code || "",
  }),
};

// Re-export types
export * from "./types";
