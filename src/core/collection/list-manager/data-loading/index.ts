import { Collection } from "../../collection";
import {
  ListManagerState,
  ListManagerConfig,
  ListManagerElements,
  LoadParams,
  PaginationMeta,
  LoadStatus,
} from "../types";
import { updateStateAfterLoad, updateLoadingState } from "../state";
import { updateSpacerHeight } from "../dom-elements";

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
  } = deps;

  /**
   * Load items with cursor pagination or from static data
   * @param params Query parameters
   * @returns Response with items and pagination metadata
   */
  const loadItems = async (
    params: LoadParams = {}
  ): Promise<{ items: any[]; meta: PaginationMeta }> => {
    const { isPageJumpLoad } = getPaginationFlags();

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
        ? response.items.map(config.transform!)
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
        if (config.dedupeItems) {
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
          updateStateAfterLoad(state, items, response.meta, config.dedupeItems)
        );
        console.log(
          `📄 [LoadItems] Regular state update: appended/deduped items`
        );
      }

      // Reset the page jump flag
      setPaginationFlags({ isPageJumpLoad: false });

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
          response.meta.total * (config.itemHeight || 84);
        state.totalHeight = definitiveHeight;
        state.totalHeightDirty = false; // Mark as clean since we have the definitive height
        updateSpacerHeight(elements, definitiveHeight);

        console.log(
          `🎯 [TotalHeight] Locked in definitive height from API total:`,
          {
            apiTotal: response.meta.total.toLocaleString(),
            itemHeight: config.itemHeight || 84,
            definitiveHeight: definitiveHeight.toLocaleString(),
            note: "This height will remain consistent across all pages",
          }
        );
      }

      // Call afterLoad callback if provided
      if (config.afterLoad) {
        // Create a read-only copy of the items array to prevent mutation
        const itemsCopy = [...state.items] as any[];

        const loadData: LoadStatus = {
          loading: false,
          hasNext: state.hasNext,
          hasPrev: !!params.cursor || (params.page && params.page > 1),
          items: [...items] as any[], // Use type assertion to satisfy the mutable array requirement
          allItems: itemsCopy,
        };

        config.afterLoad(loadData);
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
   * Refresh the list by clearing and reloading data
   * @returns Promise that resolves when refresh is complete
   */
  const refresh = async (): Promise<void> => {
    console.log(`🔄 [Refresh] Refreshing list data`);

    // Clear collection first
    await itemsCollection.clear();

    // Reset state to initial values
    const initialItems = state.useStatic
      ? config.staticItems || config.items || []
      : [];

    state.items = initialItems;
    state.visibleItems = [];
    state.visibleRange = { start: 0, end: 0 };
    state.cursor = null;
    state.page = state.paginationStrategy === "page" ? 1 : undefined;
    state.hasNext = !state.useStatic;
    state.totalHeightDirty = true;
    state.itemCount = state.useStatic ? initialItems.length : 0;

    // For static lists, add items back to collection
    if (state.useStatic && initialItems.length > 0) {
      await itemsCollection.add(initialItems);
    }

    console.log(`✅ [Refresh] List refreshed`);
  };

  return {
    loadItems,
    refresh,
  };
};
