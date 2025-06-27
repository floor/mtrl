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
  replaceFakeItemsWithReal?: (newRealItems: any[]) => void;
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
    replaceFakeItemsWithReal,
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
    } else if (isAdjacentPage && !isPageJumpLoad) {
      // console.log(
      //   `✅ [LoadItems] Allowing adjacent page boundary load: requested page ${params.page}, current page ${state.page}`
      // );
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
        } else {
        }
      } else if (state.paginationStrategy === "page") {
        // For boundary loads (adjacent pages), append to existing collection
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
        params.page
      ) {
        if (items.length > 0) {
          // For page jumps with data, replace state items (fixed for high page numbers)
          Object.assign(state, {
            items: [...items],
            cursor: response.meta.cursor ?? null,
            page: response.meta.page ?? params.page,
            hasNext: response.meta.hasNext ?? false,
            totalHeightDirty: true,
            itemCount: response.meta.total ?? items.length,
          });
        } else {
          // For page jumps with 0 items, only update metadata, preserve existing items
          Object.assign(state, {
            cursor: response.meta.cursor ?? null,
            hasNext: response.meta.hasNext ?? false,
            // Keep existing items and itemCount
            totalHeightDirty: true,
          });
        }
      } else {
        // For boundary loads, update state with the FULL collection, not just new items
        const existingCollection = [...itemsCollection.getItems()];

        // Removed excessive boundary debug logs

        // Add items to collection
        if (items.length > 0) {
          await itemsCollection.add(items);
        }

        Object.assign(
          state,
          updateStateAfterLoad(
            state,
            [...itemsCollection.getItems()],
            response.meta,
            config.dedupeItems
          )
        );
        // Removed excessive boundary load logging
      }

      // CRITICAL: Set total height immediately after state update to fix scrollbar behavior
      // The scrollbar needs to know the correct total height as soon as we get the API total
      if (response.meta.total && !state.useStatic) {
        const naturalHeight = response.meta.total * (config.itemHeight || 84);

        state.totalHeight = naturalHeight;
        state.totalHeightDirty = false; // Mark as clean since we have the definitive height
        updateSpacerHeight(elements, naturalHeight);
      }

      // Reset the page jump flag
      setPaginationFlags({ isPageJumpLoad: false });

      // SEAMLESS INFINITE CONTENT: Replace fake items with real items when they arrive
      if (replaceFakeItemsWithReal && items.length > 0) {
        replaceFakeItemsWithReal(items);
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
      // Transform static items before adding to collection (same as API items)
      const transformedItems = initialItems.map(config.transform!);
      await itemsCollection.add(transformedItems);
    }
  };

  return {
    loadItems,
    refresh,
  };
};
