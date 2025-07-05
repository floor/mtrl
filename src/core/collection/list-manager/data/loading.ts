import { Collection } from "../../collection";
import {
  ListManagerState,
  ListManagerConfig,
  ListManagerElements,
  LoadParams,
  PaginationMeta,
  LoadStatus,
} from "../types";
import { updateStateAfterLoad, updateLoadingState } from "../utils/state";
import { updateSpacerHeight } from "../dom/elements";

/**
 * Data loading manager dependencies
 */
export interface DataLoadingDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  elements: ListManagerElements;
  collection: string;
  adapter: any;
  itemsCollection: Collection<any>;
  getPaginationFlags: () => { isPageJumpLoad: boolean };
  setPaginationFlags: (flags: { isPageJumpLoad: boolean }) => void;
  replacePlaceholdersWithReal?: (newRealItems: any[]) => void;
}

/**
 * Creates a data loading manager for handling API calls and data management
 * @param deps Dependencies from the main list manager
 * @returns Data loading management functions
 */
export const createDataLoadingManager = (deps: DataLoadingDependencies) => {
  const {
    state,
    config,
    elements,
    collection,
    adapter,
    itemsCollection,
    getPaginationFlags,
    setPaginationFlags,
    replacePlaceholdersWithReal,
  } = deps;

  // 🚀 PERFORMANCE: Cache frequently accessed values
  const itemHeight = config.itemHeight || 84;
  const transformFn = config.transform!;
  const isDedupeEnabled = config.dedupeItems;

  // 🚀 PERFORMANCE: Pre-allocate reusable Set for deduplication
  const reusableExistingIds = new Set<string>();

  /**
   * Load items with cursor pagination or from static data
   * @param params Query parameters
   * @returns Response with items and pagination metadata
   */
  const loadItems = async (
    params: LoadParams = {}
  ): Promise<{ items: any[]; meta: PaginationMeta }> => {
    const { isPageJumpLoad } = getPaginationFlags();

    // Loading items with page jump detection

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
      // Don't load a different page unless it's explicitly a page jump or adjacent boundary load
      return {
        items: state.items,
        meta: { hasNext: state.hasNext, cursor: null },
      };
    }

    try {
      // Update loading state
      Object.assign(state, updateLoadingState(state, true));

      // For API-connected lists, use the adapter
      if (!adapter) {
        throw new Error("Cannot load items: API adapter not initialized");
      }

      const response = await adapter.read(params);

      // 🚀 PERFORMANCE: Process items more efficiently
      const items = Array.isArray(response.items)
        ? response.items.map(transformFn)
        : [];

      // API response processed successfully

      // Store current state.items.length before updating state
      const currentStateItemsLength = state.items.length;

      // CRITICAL FIX: For page jumps, always replace collection regardless of existing items
      // This fixes the issue where high page numbers (like 100,000) would append instead of replace
      // DEFENSIVE FIX: Don't clear collection if API returns 0 items to prevent data loss
      if (
        isPageJumpLoad &&
        state.paginationStrategy === "page" &&
        params.page
      ) {
        if (items.length > 0) {
          await itemsCollection.clear();
          await itemsCollection.add(items);
        }
      } else if (state.paginationStrategy === "page") {
        // For boundary loads (adjacent pages), append to existing collection
        if (items.length > 0) {
          await itemsCollection.add(items);
        }
      } else if (state.paginationStrategy === "offset") {
        // For offset pagination, replace collection only for explicit page jumps or true initial loads
        const isTrueInitialLoad =
          params.offset === 0 && state.items.length === 0;
        const shouldReplace = isTrueInitialLoad || isPageJumpLoad;

        if (shouldReplace && items.length > 0) {
          // Initial load or page jump: replace collection
          await itemsCollection.clear();
          await itemsCollection.add(items);
        } else if (items.length > 0) {
          // For non-initial loads, append to existing collection
          await itemsCollection.add(items);
        } else {
          // Ignore requests that would replace existing items with empty results
        }

        // Block unwanted offset=0 calls that would corrupt data
        if (
          params.offset === 0 &&
          !isTrueInitialLoad &&
          !isPageJumpLoad &&
          state.items.length > 0
        ) {
          // Unwanted offset=0 call blocked to prevent data corruption
        }
      } else {
        // For cursor pagination, use deduplication
        if (isDedupeEnabled) {
          // 🚀 PERFORMANCE: Reuse Set and avoid temporary arrays
          reusableExistingIds.clear();
          for (let i = 0; i < state.items.length; i++) {
            const item = state.items[i];
            if (item?.id) {
              reusableExistingIds.add(item.id);
            }
          }

          // 🚀 PERFORMANCE: Build new items array efficiently
          const newItems = [];
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!reusableExistingIds.has(item.id)) {
              newItems.push(item);
            }
          }

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
        params.page
      ) {
        if (items.length > 0) {
          // 🚀 PERFORMANCE: Direct assignment instead of spreading
          state.items = items;
          state.cursor = response.meta.cursor ?? null;
          state.page = response.meta.page ?? params.page;
          state.hasNext = response.meta.hasNext ?? false;
          state.totalHeightDirty = true;
          state.itemCount = response.meta.total ?? items.length;
        } else {
          // For page jumps with 0 items, only update metadata, preserve existing items
          state.cursor = response.meta.cursor ?? null;
          state.hasNext = response.meta.hasNext ?? false;
          state.totalHeightDirty = true;
        }
      } else if (state.paginationStrategy === "offset") {
        // 🚀 PERFORMANCE: Cache collection items and avoid spreading
        const collectionItems = itemsCollection.getItems();
        state.items = collectionItems as any[];
        state.hasNext = response.meta.hasNext ?? false;
        state.totalHeightDirty = true;
        state.itemCount = response.meta.total ?? collectionItems.length;
      } else {
        // 🚀 PERFORMANCE: Get collection items once and avoid spreading
        const collectionItems = itemsCollection.getItems();
        const stateUpdates = updateStateAfterLoad(
          state,
          collectionItems as any[],
          response.meta,
          isDedupeEnabled
        );

        // Preserve page state during initial range loading (non-page-jump loads)
        if (!isPageJumpLoad && state.page === 1 && stateUpdates.page !== 1) {
          stateUpdates.page = 1; // Keep page at 1 during initial range loading
        }

        Object.assign(state, stateUpdates);
      }

      // CRITICAL: Set total height immediately after state update to fix scrollbar behavior
      // The scrollbar needs to know the correct total height as soon as we get the API total
      // BUT: Only for page/offset pagination - cursor pagination uses incremental height
      if (
        response.meta.total &&
        state.paginationStrategy !== "cursor"
      ) {
        // 🚀 PERFORMANCE: Use cached itemHeight value
        const naturalHeight = response.meta.total * itemHeight;

        state.totalHeight = naturalHeight;
        state.totalHeightDirty = false; // Mark as clean since we have the definitive height
        updateSpacerHeight(elements, naturalHeight);
      } else if (state.paginationStrategy === "cursor") {
        // For cursor pagination, let the viewport manager calculate the appropriate height
        state.totalHeightDirty = true;
      }

      // Reset the page jump flag
      setPaginationFlags({ isPageJumpLoad: false });

      // SEAMLESS INFINITE CONTENT: Replace placeholder items with real items when they arrive
      if (replacePlaceholdersWithReal && items.length > 0) {
        replacePlaceholdersWithReal(items);
      }

      // Call afterLoad callback if provided
      if (config.afterLoad) {
        // 🚀 PERFORMANCE: Create shallow copy more efficiently
        const itemsCopy = state.items.slice() as any[];

        const loadData: LoadStatus = {
          loading: false,
          hasNext: state.hasNext,
          hasPrev: !!params.cursor || (params.page && params.page > 1),
          items: items.slice() as any[], // Use slice() instead of spread operator
          allItems: itemsCopy,
        };

        config.afterLoad(loadData);
      }

      // For cursor-based pagination, we need to track cursor
      if (state.paginationStrategy === "cursor" && response.meta?.cursor) {
        state.cursor = response.meta.cursor;
      } else if (state.paginationStrategy === "page" && params.page) {
        // Only update page state for explicit page jumps, not during initial range loading
        if (isPageJumpLoad) {
          state.page = params.page;
        }
        // For initial range loading, keep page at 1 to maintain stable state
      }

      return {
        items,
        meta: response.meta,
      };
    } catch (error) {
      // Silently handle errors for data loading
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
   * Refresh the list by clearing and reloading data
   * @returns Promise that resolves when refresh is complete
   */
  const refresh = async (): Promise<void> => {
    // Clear collection first
    await itemsCollection.clear();

    // Reset state to initial values for API mode
    state.items = [];
    state.visibleItems = [];
    state.visibleRange = { start: 0, end: 0 };
    state.cursor = null;
    state.page = state.paginationStrategy === "page" ? 1 : undefined;
    state.hasNext = true;
    state.totalHeightDirty = true;
    state.itemCount = 0;
  };

  return {
    loadItems,
    refresh,
  };
};
