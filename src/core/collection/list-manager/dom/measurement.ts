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

  /**
   * Gets the ID of an item, handling different item structures
   * @param item Item to get ID from
   * @returns Item ID or undefined
   */
  const getItemId = (item: any): string | undefined => {
    if (!item) return undefined;
    return item.id || (item.original && item.original.id);
  };

  return {
    /**
     * Setup measurement system with configuration options
     * Should be called on initialization
     * @param config List configuration options
     */
    setup: (config?: ListManagerConfig): void => {
      // If explicit itemHeight is provided, use it
      if (config?.itemHeight) {
        defaultHeight = config.itemHeight;
      }
    },

    /**
     * Measures the height of an item using its DOM element
     * @param item Item to measure
     * @param element DOM element of the item
     * @returns The measured height
     */
    measureItemHeight: (item: any, element: HTMLElement): number => {
      if (!element || !item) return defaultHeight;

      // Auto-detect height from first item if no explicit height was provided
      if (itemHeights.size === 0 && element.offsetHeight > 0) {
        defaultHeight = element.offsetHeight;
        const itemId = getItemId(item);
        if (itemId) {
          itemHeights.set(itemId, defaultHeight);
        }
      }

      return defaultHeight;
    },

    /**
     * Gets the height of an item, using cached value if available
     * @param item Item to get height for
     * @returns Item height in pixels
     */
    getItemHeight: (item: any): number => {
      // Always use uniform height
      return defaultHeight;
    },

    /**
     * Calculates total height of all items
     * @param items Array of items
     * @returns Total height in pixels
     */
    calculateTotalHeight: (items: any[]): number => {
      // Basic sanity check
      if (!items || items.length === 0) return 0;

      // Simple multiplication for uniform height
      return items.length * defaultHeight;
    },

    /**
     * Clears all cached heights and offsets
     */
    clear: (): void => {
      itemHeights.clear();
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
      return true; // Always uniform height now
    },
  };
};

export type ItemMeasurement = ReturnType<typeof createItemMeasurement>;
