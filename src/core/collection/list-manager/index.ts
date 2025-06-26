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
  LoadParams,
} from "./types";
import { createPageEventManager } from "./events";
import { createPaginationManager } from "./pagination";
import { createScrollingManager } from "./scrolling";
import { createRenderingManager } from "./rendering";
import {
  createDataLoadingManager,
  type DataLoadingDependencies,
} from "./data-loading";
import {
  createVisibilityManager,
  type VisibilityDependencies,
} from "./visibility";
import {
  createLifecycleManager,
  type LifecycleDependencies,
} from "./lifecycle";
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
import {
  RENDERING,
  PAGINATION,
  BOUNDARIES,
  SCROLL,
  COLLECTION,
  TIMING,
  DEFAULTS,
} from "./constants";

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
  // NOTE: No transform function needed - items are already transformed in loadItems()
  const itemsCollection = createCollection({
    initialCapacity: useStatic
      ? initialItems.length
      : COLLECTION.DEFAULT_INITIAL_CAPACITY, // Optimize initial capacity
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

  // Initialize page event manager
  const pageEventManager = createPageEventManager(validatedConfig);
  const {
    onPageChange,
    emitPageChange,
    calculateCurrentPage,
    checkPageChange,
  } = pageEventManager;

  // Initialize rendering manager
  const renderingManager = createRenderingManager({
    config: validatedConfig,
    elements,
  });

  // Initialize scrolling manager (with minimal dependencies for now)
  const scrollingManager = createScrollingManager({
    state,
    config: validatedConfig,
    container,
  });

  // Initialize data loading manager
  const dataLoadingManager = createDataLoadingManager({
    state,
    config: validatedConfig,
    elements,
    collection,
    adapter,
    itemsCollection,
    getPaginationFlags: () => ({ isPageJumpLoad }),
    setPaginationFlags: (flags) => {
      isPageJumpLoad = flags.isPageJumpLoad;
    },
  });

  // Initialize visibility manager (forward declaration - will be defined after functions)
  let visibilityManager: ReturnType<typeof createVisibilityManager>;

  // Forward declarations for functions used by managers
  let updateVisibleItemsImpl: (
    scrollTop?: number,
    isPageJump?: boolean
  ) => void;
  let checkLoadMoreImpl: (scrollTop: number) => void;

  // Initialize lifecycle manager (forward declaration - will be defined after functions)
  let lifecycleManager: ReturnType<typeof createLifecycleManager>;

  // Helper functions for lifecycle manager
  const getPaginationFlags = () => ({ justJumpedToPage, isPreloadingPages });
  const getTimeoutFlags = () => ({ pageJumpTimeout, scrollStopTimeout });
  const clearTimeouts = () => {
    if (pageJumpTimeout !== null) {
      clearTimeout(pageJumpTimeout);
      pageJumpTimeout = null;
    }
    if (scrollStopTimeout !== null) {
      clearTimeout(scrollStopTimeout);
      scrollStopTimeout = null;
    }
  };

  /**
   * Load items with cursor pagination or from static data
   * @param {LoadParams} params - Query parameters
   * @returns {Promise<Object>} Response with items and pagination metadata
   */
  const loadItems = dataLoadingManager.loadItems;

  /**
   * Schedule a page load when scrolling stops (debounced)
   * @param {number} targetPage - Page to load when scrolling stops
   */
  const scheduleScrollStopPageLoad = (targetPage: number): void => {
    // Clear any existing timeout
    if (scrollStopTimeout !== null) {
      clearTimeout(scrollStopTimeout);
    }

    // Load page immediately - no need to wait for scroll stop
    console.log(`⏰ [ScrollImmediate] Loading page ${targetPage} immediately`);

    // Use the existing loadPage functionality which works perfectly
    loadPage(targetPage);
    scrollStopTimeout = null;
  };

  /**
   * Pre-bound update visible items function to avoid recreation
   * @param {number} scrollTop Current scroll position
   */
  const updateVisibleItems = (
    scrollTop = state.scrollTop,
    isPageJump = false
  ): void => {
    updateVisibleItemsImpl?.(scrollTop, isPageJump);
  };

  /**
   * Check if we need to load more data based on scroll position
   * For sparse page data, we use page boundary detection instead of percentage thresholds
   * @param {number} scrollTop - Current scroll position
   */
  const checkLoadMore = (scrollTop: number): void => {
    checkLoadMoreImpl?.(scrollTop);
  };

  /**
   * Check if user has scrolled beyond current page boundaries and load adjacent pages
   * This replaces percentage-based thresholds for sparse page data
   * @param {number} scrollTop - Current scroll position
   */
  const checkPageBoundaries = (scrollTop: number): void => {
    if (!state.page || state.items.length === 0) return;

    // CRITICAL FIX: Don't run boundary detection immediately after page jumps
    // This prevents loading adjacent pages when we just jumped to a specific page
    if (justJumpedToPage) {
      console.log(
        `🚫 [PageBoundary] Skipping boundary detection - just jumped to page ${state.page}`
      );
      return;
    }

    // CRITICAL FIX: Prevent concurrent boundary loads to avoid infinite loops
    if (state.loading) {
      console.log(
        `🚫 [PageBoundary] Skipping boundary detection - already loading`
      );
      return;
    }

    const itemHeight = validatedConfig.itemHeight || DEFAULTS.itemHeight;
    const pageSize = validatedConfig.pageSize || DEFAULTS.pageSize;

    // Calculate current page boundaries in terms of virtual positions
    const currentPageStart = (state.page - 1) * pageSize + 1;
    const currentPageEnd = state.page * pageSize;

    // Use natural positioning - no complex coordinate conversions needed
    const currentPageStartPx = (currentPageStart - 1) * itemHeight;
    const currentPageEndPx = currentPageEnd * itemHeight;

    // Define boundary thresholds (load when within N item heights of boundary)
    const boundaryThreshold =
      itemHeight * BOUNDARIES.BOUNDARY_THRESHOLD_MULTIPLIER;
    const viewportBottom = scrollTop + state.containerHeight;

    // Removed excessive logging

    // CRITICAL FIX: First check if we have data for the current page
    // If not, load it before checking adjacent pages
    const hasCurrentPageData = state.items.some((item) => {
      const itemId = parseInt(item?.id);
      return itemId >= currentPageStart && itemId <= currentPageEnd;
    });

    // Removed excessive logging

    if (!hasCurrentPageData) {
      console.log(
        `📥 [PageBoundary] Loading current page ${state.page} (missing data for current page)`
      );
      loadCurrentPageFromBoundary(state.page);
      return; // Don't check adjacent pages until current page is loaded
    }

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
   * Load current page from boundary detection (when current page data is missing)
   * @param {number} pageNumber - Page number to load
   */
  const loadCurrentPageFromBoundary = async (
    pageNumber: number
  ): Promise<void> => {
    if (state.loading) return;

    console.log(
      `🔄 [BoundaryLoad] Loading current page ${pageNumber} from boundary detection (missing data)`
    );

    const loadParams = createLoadParams(state, "page");
    loadParams.page = pageNumber;

    const perPageParam =
      validatedConfig.pagination?.perPageParamName || "per_page";
    loadParams[perPageParam] = validatedConfig.pageSize || 20;

    try {
      const result = await loadItems(loadParams);
      console.log(`✅ [BoundaryLoad] Current page ${pageNumber} loaded:`, {
        newItemsCount: result.items.length,
        totalItemsNow: state.items.length,
      });
    } catch (error) {
      console.error(
        `❌ [BoundaryLoad] Failed to load current page ${pageNumber}:`,
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
    const threshold = PAGINATION.LOAD_PREVIOUS_THRESHOLD; // Load when within threshold px of top
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
  const refresh = dataLoadingManager.refresh;

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

      // REMOVED: Don't force scroll position - respect user's scrollbar position
      // Let the user scroll to exactly where they want, even on page 1

      // Force immediate render
      requestAnimationFrame(() => {
        updateVisibleItems(state.scrollTop);

        // Immediate double-check - no delay needed
        if (state.visibleItems.length === 0) {
          console.warn(
            `⚠️ [LoadPage] Force-rendering page ${pageNumber} items`
          );
          updateVisibleItems(state.scrollTop); // Use actual scroll position, not 0
        }
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

      // Data is loaded - no need to wait for processing
      console.log(`⏳ [LoadPage] Data loaded - proceeding immediately...`);
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

    // RESPECT SCROLLBAR: Don't calculate artificial scroll positions
    console.log(
      `📍 [LoadPage] Loading page ${pageNumber} at user's scroll position`
    );

    // RESPECT SCROLLBAR: Don't override user's scroll position
    // Items will render at their correct virtual positions based on current scroll
    console.log(
      `📍 [LoadPage] Respecting user scroll position: ${container.scrollTop}px`
    );

    // Force a complete re-render by clearing the visible range first
    state.visibleRange = { start: -1, end: -1 };
    state.containerHeight = container.clientHeight;

    // CRITICAL FIX: Only set total height in loadPage if not already set from API
    if (!state.itemCount) {
      // Fallback calculation if no API total available
      const fallbackTotal = PAGINATION.FALLBACK_TOTAL_COUNT; // Default fallback
      const itemHeight = validatedConfig.itemHeight || 84; // Get item height for calculation
      state.totalHeight = fallbackTotal * itemHeight;

      console.log(`📐 [LoadPage] Fallback total height calculation:`, {
        fallbackTotal: fallbackTotal.toLocaleString(),
        localCollectionSize: state.items.length,
        itemHeight: itemHeight,
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
      updateVisibleItems(container.scrollTop, true); // Use actual scrollbar position
      justJumpedToPage = wasJumpedToPage;

      // RESPECT USER'S SCROLL POSITION: Only snap to page start for explicit navigation
      // Don't interfere with natural scrollbar behavior
      // The scroll position should remain exactly where the user placed it

      // Reset page jump flag immediately after rendering
      console.log(`🔄 [LoadPage] Resetting justJumpedToPage flag immediately`);
      justJumpedToPage = false;
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

      // REMOVED: Don't adjust scroll position artificially
      // Respect the user's exact scrollbar position
      // The natural virtual positioning will handle item placement correctly

      // Update visible items using current scroll position
      updateVisibleItems(state.scrollTop);
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
    const itemHeight = validatedConfig.itemHeight || DEFAULTS.itemHeight;

    // Calculate proper virtual positions based on item IDs
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      if (items[i]) {
        const item = items[i];
        const itemId = parseInt(item.id);
        const naturalOffset = (itemId - 1) * itemHeight;

        positions.push({
          index: i,
          item: item,
          offset: naturalOffset,
        });
      }
    }

    console.log(`🎯 [VirtualPositioning] Natural positioning:`, {
      visibleRangeStart: visibleRange.start,
      visibleRangeEnd: visibleRange.end,
      firstItemId: items[visibleRange.start]?.id,
      lastItemId: items[visibleRange.end - 1]?.id,
      firstItemOffset: positions[0]?.offset,
      lastItemOffset: positions[positions.length - 1]?.offset,
      itemCount: positions.length,
    });

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

    // Removed excessive logging
  };

  // Set up managers now that all functions are defined
  visibilityManager = createVisibilityManager({
    state,
    config: validatedConfig,
    elements,
    container,
    itemMeasurement,
    renderer,
    checkPageChange,
    paginationManager: {
      scheduleScrollStopPageLoad,
      checkPageBoundaries,
      loadNext,
      getPaginationFlags: () => ({ justJumpedToPage, isPreloadingPages }),
    },
    renderingManager: {
      renderItemsWithVirtualPositions,
    },
  });

  updateVisibleItemsImpl = visibilityManager.updateVisibleItems;
  checkLoadMoreImpl = visibilityManager.checkLoadMore;

  lifecycleManager = createLifecycleManager({
    state,
    config: validatedConfig,
    elements,
    container,
    updateVisibleItems,
    checkLoadMore,
    loadNext,
    loadPage,
    itemsCollection,
    initialItems,
    cleanupFunctions,
    createScrollTracker,
    COLLECTION_EVENTS,
    getPaginationFlags,
    getTimeoutFlags,
    clearTimeouts,
  });

  // Now that lifecycle manager is set up, replace the initialize function
  const initialize = (): (() => void) => {
    return lifecycleManager.initialize();
  };

  // Initialize immediately
  const actualCleanup = initialize();

  // Return public API
  return {
    // Core data operations
    loadPage,
    loadNext,
    refresh,
    updateVisibleItems,

    // Page navigation
    getCurrentPage: () => {
      if (state.paginationStrategy === "page") {
        return state.page || 1;
      }
      return (
        calculateCurrentPage(state.scrollTop || 0, state.paginationStrategy) ||
        1
      );
    },

    // Event handling
    onPageChange: (callback: (page: number) => void) => {
      // Simple implementation - store callback and call it when page changes
      let currentPageTracked = state.page || 1;
      const checkPageChange = () => {
        const newPage = state.page || 1;
        if (newPage !== currentPageTracked) {
          currentPageTracked = newPage;
          callback(newPage);
        }
      };

      // Check periodically (simple implementation)
      const interval = setInterval(
        checkPageChange,
        TIMING.PAGE_CHANGE_INTERVAL
      );
      const cleanup = () => clearInterval(interval);
      cleanupFunctions.push(cleanup);
      return cleanup;
    },

    // State access
    getState: () => ({ ...state }),
    getAllItems: () => state.items,
    getVisibleItems: () => state.visibleItems,
    isLoading: () => state.loading,
    hasNextPage: () => state.hasNext,

    // Lifecycle
    destroy: () => {
      actualCleanup();
    },
  } as any;
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
  const throttleMs = SCROLL.LOAD_THROTTLE_MS; // Minimum time between load operations

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
