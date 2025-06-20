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

  // Initialize state
  const state = createInitialState(validatedConfig);
  state.useStatic = useStatic;

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

    // Calculate which page we're currently viewing
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
        (currentStateItemsLength === 0 || isPageJumpLoad)
      ) {
        // If we're loading a specific page and either the collection is empty OR this is a page jump,
        // replace the collection (this handles jumping to any page)
        console.log(
          `🔄 [LoadItems] Page ${params.page}: Replacing collection (${
            isPageJumpLoad ? "page jump" : "empty state"
          })`
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
      if (isPageJumpLoad && state.paginationStrategy === "page") {
        // For page jumps, always replace the state items (don't append)
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
        // Use normal state update logic for regular loads
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
      const totalHeight = itemMeasurement.calculateTotalHeight(state.items);
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
    if (state.loading || !state.hasNext) return;

    const shouldLoadMore = isLoadThresholdReached(
      scrollTop,
      state.containerHeight,
      state.totalHeight,
      validatedConfig.loadThreshold!
    );

    if (shouldLoadMore) {
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

    // For page-based pagination, treat each page as a jump operation for consistency
    if (paginationStrategy === "page") {
      // Mark this as a page jump load to ensure consistent behavior
      isPageJumpLoad = true;

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
    if (
      state.page === pageNumber &&
      state.items.length > 0 &&
      !options.preservePrevious
    ) {
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
      // When preserving previous pages, check if we're jumping to a different page
      const pageSize = validatedConfig.pageSize || 20;
      const currentPage = Math.ceil(state.items.length / pageSize);

      if (currentPage !== pageNumber - 1 && currentPage !== pageNumber) {
        // We're jumping to a non-adjacent page, start fresh

        await itemsCollection.clear();
        state.items = [];
        recyclePool.clear();

        // Clear the content DOM
        if (elements.content) {
          elements.content.innerHTML = "";
        }

        // Reset renderer state to force re-render
        renderer.resetVisibleRange();

        // Reset state but keep the page number we're jumping to
        Object.assign(state, resetState(state, []));
        state.page = pageNumber;
        state.paginationStrategy = paginationStrategy;

        // Don't preserve previous for this load
        options.preservePrevious = false;
      }
      // If it's an adjacent page, let normal loading handle it
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

          // When jumping to a page, we only have that page's items locally (indices 0-19)
          // But we need to simulate being at the correct position in the full dataset
          const localItemHeight = state.items.length * itemHeight;

          // Set total height to represent the full dataset
          // We'll get the actual total from the API meta, but use a reasonable estimate
          const estimatedTotalItems = Math.max(
            itemsBeforeThisPage + state.items.length,
            pageNumber * pageSize * 2 // Conservative estimate
          );
          const totalHeight = estimatedTotalItems * itemHeight;

          // Update the spacer to reflect the estimated total height
          updateSpacerHeight(elements, totalHeight);

          // Mark height as calculated
          state.totalHeight = totalHeight;
          state.totalHeightDirty = false;

          // Set the scroll position to where this page should be
          container.scrollTop = virtualScrollPosition;
          state.scrollTop = virtualScrollPosition;

          // Calculate visible range based on the virtual scroll position
          const visibleCount = Math.ceil(state.containerHeight / itemHeight);
          const startIndex = Math.floor(virtualScrollPosition / itemHeight);
          const endIndex = startIndex + visibleCount + 5; // Add buffer

          // Since our items are at local indices 0-19 but represent virtual indices,
          // we need to map the visible range to our local indices
          const localStartIndex = Math.max(0, startIndex - itemsBeforeThisPage);
          const localEndIndex = Math.min(
            state.items.length,
            endIndex - itemsBeforeThisPage
          );

          state.visibleRange = {
            start: localStartIndex,
            end: localEndIndex,
          };

          // Ensure renderer's cached range is reset
          renderer.resetVisibleRange();

          // EXPLICITLY call updateVisibleItems to render the items
          // This bypasses the justJumpedToPage check
          // Temporarily allow updates
          const wasJumpedToPage = justJumpedToPage;
          justJumpedToPage = false;

          updateVisibleItems(virtualScrollPosition); // Use the correct virtual scroll position

          // Restore the flag
          justJumpedToPage = wasJumpedToPage;

          // Flag will be cleared by the main timeout below
        };

        measureContainer();
      });

      // Preload adjacent pages after a short delay
      setTimeout(async () => {
        // TEMPORARILY DISABLED: Preloading is causing page state corruption
        // Re-enable after basic navigation is working correctly
        console.log(
          `🔄 [LoadPage] Preloading DISABLED to prevent page state corruption`
        );
        return;

        if (!state.mounted || state.loading) return;

        // CRITICAL: Store the current page number before preloading
        // Preloading should NOT change the current page state
        const originalPageNumber = pageNumber;

        console.log(
          `🔄 [LoadPage] Starting preload for page ${originalPageNumber}`,
          {
            currentStatePage: state.page,
            originalPage: originalPageNumber,
          }
        );

        // LOCK the page state during preloading - create a getter/setter trap
        let lockedPageState = originalPageNumber;
        const originalPageDescriptor = Object.getOwnPropertyDescriptor(
          state,
          "page"
        );

        // Temporarily override the page property to prevent corruption
        Object.defineProperty(state, "page", {
          get: () => lockedPageState,
          set: (value) => {
            if (value !== originalPageNumber) {
              console.warn(
                `🚨 [LoadPage] BLOCKED page state change from ${lockedPageState} to ${value} during preload`
              );
              // Don't allow the change
              return;
            }
            lockedPageState = value;
          },
          configurable: true,
        });

        // Set a flag to prevent visual updates during preload
        isPreloadingPages = true;

        // Store current visual state and visible items
        const currentScrollTop = container.scrollTop;
        const currentVisibleRange = { ...state.visibleRange };
        const visibleItemIds = state.items
          .slice(currentVisibleRange.start, currentVisibleRange.end)
          .map((item) => item?.id)
          .filter(Boolean);

        // Track how many items we prepend
        let prependedCount = 0;

        // Preload previous page if it exists
        if (originalPageNumber > 1) {
          try {
            const prevPageParams = {
              ...loadParams,
              page: originalPageNumber - 1,
            };
            const prevResponse = await adapter.read(prevPageParams);

            if (prevResponse.items && prevResponse.items.length > 0) {
              const prevItems = prevResponse.items.map(
                validatedConfig.transform!
              );
              prependedCount = prevItems.length;

              // Prepend previous page items to the beginning
              state.items = [...prevItems, ...state.items];

              // Update collection without triggering visual updates
              await itemsCollection.clear();
              await itemsCollection.add(state.items);
            }
          } catch (error) {
            console.error(`Error preloading previous page:`, error);
          }
        }

        // Preload next page if it exists
        if (state.hasNext) {
          try {
            const nextPageParams = {
              ...loadParams,
              page: originalPageNumber + 1,
            };
            const nextResponse = await adapter.read(nextPageParams);

            if (nextResponse.items && nextResponse.items.length > 0) {
              const nextItems = nextResponse.items.map(
                validatedConfig.transform!
              );

              // Append next page items to the end
              state.items = [...state.items, ...nextItems];

              // Update collection without triggering visual updates
              await itemsCollection.clear();
              await itemsCollection.add(state.items);

              // Update hasNext based on response
              state.hasNext = nextResponse.meta?.hasNext ?? false;
            }
          } catch (error) {
            console.error(`Error preloading next page:`, error);
          }
        }

        // CRITICAL: Restore the original page number after preloading
        // The preloading process should NEVER change which page we're on
        state.page = originalPageNumber;

        // UNLOCK the page state - restore original property descriptor
        if (originalPageDescriptor) {
          Object.defineProperty(state, "page", originalPageDescriptor);
        } else {
          // If no original descriptor, just set it as a normal property
          delete state.page;
          state.page = originalPageNumber;
        }

        console.log(
          `✅ [LoadPage] Preload complete for page ${originalPageNumber}`,
          {
            restoredStatePage: state.page,
            totalItemsAfterPreload: state.items.length,
          }
        );

        // If we prepended items, adjust scroll and visible range
        if (prependedCount > 0) {
          const itemHeight = validatedConfig.itemHeight || 48;
          const addedHeight = prependedCount * itemHeight;

          // Update scroll position
          container.scrollTop = currentScrollTop + addedHeight;
          state.scrollTop = currentScrollTop + addedHeight;

          // Update visible range to account for prepended items
          state.visibleRange.start += prependedCount;
          state.visibleRange.end += prependedCount;
        }

        // Re-enable updates
        isPreloadingPages = false;

        // Update total height
        state.totalHeightDirty = true;
        const totalHeight = itemMeasurement.calculateTotalHeight(state.items);
        Object.assign(state, updateTotalHeight(state, totalHeight));
        updateSpacerHeight(elements, totalHeight);

        // Don't trigger updateVisibleItems - the view should remain stable
      }, 300); // Load adjacent pages after 300ms
    } else {
      // When preserving previous pages, we need to scroll to where the new page starts
      // Calculate the position of the first item of the loaded page
      const pageSize = validatedConfig.pageSize || 20;
      const itemsBeforeThisPage = (pageNumber - 1) * pageSize;
      const itemHeight = validatedConfig.itemHeight || 48;
      const scrollToPosition = itemsBeforeThisPage * itemHeight;

      requestAnimationFrame(() => {
        // Scroll to the beginning of the loaded page
        container.scrollTop = scrollToPosition;
        state.scrollTop = scrollToPosition;

        // EXPLICITLY call updateVisibleItems to render the items
        // Temporarily allow updates
        const wasJumpedToPage = justJumpedToPage;
        justJumpedToPage = false;

        updateVisibleItems(scrollToPosition);

        // Restore the flag
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
        }

        // Force update visible items
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

      // For consistency with direct page navigation, always use loadPage
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

    // CRITICAL: Calculate actual current page from visible items instead of relying on state.page
    // state.page might be corrupted, but the visible items tell us the truth
    const pageSize = validatedConfig.pageSize || 20;
    const visibleItems = state.visibleItems || [];

    let actualCurrentPage = state.page; // Fallback to state.page

    if (visibleItems.length > 0 && visibleItems[0]?.id) {
      // Calculate page from first visible item ID
      const firstVisibleId = parseInt(visibleItems[0].id);
      if (!isNaN(firstVisibleId)) {
        actualCurrentPage = Math.ceil(firstVisibleId / pageSize);
        console.log(
          `🔍 [ScrollPrevious] Calculated actual page from visible items:`,
          {
            firstVisibleId,
            calculatedPage: actualCurrentPage,
            statePage: state.page,
            pageSize,
          }
        );
      }
    }

    console.log(
      `🔄 [ScrollPrevious] Using actual current page: ${actualCurrentPage} (state.page was ${state.page})`
    );

    // Check if we can go back using the ACTUAL current page
    if (state.loading || actualCurrentPage <= 1) {
      console.log(`❌ [ScrollPrevious] Cannot go back:`, {
        loading: state.loading,
        actualCurrentPage,
        canGoBack: actualCurrentPage > 1,
      });
      return { hasPrev: false, items: [] };
    }

    // Only works with page-based pagination
    if (state.paginationStrategy !== "page") {
      return { hasPrev: false, items: [] };
    }

    console.log(
      `🔄 [ScrollPrevious] Starting from page ${actualCurrentPage}, state.items.length: ${state.items.length}`
    );

    const previousPage = actualCurrentPage - 1;
    const itemHeight = validatedConfig.itemHeight || 48;

    console.log(`📊 [ScrollPrevious] Analysis:`, {
      actualCurrentPage,
      previousPage,
      pageSize,
      stateItemsLength: state.items.length,
    });

    // For consistency with scrollNext, always use loadPage
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
