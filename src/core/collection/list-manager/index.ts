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
    if (params.page && params.page !== state.page && !isPageJumpLoad) {
      console.warn(
        `🚨 [LoadItems] BLOCKING unexpected page load: requested page ${params.page}, current page ${state.page}, isPageJumpLoad: ${isPageJumpLoad}`
      );
      // Don't load a different page unless it's explicitly a page jump
      return {
        items: state.items,
        meta: { hasNext: state.hasNext, cursor: null },
      };
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
   * Pre-bound update visible items function to avoid recreation
   * @param {number} scrollTop Current scroll position
   */
  const updateVisibleItems = (scrollTop = state.scrollTop): void => {
    if (!state.mounted) return;

    // Skip updates if we're in the middle of a page jump or preloading
    if (justJumpedToPage || isPreloadingPages) {
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

    // Check for page changes during scroll
    checkPageChange(scrollTop);

    // Check if we need to load previous pages (for page-based pagination)
    // But skip if we just jumped to a page
    if (!justJumpedToPage) {
      checkLoadPrevious(scrollTop);
    }

    // Calculate which items should be visible
    // Calculate which items should be visible
    const visibleRange = calculateVisibleRange(
      scrollTop,
      state.items,
      state.containerHeight,
      itemMeasurement,
      validatedConfig
    );

    // Early return if range hasn't changed
    if (
      visibleRange.start === state.visibleRange.start &&
      visibleRange.end === state.visibleRange.end
    ) {
      return;
    }

    // Update state with new visible range
    Object.assign(
      state,
      updateStateVisibleItems(
        state,
        state.items.slice(visibleRange.start, visibleRange.end).filter(Boolean),
        visibleRange
      )
    );

    // Ensure offsets are cached for efficient access
    if (typeof itemMeasurement.calculateOffsets === "function") {
      itemMeasurement.calculateOffsets(state.items);
    }

    // Calculate total height if needed
    if (state.totalHeightDirty) {
      // For virtual scrolling with API, use the API total count
      const totalHeight = state.useStatic
        ? itemMeasurement.calculateTotalHeight(state.items)
        : (state.itemCount || state.items.length) *
          (validatedConfig.itemHeight || 48);

      console.log(`📐 [TotalHeight] Calculated total height:`, {
        useStatic: state.useStatic,
        itemCount: state.itemCount,
        localItemsLength: state.items.length,
        itemHeight: validatedConfig.itemHeight,
        calculatedHeight: totalHeight.toLocaleString(),
      });

      Object.assign(state, updateTotalHeight(state, totalHeight));

      // Update DOM elements with new height
      updateSpacerHeight(elements, totalHeight);
    }

    // Render visible items
    renderer.renderVisibleItems(state.items, visibleRange);

    // Now measure elements that needed measurement
    const heightsChanged = itemMeasurement.measureMarkedElements(
      elements.content,
      state.items
    );

    // Recalculate total height after measurements if needed
    if (heightsChanged) {
      const totalHeight = itemMeasurement.calculateTotalHeight(state.items);
      Object.assign(state, updateTotalHeight(state, totalHeight));
      updateSpacerHeight(elements, totalHeight);
    }

    // Check if we need to load more data
    checkLoadMore(scrollTop);
  };

  /**
   * Checks if we need to load more data based on scroll position
   * @param {number} scrollTop - Current scroll position
   */
  const checkLoadMore = (scrollTop: number): void => {
    if (state.loading || !state.hasNext) {
      console.log(
        `🚫 [CheckLoadMore] Skipped: loading=${state.loading}, hasNext=${state.hasNext}`
      );
      return;
    }

    // Don't auto-load immediately after page jumps - let the page settle first
    if (justJumpedToPage) {
      console.log(
        `🚫 [CheckLoadMore] Skipped: just jumped to page, letting it settle`
      );
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
    // This can happen with virtual scrolling miscalculations
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
   * @param {Object} options - Load options
   * @param {boolean} options.preservePrevious - Whether to keep previous pages in memory for scrolling
   * @returns {Promise<Object>} Load result
   */
  const loadPage = async (
    pageNumber: number,
    options: { preservePrevious?: boolean } = {}
  ): Promise<{ hasNext: boolean; items: any[] }> => {
    console.log(`🔄 [LoadPage] Starting loadPage(${pageNumber})`, {
      currentPage: state.page,
      currentItemsLength: state.items.length,
      isAlreadyOnSamePage: state.page === pageNumber,
      preservePrevious: options.preservePrevious,
      callStack: new Error().stack?.split("\n").slice(1, 5).join(" -> "),
    });

    // CRITICAL: Track unexpected calls to loadPage
    if (
      pageNumber !== state.page &&
      !options.preservePrevious &&
      pageNumber > state.page
    ) {
      console.warn(
        `🚨 [LoadPage] SUSPICIOUS: Auto-loading higher page ${pageNumber} when current page is ${state.page}`,
        {
          callStack: new Error().stack?.split("\n").slice(1, 8),
        }
      );
    }

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

    // Only clear the collection if we're not preserving previous pages
    if (!options.preservePrevious) {
      await itemsCollection.clear();
      state.items = [];

      // Also clear the recycling pool to ensure fresh rendering
      recyclePool.clear();

      // Clear the content DOM
      if (elements.content) {
        elements.content.innerHTML = "";
      }

      // Reset renderer state to force re-render
      renderer.resetVisibleRange();
    } else {
      // When preserving previous pages, always respect the user's preference
      // Clear collection only if starting fresh or no existing items
      if (state.items.length === 0) {
        await itemsCollection.clear();
        state.items = [];
        recyclePool.clear();

        // Clear the content DOM
        if (elements.content) {
          elements.content.innerHTML = "";
        }

        // Reset renderer state to force re-render
        renderer.resetVisibleRange();
      }
    }

    // Create load params for the specific page
    const loadParams = createLoadParams(state, paginationStrategy);

    // Ensure page parameter is set correctly
    loadParams.page = pageNumber;

    // Add pageSize parameter
    const perPageParam =
      validatedConfig.pagination?.perPageParamName || "per_page";
    loadParams[perPageParam] = validatedConfig.pageSize || 20;

    // Load the specific page
    const result = await loadItems(loadParams);

    // Wait a tick to ensure collection updates are processed
    await new Promise((resolve) => setTimeout(resolve, 0));

    // CRITICAL: Update visible items immediately after loading
    // This ensures items are rendered even though justJumpedToPage is true
    if (!options.preservePrevious) {
      // Force container to top before updating
      container.scrollTop = 0;
      state.scrollTop = 0;

      // Force a complete re-render by clearing the visible range first
      state.visibleRange = { start: -1, end: -1 };

      // Ensure container height is set correctly
      state.containerHeight = container.clientHeight;

      // Use requestAnimationFrame to ensure DOM updates
      requestAnimationFrame(() => {
        // Ensure container has dimensions
        const measureContainer = () => {
          state.containerHeight = container.clientHeight;

          if (state.containerHeight === 0) {
            console.warn("[LoadPage] Container height is 0, retrying...");
            setTimeout(measureContainer, 50);
            return;
          }

          // When jumping to a page, we need to set proper height and scroll position
          const pageSize = validatedConfig.pageSize || 20;
          const itemHeight = validatedConfig.itemHeight || 48;

          // Calculate the virtual scroll position for this page in the full dataset
          const itemsBeforeThisPage = (pageNumber - 1) * pageSize;
          const virtualScrollPosition = itemsBeforeThisPage * itemHeight;

          // Set the virtual offset for this page - this will be used by the renderer
          // to position items at their correct virtual positions
          state.virtualOffset = virtualScrollPosition;

          console.log(`📊 [LoadPage] Virtual scroll calculation:`, {
            pageNumber,
            pageSize,
            itemHeight,
            itemsBeforeThisPage,
            virtualScrollPosition: virtualScrollPosition.toLocaleString(),
            virtualOffset: state.virtualOffset,
          });

          // Get actual total from the most recent API response if available
          let totalItems = state.items.length; // Fallback to current items

          // Try to get total from state.itemCount (set from API meta.total)
          if (
            state.itemCount &&
            typeof state.itemCount === "number" &&
            state.itemCount > 0
          ) {
            totalItems = state.itemCount;
            console.log(
              `📈 [LoadPage] Using API total from state: ${totalItems.toLocaleString()} items`
            );
          } else if (
            result.meta?.total &&
            typeof result.meta.total === "number"
          ) {
            totalItems = result.meta.total;
            console.log(
              `📈 [LoadPage] Using API total from response: ${totalItems.toLocaleString()} items`
            );
          } else {
            // Conservative estimate based on current page
            totalItems = Math.max(
              itemsBeforeThisPage + state.items.length,
              pageNumber * pageSize * 2 // Conservative fallback
            );
            console.log(
              `📈 [LoadPage] Using estimated total: ${totalItems.toLocaleString()} items`
            );
          }

          const totalHeight = totalItems * itemHeight;

          console.log(`📏 [LoadPage] Total height calculation:`, {
            totalItems: totalItems.toLocaleString(),
            itemHeight,
            totalHeight: totalHeight.toLocaleString(),
            targetScrollPosition: virtualScrollPosition.toLocaleString(),
          });

          // Update the spacer to reflect the total height
          updateSpacerHeight(elements, totalHeight);

          // Mark height as calculated
          state.totalHeight = totalHeight;
          state.totalHeightDirty = false;

          // CRITICAL: When jumping to a page without preserving previous pages,
          // position user at the BEGINNING of the loaded page, not the virtual position
          // This shows the start of page 2, not the end of page 2
          const actualScrollPosition = 0; // Always start at the beginning of the loaded page
          container.scrollTop = actualScrollPosition;
          state.scrollTop = actualScrollPosition;

          console.log(`📍 [LoadPage] Setting scroll position:`, {
            containerScrollTop: container.scrollTop,
            stateScrollTop: state.scrollTop,
            containerHeight: state.containerHeight,
            actualPosition: actualScrollPosition,
            virtualPosition: virtualScrollPosition.toLocaleString(),
            scrollFraction: (
              (actualScrollPosition + state.containerHeight) /
              (state.items.length * itemHeight)
            ).toFixed(4),
          });

          // Calculate visible range based on the ACTUAL scroll position (0)
          // Since we're at the top of the loaded page, start from the beginning
          const visibleCount = Math.ceil(state.containerHeight / itemHeight);
          const localStartIndex = 0; // Always start from beginning of loaded page
          const localEndIndex = Math.min(state.items.length, visibleCount + 5); // Add buffer

          state.visibleRange = {
            start: localStartIndex,
            end: localEndIndex,
          };

          console.log(`👁️ [LoadPage] Visible range calculation:`, {
            actualScrollPosition,
            virtualScrollPosition: virtualScrollPosition.toLocaleString(),
            localStartIndex,
            localEndIndex,
            itemsLength: state.items.length,
            pageNumber,
          });

          // Ensure renderer's cached range is reset
          renderer.resetVisibleRange();

          // EXPLICITLY call updateVisibleItems to render the items
          // This bypasses the justJumpedToPage check
          // Temporarily allow updates
          const wasJumpedToPage = justJumpedToPage;
          justJumpedToPage = false;

          updateVisibleItems(actualScrollPosition); // Use the actual scroll position (0)

          // Restore the flag
          justJumpedToPage = wasJumpedToPage;

          // Prevent auto-loading immediately after page jump
          if (pageJumpTimeout) {
            clearTimeout(pageJumpTimeout);
          }

          // Reset the page jump flag after a delay to allow adjacent page loading
          pageJumpTimeout = window.setTimeout(() => {
            console.log(
              `⏰ [PageJump] Resetting page jump flag for page ${pageNumber}`
            );
            justJumpedToPage = false;

            // CRITICAL: Only reset virtual offset for page 1
            // For other pages, keep the virtual offset to maintain positioning
            if (pageNumber === 1) {
              console.log(
                `🔄 [PageJump] Resetting virtual offset to 0 for page 1`
              );
              state.virtualOffset = 0;
            } else {
              console.log(
                `🔄 [PageJump] Keeping virtual offset ${state.virtualOffset} for page ${pageNumber}`
              );
            }

            pageJumpTimeout = null;
          }, 1000); // 1 second delay
        };

        measureContainer();
      });

      // Preload adjacent pages after a longer delay to avoid interfering with navigation
      setTimeout(async () => {
        // CRITICAL: Only preload if user has been idle on this page for a while
        // This prevents visual glitches during rapid navigation
        console.log(
          `🔄 [LoadPage] Considering adjacent page preloading for page ${pageNumber}`
        );

        // Check if user has navigated away from this page
        if (state.page !== pageNumber) {
          console.log(
            `🚫 [LoadPage] Preload cancelled: user navigated to page ${state.page}`
          );
          return;
        }

        if (
          !state.mounted ||
          state.loading ||
          isPageJumpLoad ||
          justJumpedToPage
        ) {
          console.log(
            `🚫 [LoadPage] Preload cancelled: mounted=${state.mounted}, loading=${state.loading}, pageJumpInProgress=${isPageJumpLoad}, recentPageJump=${justJumpedToPage}`
          );
          return;
        }

        // Additional check: Don't preload if we already have adjacent pages in memory
        const pageSize = validatedConfig.pageSize || 20;
        const currentPageStartIndex = (pageNumber - 1) * pageSize;
        const currentPageEndIndex = currentPageStartIndex + pageSize - 1;

        // Check if we already have enough context around current page
        if (state.items.length > pageSize * 2) {
          console.log(
            `🚫 [LoadPage] Preload skipped: already have ${state.items.length} items in memory`
          );
          return;
        }

        // Temporarily disable auto-loading to prevent interference during preload
        const originalJustJumpedFlag = justJumpedToPage;
        justJumpedToPage = true;

        // Store current state to restore after preloading
        const originalPageNumber = pageNumber;
        const originalItems = [...state.items];
        const originalItemsLength = state.items.length;

        console.log(`📦 [LoadPage] Preload starting:`, {
          targetPage: originalPageNumber,
          currentItems: originalItemsLength,
          hasNext: state.hasNext,
          canLoadPrev: originalPageNumber > 1,
        });

        try {
          // Load both adjacent pages in parallel for better UX
          const preloadPromises: Promise<any>[] = [];

          // Preload previous page (page 999 if we're on 1000)
          if (originalPageNumber > 1) {
            const prevPageParams = {
              ...loadParams,
              page: originalPageNumber - 1,
            };
            console.log(
              `⬅️ [LoadPage] Preloading previous page ${originalPageNumber - 1}`
            );
            preloadPromises.push(
              adapter.read(prevPageParams).then((response) => ({
                type: "previous",
                page: originalPageNumber - 1,
                items: response.items?.map(validatedConfig.transform!) || [],
                meta: response.meta,
              }))
            );
          }

          // Preload next page (page 1001 if we're on 1000)
          if (state.hasNext) {
            const nextPageParams = {
              ...loadParams,
              page: originalPageNumber + 1,
            };
            console.log(
              `➡️ [LoadPage] Preloading next page ${originalPageNumber + 1}`
            );
            preloadPromises.push(
              adapter.read(nextPageParams).then((response) => ({
                type: "next",
                page: originalPageNumber + 1,
                items: response.items?.map(validatedConfig.transform!) || [],
                meta: response.meta,
              }))
            );
          }

          // Wait for all preload requests to complete
          const preloadResults = await Promise.allSettled(preloadPromises);

          let prependedCount = 0;
          let appendedCount = 0;
          let newItems = [...originalItems];

          // Process results
          preloadResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              const data = result.value;

              // Skip if preload was aborted (empty items array)
              if (!data || !data.items || data.items.length === 0) {
                console.log(
                  `🚫 [LoadPage] Preload ${
                    data?.type || "unknown"
                  } page skipped (aborted or empty)`
                );
                return;
              }

              console.log(
                `✅ [LoadPage] Preloaded ${data.type} page ${data.page}: ${data.items.length} items`
              );

              if (data.type === "previous" && data.items.length > 0) {
                // Prepend previous page items
                newItems = [...data.items, ...newItems];
                prependedCount = data.items.length;
              } else if (data.type === "next" && data.items.length > 0) {
                // Append next page items
                newItems = [...newItems, ...data.items];
                appendedCount = data.items.length;

                // Update hasNext based on next page response
                state.hasNext = data.meta?.hasNext ?? false;
              }
            } else {
              // Don't log errors for aborted requests (common during page navigation)
              const errorMessage =
                result.reason?.message || String(result.reason);
              if (
                errorMessage.includes("AbortError") ||
                errorMessage.includes("aborted")
              ) {
                console.log(
                  `🚫 [LoadPage] Preload aborted (page navigation in progress)`
                );
              } else {
                console.warn(`❌ [LoadPage] Preload failed:`, result.reason);
              }
            }
          });

          // Update the state with preloaded items
          if (prependedCount > 0 || appendedCount > 0) {
            state.items = newItems;

            // Update collection
            await itemsCollection.clear();
            await itemsCollection.add(state.items);

            console.log(`📦 [LoadPage] Preload complete:`, {
              originalItems: originalItemsLength,
              prependedItems: prependedCount,
              appendedItems: appendedCount,
              totalItems: state.items.length,
              targetPage: originalPageNumber,
            });

            // Adjust scroll position if we prepended items
            if (prependedCount > 0) {
              const itemHeight = validatedConfig.itemHeight || 48;
              const addedHeight = prependedCount * itemHeight;

              // Maintain current visual position by adjusting scroll
              const newScrollTop = container.scrollTop + addedHeight;
              container.scrollTop = newScrollTop;
              state.scrollTop = newScrollTop;

              console.log(
                `📍 [LoadPage] Adjusted scroll position by ${addedHeight}px for prepended items`
              );
            }

            // Update total height
            state.totalHeightDirty = true;
            const totalHeight = itemMeasurement.calculateTotalHeight(
              state.items
            );
            Object.assign(state, updateTotalHeight(state, totalHeight));
            updateSpacerHeight(elements, totalHeight);
          }
        } catch (error) {
          console.error(`🚨 [LoadPage] Preload error:`, error);
        } finally {
          // Restore auto-loading after a short delay
          setTimeout(() => {
            justJumpedToPage = originalJustJumpedFlag;
            console.log(`🔓 [LoadPage] Auto-loading re-enabled after preload`);
          }, 500);

          // Ensure we're still on the correct page
          if (state.page !== originalPageNumber) {
            console.warn(
              `🔧 [LoadPage] Fixing page state after preload: ${state.page} → ${originalPageNumber}`
            );
            state.page = originalPageNumber;
          }
        }

        console.log(
          `✅ [LoadPage] Starting conservative preload for page ${pageNumber} after user idle period`
        );
      }, 2000); // Wait 2 seconds to ensure user is settled on this page
    } else {
      // SIMPLIFIED: For preservePrevious, always use simple collection positioning
      console.log(
        `📍 [LoadPage] PreservePrevious page jump - using simple collection positioning`
      );

      requestAnimationFrame(() => {
        const pageSize = validatedConfig.pageSize || 20;
        const itemHeight = validatedConfig.itemHeight || 48;

        // Update total height for preserved items only
        const preservedItemsHeight = state.items.length * itemHeight;
        state.totalHeight = preservedItemsHeight;
        state.totalHeightDirty = false;
        updateSpacerHeight(elements, preservedItemsHeight);

        // Find the target page items in the collection by ID
        const targetPageStartId = (pageNumber - 1) * pageSize + 1;
        let targetPageStartIndex = -1;

        for (let i = 0; i < state.items.length; i++) {
          if (parseInt(state.items[i]?.id) === targetPageStartId) {
            targetPageStartIndex = i;
            break;
          }
        }

        // Calculate scroll position to show target page
        const scrollPosition =
          targetPageStartIndex >= 0 ? targetPageStartIndex * itemHeight : 0;

        container.scrollTop = scrollPosition;
        state.scrollTop = scrollPosition;

        console.log(`📍 [LoadPage] Simple preservePrevious positioning:`, {
          pageNumber,
          targetPageStartId,
          targetPageStartIndex,
          scrollPosition,
          totalItems: state.items.length,
          totalHeight: preservedItemsHeight,
        });

        // Update items with simple logic
        const wasJumpedToPage = justJumpedToPage;
        justJumpedToPage = false;
        updateVisibleItems(scrollPosition);
        justJumpedToPage = wasJumpedToPage;
      });
    }

    // Clear the flag after DOM operations complete
    pageJumpTimeout = window.setTimeout(() => {
      justJumpedToPage = false;
      pageJumpTimeout = null;

      // CRITICAL FALLBACK: Ensure items are rendered if they weren't already
      // This fixes the issue where repeated navigation to same page shows empty list
      console.log("🔄 [LoadPage] Fallback check: ensuring items are rendered", {
        stateItemsLength: state.items.length,
        visibleItemsLength: state.visibleItems.length,
        domElementsCount: elements.content?.children.length || 0,
        currentPage: pageNumber,
      });

      if (state.items.length > 0 && state.visibleItems.length === 0) {
        console.warn(
          `⚠️ [LoadPage] Items loaded but not visible on page ${pageNumber} - forcing render`
        );

        // Force a complete re-render
        state.visibleRange = { start: -1, end: -1 };
        renderer.resetVisibleRange();

        // Ensure container scroll position is correct
        if (pageNumber === 1) {
          container.scrollTop = 0;
          state.scrollTop = 0;
          state.virtualOffset = 0; // Ensure virtual offset is 0 for page 1
        }

        // Force update visible items with correct scroll position
        updateVisibleItems(state.scrollTop);

        // If still no visible items, something is wrong - try one more time with more aggressive approach
        setTimeout(() => {
          if (state.items.length > 0 && state.visibleItems.length === 0) {
            console.error(
              `🚨 [LoadPage] CRITICAL: Page ${pageNumber} items still not rendering - final aggressive attempt`
            );

            // Most aggressive approach - clear everything and start fresh
            state.visibleRange = { start: -1, end: -1 };
            state.totalHeightDirty = true;

            // Force container height recalculation
            state.containerHeight = container.clientHeight || 400; // Fallback height

            // Try multiple scroll positions
            updateVisibleItems(0);
            requestAnimationFrame(() => {
              updateVisibleItems(state.scrollTop);
            });
          }
        }, 200);
      } else if (
        state.items.length > 0 &&
        (elements.content?.children.length || 0) === 0
      ) {
        // NEW: Handle case where items exist and visible items are calculated, but no DOM elements
        console.warn(
          `⚠️ [LoadPage] Items exist but no DOM elements on page ${pageNumber} - forcing DOM render`
        );

        // This is a DOM rendering issue, not a visibility calculation issue
        state.visibleRange = { start: -1, end: -1 };
        renderer.resetVisibleRange();

        // Force immediate render with current scroll position
        updateVisibleItems(state.scrollTop);

        // Double check DOM creation
        setTimeout(() => {
          const domCount = elements.content?.children.length || 0;
          if (domCount === 0 && state.items.length > 0) {
            console.error(
              `🚨 [LoadPage] CRITICAL: Still no DOM elements created for page ${pageNumber} - clearing and rerendering`
            );

            // Clear everything and force from scratch
            if (elements.content) {
              elements.content.innerHTML = "";
            }

            // Reset all state
            state.visibleRange = { start: -1, end: -1 };
            state.totalHeightDirty = true;
            renderer.resetVisibleRange();

            // Force render from top
            updateVisibleItems(0);
          }
        }, 100);
      }
    }, 600); // Slightly longer timeout to account for complex rendering

    // Emit page change event for navigation
    emitPageChange(PAGE_EVENTS.PAGE_CHANGE, {
      page: pageNumber,
      previousPage: state.page !== pageNumber ? state.page : undefined,
      scrollPosition: container.scrollTop,
      trigger: "navigation",
    });

    // Update last emitted page
    lastEmittedPage = pageNumber;

    // FINAL VERIFICATION: Ensure page state is correct
    if (state.page !== pageNumber) {
      console.error(
        `🚨 [LoadPage] CRITICAL: Page state corrupted! Expected ${pageNumber}, got ${state.page} - fixing`
      );
      state.page = pageNumber;
    }

    console.log(`✅ [LoadPage] Completed successfully for page ${pageNumber}`, {
      finalStatePage: state.page,
      requestedPage: pageNumber,
      itemsLength: result.items.length,
    });

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
      const itemHeight = validatedConfig.itemHeight || 48; // Default item height
      const addedHeight = items.length * itemHeight;

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
      // Initial load for API data
      loadItems()
        .then(() => {
          requestAnimationFrame(() => {
            updateVisibleItems(state.scrollTop);
          });
        })
        .catch((err) => {
          console.error("Error loading items:", err);
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
      // Clear any pending page jump timeout
      if (pageJumpTimeout !== null) {
        clearTimeout(pageJumpTimeout);
        pageJumpTimeout = null;
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

      const result = await loadPage(nextPage, { preservePrevious: true });

      console.log(`📦 [ScrollNext] LoadPage result:`, {
        itemsLength: result.items.length,
        firstItemId: result.items[0]?.id,
        lastItemId: result.items[result.items.length - 1]?.id,
      });

      // Calculate scroll position for the page (at the top of the page)
      const scrollToPosition = (nextPage - 1) * pageSize * itemHeight;

      container.scrollTop = scrollToPosition;
      state.scrollTop = scrollToPosition;
      updateVisibleItems(scrollToPosition);

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
    const itemHeight = validatedConfig.itemHeight || 48;

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

    const result = await loadPage(previousPage, { preservePrevious: true });

    console.log(`📦 [ScrollPrevious] LoadPage result:`, {
      itemsLength: result.items.length,
      firstItemId: result.items[0]?.id,
      lastItemId: result.items[result.items.length - 1]?.id,
      newStatePage: state.page,
    });

    // Calculate scroll position for the page (at the top of the page)
    const scrollToPosition = (previousPage - 1) * pageSize * itemHeight;

    container.scrollTop = scrollToPosition;
    state.scrollTop = scrollToPosition;
    updateVisibleItems(scrollToPosition);

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
