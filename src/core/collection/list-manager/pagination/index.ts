import { Collection } from "../../collection";
import {
  ListManagerState,
  ListManagerConfig,
  ListManagerElements,
  LoadParams,
  PaginationMeta,
} from "../types";
import { createLoadParams } from "../state";
import { updateSpacerHeight } from "../dom-elements";

/**
 * Pagination manager dependencies
 */
export interface PaginationDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  elements: ListManagerElements;
  container: HTMLElement;
  itemsCollection: Collection<any>;
  adapter: any;
  itemMeasurement: any;
  renderer: any;
  loadItems: (
    params: LoadParams
  ) => Promise<{ items: any[]; meta: PaginationMeta }>;
  updateVisibleItems: (scrollTop?: number, isPageJump?: boolean) => void;
}

/**
 * Creates a pagination manager for handling page-based navigation
 * @param deps Dependencies from the main list manager
 * @returns Pagination management functions
 */
export const createPaginationManager = (deps: PaginationDependencies) => {
  const {
    state,
    config,
    elements,
    container,
    itemsCollection,
    adapter,
    itemMeasurement,
    renderer,
    loadItems,
    updateVisibleItems,
  } = deps;

  // Flags for managing UI state during operations
  let justJumpedToPage = false;
  let pageJumpTimeout: number | null = null;
  let isPreloadingPages = false;
  let isPageJumpLoad = false;
  let scrollStopTimeout: NodeJS.Timeout | null = null;

  /**
   * Schedule a page load when scrolling stops (debounced)
   * @param targetPage Page to load when scrolling stops
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
   * Check for page boundaries and trigger loading if needed
   * @param scrollTop Current scroll position
   */
  const checkPageBoundaries = (scrollTop: number): void => {
    if (state.paginationStrategy !== "page") return;

    const itemHeight = config.itemHeight || 84;
    const pageSize = config.pageSize || 20;
    const pageHeight = pageSize * itemHeight;

    // Calculate current virtual page based on scroll position
    const virtualPage = Math.floor(scrollTop / pageHeight) + 1;

    console.log(`🎯 [PageBoundary] Checking boundaries:`, {
      scrollTop,
      virtualPage,
      statePage: state.page,
      itemHeight,
      pageSize,
      pageHeight,
    });

    // Check if we need to load the next page
    const nextPage = virtualPage + 1;
    const prevPage = virtualPage - 1;

    // Load next page if we're close to the boundary
    if (nextPage !== state.page && virtualPage > state.page) {
      console.log(`⬇️ [PageBoundary] Triggering next page load: ${nextPage}`);
      loadNextPageFromBoundary(nextPage);
    }

    // Load previous page if we're scrolling up and close to boundary
    if (prevPage !== state.page && virtualPage < state.page && prevPage >= 1) {
      console.log(
        `⬆️ [PageBoundary] Triggering previous page load: ${prevPage}`
      );
      loadPreviousPageFromBoundary(prevPage);
    }
  };

  /**
   * Load next page from boundary detection
   * @param pageNumber Page number to load
   */
  const loadNextPageFromBoundary = async (
    pageNumber: number
  ): Promise<void> => {
    if (isPreloadingPages) return;

    isPreloadingPages = true;
    console.log(`📥 [Boundary] Loading next page ${pageNumber}`);

    try {
      const loadParams = createLoadParams(state);
      loadParams.page = pageNumber;

      await loadItems(loadParams);
    } catch (error) {
      console.error(`Error loading next page ${pageNumber}:`, error);
    } finally {
      isPreloadingPages = false;
    }
  };

  /**
   * Load previous page from boundary detection
   * @param pageNumber Page number to load
   */
  const loadPreviousPageFromBoundary = async (
    pageNumber: number
  ): Promise<void> => {
    if (isPreloadingPages || pageNumber < 1) return;

    isPreloadingPages = true;
    console.log(`📥 [Boundary] Loading previous page ${pageNumber}`);

    try {
      const loadParams = createLoadParams(state);
      loadParams.page = pageNumber;

      await loadItems(loadParams);
    } catch (error) {
      console.error(`Error loading previous page ${pageNumber}:`, error);
    } finally {
      isPreloadingPages = false;
    }
  };

  /**
   * Load a specific page (only works with page-based pagination)
   * @param pageNumber Page number to load
   * @returns Load result
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

    // BOUNDS CHECKING: Validate that requested page is within data range
    if (state.itemCount && state.itemCount > 0) {
      const pageSize = config.pageSize || 20;
      const maxPage = Math.ceil(state.itemCount / pageSize);

      if (pageNumber > maxPage) {
        console.warn(
          `⚠️ [LoadPage] Page ${pageNumber} is beyond data range (max: ${maxPage})`
        );
        console.log(`📊 [LoadPage] Bounds info:`, {
          requestedPage: pageNumber,
          maxPage,
          totalItems: state.itemCount.toLocaleString(),
          pageSize,
          calculation: `${state.itemCount} ÷ ${pageSize} = ${maxPage} pages`,
        });

        // Return empty result for pages beyond data range
        return { hasNext: false, items: [] };
      }

      console.log(
        `✅ [LoadPage] Page ${pageNumber} is valid (within range 1-${maxPage})`
      );
    }

    // Check if we're using page-based pagination
    const paginationStrategy = config.pagination?.strategy || "cursor";
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

        // Immediate double-check - no delay needed
        if (state.visibleItems.length === 0) {
          console.warn(
            `⚠️ [LoadPage] Force-rendering page ${pageNumber} items`
          );
          updateVisibleItems(0);
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
    const pageSize = config.pageSize || 20;
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

      const perPageParam = config.pagination?.perPageParamName || "per_page";
      loadParams[perPageParam] = config.pageSize || 20;

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

    // SIMPLIFIED: Position to show the requested page
    console.log(`📍 [LoadPage] Positioning to show page ${pageNumber}`);

    // Calculate the absolute scroll position for this page
    const defaultItemHeight = config.itemHeight || 84;

    // Calculate natural scroll position for page positioning
    const targetScrollPosition = (pageStartId - 1) * defaultItemHeight;

    console.log(`📍 [LoadPage] Page ${pageNumber} natural positioning:`, {
      pageStartId: pageStartId,
      itemHeight: defaultItemHeight,
      targetScrollPosition: targetScrollPosition,
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
   * @returns Load result
   */
  const loadPreviousPage = async (): Promise<{
    hasPrev: boolean;
    items: any[];
  }> => {
    // Check if we're using page-based pagination
    const paginationStrategy = config.pagination?.strategy || "cursor";
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
    const perPageParam = config.pagination?.perPageParamName || "per_page";
    loadParams[perPageParam] = config.pageSize || 20;

    // Load the previous page
    const response = await adapter.read(loadParams);

    // Process items
    const items = Array.isArray(response.items)
      ? response.items.map(config.transform!)
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
      const defaultItemHeight = config.itemHeight || 84;
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
   * Load next page/items
   * @returns Load result
   */
  const loadNext = async (): Promise<{ hasNext: boolean; items: any[] }> => {
    if (state.loading) {
      return { hasNext: state.hasNext, items: [] };
    }

    console.log(`🔄 [LoadNext] Starting load operation`);

    // Create the parameters for the next page/cursor
    const loadParams = createLoadParams(state);

    // For page-based pagination, increment the page number
    if (state.paginationStrategy === "page" && state.page) {
      loadParams.page = state.page + 1;

      // Add pageSize parameter
      const perPageParam = config.pagination?.perPageParamName || "per_page";
      loadParams[perPageParam] = config.pageSize || 20;

      console.log(`📄 [LoadNext] Loading page ${loadParams.page}`, {
        currentPage: state.page,
        requestedPage: loadParams.page,
        pageSize: config.pageSize,
      });
    }

    try {
      const result = await loadItems(loadParams);

      console.log(`✅ [LoadNext] Load complete:`, {
        itemsLoaded: result.items.length,
        hasNext: result.meta.hasNext,
        totalItemsNow: state.items.length,
      });

      return {
        hasNext: result.meta.hasNext ?? false,
        items: result.items,
      };
    } catch (error) {
      console.error("Error in loadNext:", error);
      return { hasNext: false, items: [] };
    }
  };

  /**
   * Get pagination state flags
   */
  const getPaginationFlags = () => ({
    justJumpedToPage,
    isPreloadingPages,
    isPageJumpLoad,
  });

  /**
   * Set pagination state flags
   */
  const setPaginationFlags = (
    flags: Partial<{
      justJumpedToPage: boolean;
      isPreloadingPages: boolean;
      isPageJumpLoad: boolean;
    }>
  ) => {
    if (flags.justJumpedToPage !== undefined)
      justJumpedToPage = flags.justJumpedToPage;
    if (flags.isPreloadingPages !== undefined)
      isPreloadingPages = flags.isPreloadingPages;
    if (flags.isPageJumpLoad !== undefined)
      isPageJumpLoad = flags.isPageJumpLoad;
  };

  /**
   * Cleanup pagination resources
   */
  const cleanup = () => {
    // Clear any pending timeouts
    if (pageJumpTimeout !== null) {
      clearTimeout(pageJumpTimeout);
      pageJumpTimeout = null;
    }
    if (scrollStopTimeout !== null) {
      clearTimeout(scrollStopTimeout);
      scrollStopTimeout = null;
    }
  };

  return {
    // Page navigation
    loadPage,
    loadPreviousPage,
    loadNext,

    // Boundary detection
    checkPageBoundaries,
    loadNextPageFromBoundary,
    loadPreviousPageFromBoundary,

    // Scroll stop handling
    scheduleScrollStopPageLoad,

    // State management
    getPaginationFlags,
    setPaginationFlags,

    // Cleanup
    cleanup,
  };
};
