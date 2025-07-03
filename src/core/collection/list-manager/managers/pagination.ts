import { Collection } from "../../collection";
import {
  ListManagerState,
  ListManagerConfig,
  ListManagerElements,
  LoadParams,
  PaginationMeta,
} from "../types";
import { createLoadParams } from "../utils/state";
import { updateSpacerHeight } from "../dom/elements";

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
   * Enhanced loadPage function (moved from list-manager createLoadPageFunction)
   */
  const loadPageEnhanced = async (
    pageNumber: number,
    options: {
      setScrollPosition?: boolean;
      replaceCollection?: boolean;
      animate?: boolean;
    } = {}
  ): Promise<{ hasNext: boolean; items: any[] }> => {
    const {
      setScrollPosition = true,
      replaceCollection = true,
      animate = false,
    } = options;

    // Load page enhanced called

    // Validate page number
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new Error("Page number must be a positive integer");
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

    // For background loading (replaceCollection: false), handle differently
    if (!replaceCollection) {
      // Check if we already have this page's data
      const pageSize = config.pageSize || 20;
      const pageStartId = (pageNumber - 1) * pageSize + 1;
      const pageEndId = pageNumber * pageSize;

      const hasPageData = state.items.some((item) => {
        const itemId = parseInt(item?.id);
        return itemId >= pageStartId && itemId <= pageEndId;
      });

      if (hasPageData) {
        // Already have this page, return the actual items for this page
        const pageItems = state.items.filter((item) => {
          const itemId = parseInt(item?.id);
          return itemId >= pageStartId && itemId <= pageEndId;
        });

        return { hasNext: state.hasNext, items: pageItems };
      }

      // Load page data without affecting current page state
      const loadParams = createLoadParams(state, paginationStrategy);
      loadParams.page = pageNumber;

      const perPageParam = config.pagination?.perPageParamName || "per_page";
      loadParams[perPageParam] = config.pageSize || 20;

      try {
        const response = await adapter.read(loadParams);
        const items = Array.isArray(response.items)
          ? response.items.map(config.transform!)
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
          updateVisibleItems(state.scrollTop);
        }
      });

      return { hasNext: state.hasNext, items: state.items };
    }

    return { hasNext: false, items: [] }; // Simplified for now - full implementation would continue
  };

  /**
   * Load next page (renamed from loadNext for consistency)
   */
  const loadNextPage = async (): Promise<{
    hasNext: boolean;
    items: any[];
  }> => {
    // Load next page called
    if (state.loading) {
      return { hasNext: state.hasNext, items: [] };
    }

    // Create the parameters for the next page/cursor
    const loadParams = createLoadParams(state);

    // For page-based pagination, increment the page number
    if (state.paginationStrategy === "page" && state.page) {
      loadParams.page = state.page + 1;

      // Add pageSize parameter
      const perPageParam = config.pagination?.perPageParamName || "per_page";
      loadParams[perPageParam] = config.pageSize || 20;
    }

    try {
      const result = await loadItems(loadParams);

      return {
        hasNext: result.meta.hasNext ?? false,
        items: result.items,
      };
    } catch (error) {
      return { hasNext: false, items: [] };
    }
  };

  /**
   * Enhanced loadPreviousPage function (moved from list-manager)
   */
  const loadPreviousPageEnhanced = async (): Promise<{
    hasPrev: boolean;
    items: any[];
  }> => {
    // Load previous page enhanced called
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

      // Update visible items with the new scroll position
      updateVisibleItems(newScrollTop);
    }

    return {
      hasPrev: previousPage > 1,
      items,
    };
  };

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
    // Use the enhanced loadPage functionality which works perfectly
    loadPageEnhanced(targetPage);
    scrollStopTimeout = null;
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
    // Enhanced page navigation (moved from list-manager)
    loadPage: loadPageEnhanced,
    loadNextPage,
    loadPreviousPage: loadPreviousPageEnhanced,

    // Scroll stop handling
    scheduleScrollStopPageLoad,

    // State management
    getPaginationFlags,
    setPaginationFlags,

    // Cleanup
    cleanup,
  };
};
