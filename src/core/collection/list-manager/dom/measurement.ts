// src/core/collection/list-manager/item-measurement.ts
import { ListManagerConfig } from "../types";

/**
 * Create item height measurement utilities
 * @param defaultHeight Default height for items with no measurement
 * @returns Object containing measurement functions
 */
export const createItemMeasurement = (defaultHeight: number = 48) => {
  // Cache of item heights
  const itemHeights = new Map<string, number>();
  // Cache of precalculated offsets for faster lookups
  const offsetCache = new Map<string, number>();
  // Flag to track if offsets are cached and up-to-date
  let offsetsCached = false;
  // Flag for using uniform heights (optimization)
  let useUniformHeight = true;
  // Track the measurement mode (auto or fixed)
  let dynamicMeasurement = false;

  /**
   * Gets the ID of an item, handling different item structures
   * @param item Item to get ID from
   * @returns Item ID or undefined
   */
  const getItemId = (item: any): string | undefined => {
    if (!item) return undefined;
    return item.id || (item.original && item.original.id);
  };

  /**
   * Calculate offsets for all items and cache the results
   * This improves scrolling performance significantly
   * @param items Array of all items
   */
  const calculateOffsets = (items: any[]): void => {
    // Skip if already up-to-date
    if (offsetsCached && offsetCache.size >= items.length) {
      return;
    }

    // Clear existing cache
    offsetCache.clear();

    // Determine if we should use uniform height optimization
    if (useUniformHeight) {
      let runningOffset = 0;
      // Use default height for all items when using uniform height
      for (let i = 0; i < items.length; i++) {
        if (items[i]) {
          const itemId = getItemId(items[i]);
          if (itemId) {
            offsetCache.set(itemId, runningOffset);
          }
          offsetCache.set(`index:${i}`, runningOffset);
          runningOffset += defaultHeight;
        }
      }
    } else {
      // Variable height calculation - more expensive
      let currentOffset = 0;
      for (let i = 0; i < items.length; i++) {
        if (items[i]) {
          const itemId = getItemId(items[i]);

          // Store offset by both ID and index for different lookup methods
          if (itemId) {
            offsetCache.set(itemId, currentOffset);
          }
          offsetCache.set(`index:${i}`, currentOffset);

          // Get height from cache or use default
          const height =
            itemId && itemHeights.has(itemId)
              ? itemHeights.get(itemId)!
              : defaultHeight;

          currentOffset += height;
        }
      }
    }

    offsetsCached = true;
  };

  /**
   * Initialize the measurement mode
   * @param config List configuration options
   */
  const initializeMode = (config?: ListManagerConfig): void => {
    if (!config) return;

    // Check config to determine measurement mode
    dynamicMeasurement = config.dynamicItemSize === true;
    useUniformHeight = !dynamicMeasurement;

    // If explicit itemHeight is provided, ensure we use it
    if (config.itemHeight) {
      defaultHeight = config.itemHeight;
    } else if (!dynamicMeasurement) {
      // When no explicit height is given and not in dynamic mode,
      // we'll still use the default (48px) but measure the first
      // rendered item to get a better default
    }
  };

  return {
    /**
     * Setup measurement system with configuration options
     * Should be called on initialization
     * @param config List configuration options
     */
    setup: (config?: ListManagerConfig): void => {
      initializeMode(config);
    },

    /**
     * Measures the height of an item using its DOM element
     * @param item Item to measure
     * @param element DOM element of the item
     * @returns The measured height
     */
    measureItemHeight: (item: any, element: HTMLElement): number => {
      if (!element || !item) return defaultHeight;

      // Always use default height in uniform mode (except first item if auto-detecting)
      if (useUniformHeight && itemHeights.size > 0) {
        return defaultHeight;
      }

      // Get item ID, handling the transformed structure
      const itemId = getItemId(item);
      if (!itemId) return defaultHeight;

      // Get element height and check if it's valid
      const height = element.offsetHeight;

      // Only apply measurements if:
      // 1. In dynamic mode, OR
      // 2. First item measurement for auto-detection, OR
      // 3. Item has a previously saved height
      if (
        dynamicMeasurement ||
        itemHeights.size === 0 ||
        itemHeights.has(itemId)
      ) {
        // Only store if height is reasonable
        if (height > 0) {
          const previousHeight = itemHeights.get(itemId);
          const heightChanged = previousHeight !== height;

          // If this is the first item and we're auto-detecting height
          if (itemHeights.size === 0 && !dynamicMeasurement) {
            // Set this as the new default height
            defaultHeight = height;
          }

          // Store height for this item
          if (heightChanged) {
            itemHeights.set(itemId, height);

            // Invalidate offset cache when heights change
            if (offsetsCached && !useUniformHeight) {
              offsetsCached = false;
            }
          }
        }
      }

      // For initial auto-detection with no explicit height
      if (
        itemHeights.size === 1 &&
        !dynamicMeasurement &&
        element.offsetHeight > 0
      ) {
        // First item measured, use its height as default
        return itemHeights.values().next().value;
      }

      // Return the appropriate height
      return dynamicMeasurement
        ? itemHeights.get(itemId) || defaultHeight
        : defaultHeight;
    },

    /**
     * Gets the height of an item, using cached value if available
     * @param item Item to get height for
     * @returns Item height in pixels
     */
    getItemHeight: (item: any): number => {
      // In uniform mode, always use the default height
      if (useUniformHeight) return defaultHeight;

      // Handle case when item is undefined
      if (!item) return defaultHeight;

      // Get the item ID
      const itemId = getItemId(item);
      if (!itemId) return defaultHeight;

      // Use cached height if available
      if (itemHeights.has(itemId)) {
        return itemHeights.get(itemId) || defaultHeight;
      }

      // Default to configured item height
      return defaultHeight;
    },

    /**
     * Set custom heights for specific items
     * Only applied when in dynamic measurement mode
     * @param heightsMap Map of item IDs to heights
     * @returns Whether any heights were updated
     */
    setItemHeights: (heightsMap: Record<string, number>): boolean => {
      // Don't update heights in uniform mode
      if (useUniformHeight && !dynamicMeasurement) {
        return false;
      }

      let updated = false;

      for (const [id, height] of Object.entries(heightsMap)) {
        const currentHeight = itemHeights.get(id);

        // Only update if different
        if (currentHeight !== height && height > 0) {
          itemHeights.set(id, height);
          updated = true;
        }
      }

      // Invalidate offset cache if heights were updated
      if (updated) {
        offsetsCached = false;
      }

      return updated;
    },

    /**
     * Calculates total height of all items
     * @param items Array of items
     * @returns Total height in pixels
     */
    calculateTotalHeight: (items: any[]): number => {
      // Basic sanity check
      if (!items || items.length === 0) return 0;

      const itemCount = items.length;

      // In uniform height mode, simple multiplication
      if (useUniformHeight) {
        return itemCount * defaultHeight;
      }

      // For dynamic height mode, calculate based on individual items
      let totalHeight = 0;

      // Sum up heights of all items
      for (const item of items) {
        if (!item) continue;

        const itemId = getItemId(item);
        totalHeight +=
          itemId && itemHeights.has(itemId)
            ? itemHeights.get(itemId)!
            : defaultHeight;
      }

      return totalHeight;
    },

    /**
     * Get offset of an item from the top of the list
     * @param items List of all items
     * @param itemId ID of item to find offset for
     * @returns Offset in pixels or -1 if not found
     */
    getItemOffset: (items: any[], itemId: string): number => {
      // Try to use cached offset first
      if (offsetsCached && offsetCache.has(itemId)) {
        return offsetCache.get(itemId) || 0;
      }

      // Calculate offsets if not already cached
      calculateOffsets(items);

      // Now we should have the cached value
      if (offsetCache.has(itemId)) {
        return offsetCache.get(itemId) || 0;
      }

      // Fall back to direct calculation if item not found in cache
      if (useUniformHeight) {
        // With uniform height, find index and multiply
        const index = items.findIndex((item) => getItemId(item) === itemId);
        if (index >= 0) {
          return index * defaultHeight;
        }
      } else {
        // For variable heights, calculate offset manually
        let offset = 0;
        for (const item of items) {
          const currItemId = getItemId(item);
          if (currItemId === itemId) {
            return offset;
          }

          const height =
            currItemId && itemHeights.has(currItemId)
              ? itemHeights.get(currItemId)!
              : defaultHeight;

          offset += height;
        }
      }

      return -1; // Item not found
    },

    /**
     * Get the offset at a specific index
     * @param index Index to get offset for
     * @returns Offset in pixels
     */
    getOffsetAtIndex: (index: number): number => {
      // Try to use cached offset first
      const cacheKey = `index:${index}`;
      if (offsetsCached && offsetCache.has(cacheKey)) {
        return offsetCache.get(cacheKey) || 0;
      }

      // In uniform height mode, simple calculation
      if (useUniformHeight) {
        return index * defaultHeight;
      }

      // For dynamic height, need to calculate from beginning
      return index * defaultHeight;
    },

    /**
     * Measures elements that have been marked for measurement
     * Only takes effect in dynamic measurement mode
     * @param container Container element
     * @param items List of all items
     * @returns Whether any heights were updated
     */
    measureMarkedElements: (container: HTMLElement, items: any[]): boolean => {
      // If we're measuring the first item for auto-detection, check all items
      const selector =
        itemHeights.size === 0
          ? ".mtrl-list-item"
          : '[data-needs-measurement="true"]';

      const elementsToMeasure = container.querySelectorAll(selector);
      let heightsChanged = false;

      if (elementsToMeasure.length > 0) {
        // Process first item for auto-detection
        if (itemHeights.size === 0 && elementsToMeasure.length > 0) {
          const firstElement = elementsToMeasure[0] as HTMLElement;
          const height = firstElement.offsetHeight;

          if (height > 0) {
            defaultHeight = height; // Use first item's height as default
            heightsChanged = true;

            // If not in dynamic mode, we're done after first element
            if (!dynamicMeasurement) {
              return true;
            }
          }
        }

        // Process remaining elements if in dynamic mode
        if (dynamicMeasurement) {
          for (let i = 0; i < elementsToMeasure.length; i++) {
            const el = elementsToMeasure[i] as HTMLElement;
            const id = el.getAttribute("data-id");

            if (id) {
              const item = items.find((item) => getItemId(item) === id);

              if (item) {
                const height = el.offsetHeight;

                // Only update if height is valid and different
                if (height > 0 && itemHeights.get(id) !== height) {
                  itemHeights.set(id, height);
                  heightsChanged = true;
                }

                // Clear measurement flag
                delete el.dataset.needsMeasurement;
              }
            }
          }
        }

        // Invalidate offset cache if heights changed
        if (heightsChanged && !useUniformHeight) {
          offsetsCached = false;
        }
      }

      return heightsChanged;
    },

    /**
     * Check if offsets are currently cached
     * @returns Whether offsets are cached
     */
    hasCachedOffsets: (): boolean => {
      return offsetsCached;
    },

    /**
     * Cache offsets for all items
     * @param items Array of all items
     */
    calculateOffsets,

    /**
     * Clears all cached heights and offsets
     */
    clear: (): void => {
      itemHeights.clear();
      offsetCache.clear();
      offsetsCached = false;
    },

    /**
     * Gets all cached heights
     * @returns Map of item IDs to heights
     */
    getAllHeights: (): Map<string, number> => {
      return new Map(itemHeights);
    },

    /**
     * Gets current default height
     * @returns Current default height
     */
    getDefaultHeight: (): number => {
      return defaultHeight;
    },

    /**
     * Checks if using uniform height mode
     * @returns Whether using uniform height
     */
    isUsingUniformHeight: (): boolean => {
      return useUniformHeight;
    },
  };
};

export type ItemMeasurement = ReturnType<typeof createItemMeasurement>;
