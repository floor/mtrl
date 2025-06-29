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
import { createPaginationManager } from "./managers/pagination";
import { createScrollingManager } from "./scroll/programmatic";
import { createRenderingManager } from "./render/virtual";
import {
  createDataLoadingManager,
  type DataLoadingDependencies,
} from "./data/loading";
import {
  createViewportManager,
  type ViewportDependencies,
} from "./managers/viewport";
import {
  createLifecycleManager,
  type LifecycleDependencies,
} from "./managers/lifecycle";
import { validateConfig, determineApiMode, getStaticItems } from "./config";
import {
  createDomElements,
  updateSpacerHeight,
  cleanupDomElements,
} from "./dom/elements";
import { createItemMeasurement } from "./dom/measurement";
import { createRenderer } from "./render/items";
import { createScrollTracker } from "./scroll/tracker";
import { createRecyclingPool } from "./utils/recycling";
import {
  calculateVisibleRange,
  isLoadThresholdReached,
} from "./utils/viewport";
import {
  createInitialState,
  updateStateAfterLoad,
  updateVisibleItems as updateStateVisibleItems,
  updateTotalHeight,
  updateLoadingState,
  resetState,
  createLoadParams,
} from "./utils/state";
import {
  RENDERING,
  PAGINATION,
  BOUNDARIES,
  SCROLL,
  COLLECTION,
  TIMING,
  DEFAULTS,
  PLACEHOLDER,
} from "./constants";
import {
  installPlaceholderHook,
  placeholderRenderHook,
} from "./data/generator";

// Import new manager modules
import { createTimeoutManager } from "./managers/timeout";
import { createBoundaryManager } from "./managers/boundary";
import { createScrollJumpManager } from "./managers/scroll-jump";

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

  // Install placeholder render hook for automatic styling
  installPlaceholderHook(renderer.setRenderHook);

  // Initialize collection for data management
  const itemsCollection = createCollection({
    initialCapacity: useStatic
      ? initialItems.length
      : COLLECTION.DEFAULT_INITIAL_CAPACITY,
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
        cache: true,
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

  // Create timeout manager to centralize timeout and state flag management
  const timeoutManager = createTimeoutManager();

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

  // Initialize scrolling manager (will be updated later with loadPage)
  let scrollingManager = createScrollingManager({
    state,
    config: validatedConfig,
    container,
  });

  // Initialize data loading manager
  let dataLoadingManager = createDataLoadingManager({
    state,
    config: validatedConfig,
    elements,
    collection,
    adapter,
    itemsCollection,
    getPaginationFlags: () => timeoutManager.getState(),
    setPaginationFlags: (flags) => timeoutManager.updateState(flags),
  });

  // Initialize viewport manager (forward declaration)
  let viewportManager: ReturnType<typeof createViewportManager>;

  // Forward declarations for functions used by managers
  let updateVisibleItemsImpl: (
    scrollTop?: number,
    isPageJump?: boolean
  ) => void;
  let checkLoadMoreImpl: (scrollTop: number) => void;

  // Initialize lifecycle manager (forward declaration)
  let lifecycleManager: ReturnType<typeof createLifecycleManager>;

  /**
   * Load items with cursor pagination or from static data
   */
  let loadItems = dataLoadingManager.loadItems;

  /**
   * Pre-bound update visible items function to avoid recreation
   */
  const updateVisibleItems = (
    scrollTop = state.scrollTop,
    isPageJump = false
  ): void => {
    updateVisibleItemsImpl?.(scrollTop, isPageJump);
  };

  /**
   * Check if we need to load more data based on scroll position
   */
  const checkLoadMore = (scrollTop: number): void => {
    checkLoadMoreImpl?.(scrollTop);
  };

  /**
   * Loads more items using appropriate pagination strategy
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
        const perPageParam =
          validatedConfig.pagination?.perPageParamName || "per_page";
        loadParams[perPageParam] = validatedConfig.pageSize || 20;
      } else {
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
   */
  const refresh = dataLoadingManager.refresh;

  /**
   * Loads a specific page (only works with page-based pagination)
   */
  const loadPage = async (
    pageNumber: number,
    options: { setScrollPosition?: boolean; replaceCollection?: boolean } = {}
  ): Promise<{ hasNext: boolean; items: any[] }> => {
    const { setScrollPosition = true, replaceCollection = true } = options;

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

    // For background loading (replaceCollection: false), handle differently
    if (!replaceCollection) {
      // Check if we already have this page's data
      const pageSize = validatedConfig.pageSize || 20;
      const pageStartId = (pageNumber - 1) * pageSize + 1;
      const pageEndId = pageNumber * pageSize;

      const hasPageData = state.items.some((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= pageStartId && itemId <= pageEndId;
      });

      if (hasPageData) {
        // Already have this page, no need to load
        return { hasNext: state.hasNext, items: [] };
      }

      // Load page data without affecting current page state
      const loadParams = createLoadParams(state, paginationStrategy);
      loadParams.page = pageNumber;

      const perPageParam =
        validatedConfig.pagination?.perPageParamName || "per_page";
      loadParams[perPageParam] = validatedConfig.pageSize || 20;

      try {
        const response = await adapter.read(loadParams);
        const items = Array.isArray(response.items)
          ? response.items.map(validatedConfig.transform!)
          : [];

        if (items.length > 0) {
          // Add items to collection without clearing existing items
          await itemsCollection.add(items);

          // Update state items array (sorted by ID to maintain order)
          const allItems = [...state.items, ...items];
          allItems.sort((a, b) => parseInt(a.id) - parseInt(b.id));
          state.items = allItems;

          // Update item count if API provides total
          if (response.meta?.total) {
            state.itemCount = response.meta.total;
          }
        }

        return {
          hasNext: response.meta?.hasNext ?? false,
          items,
        };
      } catch (error) {
        console.error(
          `❌ [BackgroundLoad] Failed to load page ${pageNumber}:`,
          error
        );
        return { hasNext: false, items: [] };
      }
    }

    // Regular loading (replaceCollection: true) - existing logic
    // If we're already on the same page and have items, just ensure they're rendered
    if (state.page === pageNumber && state.items.length > 0) {
      // Force a re-render to ensure items are visible
      state.visibleRange = { start: -1, end: -1 };
      renderer.resetVisibleRange();

      // Force immediate render
      requestAnimationFrame(() => {
        updateVisibleItems(state.scrollTop);

        // Immediate double-check - no delay needed
        if (state.visibleItems.length === 0) {
          console.warn(
            `⚠️ [LoadPage] Force-rendering page ${pageNumber} items`
          );
          updateVisibleItems(state.scrollTop);
        }
      });

      return { hasNext: state.hasNext, items: state.items };
    }

    // Set the page number in state
    state.page = pageNumber;
    state.paginationStrategy = paginationStrategy;

    // Set page jump state using timeout manager
    timeoutManager.setPageJumpState();

    // Don't clear collection - just load the page if not already present
    // Check if we already have the page data
    const pageSize = validatedConfig.pageSize || 20;
    const pageStartId = (pageNumber - 1) * pageSize + 1;
    const pageEndId = pageNumber * pageSize;

    const hasPageData = state.items.some((item) => {
      const itemId = parseInt(item?.id);
      return itemId >= pageStartId && itemId <= pageEndId;
    });

    let result;

    if (!hasPageData) {
      const loadParams = createLoadParams(state, paginationStrategy);
      loadParams.page = pageNumber;

      const perPageParam =
        validatedConfig.pagination?.perPageParamName || "per_page";
      loadParams[perPageParam] = validatedConfig.pageSize || 20;

      result = await loadItems(loadParams);
    } else {
      const pageItems = state.items.filter((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= pageStartId && itemId <= pageEndId;
      });

      result = {
        items: pageItems,
        meta: { total: state.itemCount, hasNext: state.hasNext },
      };
    }

    // Clear item measurement cache to ensure fresh calculations
    if (typeof itemMeasurement.clear === "function") {
      itemMeasurement.clear();
    }

    // Force recalculation of all item offsets with new data
    if (typeof itemMeasurement.calculateOffsets === "function") {
      itemMeasurement.calculateOffsets(state.items);
    }

    // Calculate the natural scroll position for this page
    const itemHeight = validatedConfig.itemHeight || DEFAULTS.itemHeight;
    const naturalScrollPosition = (pageStartId - 1) * itemHeight;

    // Force a complete re-render by clearing the visible range first
    state.visibleRange = { start: -1, end: -1 };
    state.containerHeight = container.clientHeight;

    // Only set total height if not already set from API
    if (!state.itemCount) {
      const fallbackTotal = PAGINATION.FALLBACK_TOTAL_COUNT;
      state.totalHeight = fallbackTotal * itemHeight;
      updateSpacerHeight(elements, state.totalHeight);
      state.totalHeightDirty = false;
    }

    // Reset renderer and render immediately with DOM updates
    renderer.resetVisibleRange();

    requestAnimationFrame(() => {
      // Only set scroll position for explicit user navigation
      let scrollPositionToUse = container.scrollTop;

      if (setScrollPosition && result.items.length > 0) {
        container.scrollTop = naturalScrollPosition;
        state.scrollTop = naturalScrollPosition;
        scrollPositionToUse = naturalScrollPosition;
      }

      // Temporarily allow updates
      const timeoutState = timeoutManager.getState();
      const wasJumpedToPage = timeoutState.justJumpedToPage;
      timeoutManager.updateState({ justJumpedToPage: false });
      updateVisibleItems(scrollPositionToUse, true);
      timeoutManager.updateState({ justJumpedToPage: wasJumpedToPage });

      // Reset page jump flag immediately after rendering
      timeoutManager.updateState({ justJumpedToPage: false });
    });

    return {
      hasNext: state.hasNext,
      items: result.items,
    };
  };

  /**
   * Loads the previous page (only works with page-based pagination)
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

      // Update visible items using current scroll position
      updateVisibleItems(state.scrollTop);
    }

    return {
      hasPrev: previousPage > 1,
      items,
    };
  };

  /**
   * Render items with custom virtual positions
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

      // Position the element using GPU-accelerated transforms
      element.style.position = "absolute";
      element.style.transform = `translateY(${offset}px)`;

      // Apply placeholder render hook
      placeholderRenderHook(item, element);

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
  };

  // Create scroll jump manager for complex scroll operations
  const scrollJumpManager = createScrollJumpManager({
    state,
    config: validatedConfig,
    loadPage,
    timeoutManager: {
      setScrollJumpState: timeoutManager.setScrollJumpState,
      getState: timeoutManager.getState,
      updateState: timeoutManager.updateState,
    },
  });

  // Update scrolling manager with loadPage dependency
  scrollingManager = createScrollingManager({
    state,
    config: validatedConfig,
    container,
    loadPage,
    itemMeasurement,
    collection,
    scrollJumpManager: {
      loadScrollJumpWithBackgroundRanges:
        scrollJumpManager.loadScrollJumpWithBackgroundRanges,
      loadAdditionalRangesInBackground:
        scrollJumpManager.loadAdditionalRangesInBackground,
      loadScrollToIndexWithBackgroundRanges:
        scrollJumpManager.loadScrollToIndexWithBackgroundRanges,
    },
  });

  // Extract functions from scrolling manager
  const { scrollToItem, scrollToIndex, scrollToItemById } = scrollingManager;

  // Set up managers now that all functions are defined
  viewportManager = createViewportManager({
    state,
    config: validatedConfig,
    elements,
    container,
    itemMeasurement,
    renderer,
    checkPageChange,
    paginationManager: {
      scheduleScrollStopPageLoad: scrollJumpManager.scheduleScrollStopPageLoad,
      checkPageBoundaries: () => {}, // Temporary placeholder, will be updated below
      loadNext,
      getPaginationFlags: () => timeoutManager.getState(),
    },
    renderingManager: {
      renderItemsWithVirtualPositions,
    },
  });

  updateVisibleItemsImpl = viewportManager.updateVisibleItems;
  checkLoadMoreImpl = viewportManager.checkLoadMore;

  // Get placeholder replacement function for seamless transitions
  const replacePlaceholdersWithReal =
    viewportManager.replacePlaceholdersWithReal;

  // Debug: Check if the function is properly available
  if (PLACEHOLDER.DEBUG_LOGGING) {
    console.log(
      `🔗 [ListManager] replacePlaceholdersWithReal function available: ${typeof replacePlaceholdersWithReal}`
    );
  }

  // Recreate data loading manager with fake item replacement support
  dataLoadingManager = createDataLoadingManager({
    state,
    config: validatedConfig,
    elements,
    collection,
    adapter,
    itemsCollection,
    getPaginationFlags: () => timeoutManager.getState(),
    setPaginationFlags: (flags) => timeoutManager.updateState(flags),
    replacePlaceholdersWithReal,
  });

  // Update loadItems reference
  loadItems = dataLoadingManager.loadItems;

  // NOW create boundary manager with the updated loadItems that has replacePlaceholdersWithReal
  const boundaryManager = createBoundaryManager({
    state,
    config: validatedConfig,
    loadItems, // This now has the replacePlaceholdersWithReal function
    timeoutManager,
  });

  // Update the viewport manager's pagination manager with the real boundary manager
  viewportManager = createViewportManager({
    state,
    config: validatedConfig,
    elements,
    container,
    itemMeasurement,
    renderer,
    checkPageChange,
    paginationManager: {
      scheduleScrollStopPageLoad: scrollJumpManager.scheduleScrollStopPageLoad,
      checkPageBoundaries: boundaryManager.checkPageBoundaries, // Now properly wired
      loadNext,
      getPaginationFlags: () => timeoutManager.getState(),
    },
    renderingManager: {
      renderItemsWithVirtualPositions,
    },
  });

  // Update the function references again
  updateVisibleItemsImpl = viewportManager.updateVisibleItems;
  checkLoadMoreImpl = viewportManager.checkLoadMore;

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
    createScrollTracker: createScrollTracker,
    COLLECTION_EVENTS,
    getPaginationFlags: () => timeoutManager.getState(),
    getTimeoutFlags: () => timeoutManager.getTimeouts(),
    clearTimeouts: () => timeoutManager.clearAllTimeouts(),
  });

  // Initialize immediately
  const actualCleanup = lifecycleManager.initialize();

  // Add timeout manager cleanup to the main cleanup
  cleanupFunctions.push(() => timeoutManager.cleanup());

  // Return public API
  return {
    // Core data operations
    loadPage,
    loadNext,
    refresh,
    updateVisibleItems,

    // Navigation and scrolling
    scrollToItem,
    scrollToIndex,
    scrollToItemById,

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
      let currentPageTracked = state.page || 1;
      const checkPageChange = () => {
        const newPage = state.page || 1;
        if (newPage !== currentPageTracked) {
          currentPageTracked = newPage;
          callback(newPage);
        }
      };

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
