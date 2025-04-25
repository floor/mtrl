// src/core/collection/list-manager/item-measurement.ts
import { ListManagerConfig } from './types';

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
    return item?.id || (item?.original && item.original.id);
  };
  
  return {
    /**
     * Measures the height of an item using its DOM element
     * @param item Item to measure
     * @param element DOM element of the item
     * @returns The measured height
     */
    measureItemHeight: (item: any, element: HTMLElement): number => {
      if (!element) return defaultHeight;
      if (!item) return defaultHeight;
      
      // Get item ID, handling the transformed structure
      const itemId = getItemId(item);
      if (!itemId) return defaultHeight;
      
      // Get element height
      const height = element.offsetHeight || defaultHeight;
      
      // Store height for this item
      if (height > 0) {
        itemHeights.set(itemId, height);
      }
      
      return height;
    },
    
    /**
     * Gets the height of an item, using cached value if available
     * @param item Item to get height for
     * @returns Item height in pixels
     */
    getItemHeight: (item: any): number => {
      // Handle case when item is undefined
      if (!item) {
        console.warn('Attempted to get height of undefined item');
        return defaultHeight;
      }
      
      // Get the item ID
      const itemId = getItemId(item);
      if (!itemId) {
        console.warn('Item has no ID', item);
        return defaultHeight;
      }
      
      // Use cached height if available
      if (itemHeights.has(itemId)) {
        return itemHeights.get(itemId) || defaultHeight;
      }
      
      // Default to configured item height
      return defaultHeight;
    },
    
    /**
     * Set custom heights for specific items
     * @param heightsMap Map of item IDs to heights
     * @returns Whether any heights were updated
     */
    setItemHeights: (heightsMap: Record<string, number>): boolean => {
      let updated = false;
      
      for (const [id, height] of Object.entries(heightsMap)) {
        const currentHeight = itemHeights.get(id);
        
        // Only update if different
        if (currentHeight !== height) {
          itemHeights.set(id, height);
          updated = true;
        }
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
      if (items.length === 0) return 0;
      
      const itemCount = items.length;
      
      // Check if we have measured any heights yet
      if (itemHeights.size === 0) {
        // No items measured yet, use default height for all
        return itemCount * defaultHeight;
      }
      
      // Fast calculation if all items have the same height
      const uniqueHeights = new Set(itemHeights.values());
      if (uniqueHeights.size === 1) {
        // All measured items have the same height
        const measuredHeight = uniqueHeights.values().next().value;
        return itemCount * measuredHeight;
      }
      
      // If we have a mix of measured and unmeasured items
      let totalHeight = 0;
      let measuredCount = 0;
      let unmeasuredCount = 0;
      
      // Sum up heights of all items
      for (const item of items) {
        const itemId = getItemId(item);
        if (itemId && itemHeights.has(itemId)) {
          totalHeight += itemHeights.get(itemId) || defaultHeight;
          measuredCount++;
        } else {
          unmeasuredCount++;
        }
      }
      
      // If we haven't measured any items, use default height
      if (measuredCount === 0) {
        return itemCount * defaultHeight;
      }
      
      // For unmeasured items, use average of measured items
      const averageHeight = totalHeight / measuredCount;
      return totalHeight + (unmeasuredCount * averageHeight);
    },
    
    /**
     * Get offset of an item from the top
     * @param items List of all items
     * @param itemId ID of item to find offset for
     * @returns Offset in pixels or -1 if not found
     */
    getItemOffset: (items: any[], itemId: string): number => {
      let offset = 0;
      
      for (const item of items) {
        const currItemId = getItemId(item);
        if (currItemId === itemId) {
          return offset;
        }
        const height = itemHeights.get(currItemId!) || defaultHeight;
        offset += height;
      }
      
      return -1; // Item not found
    },
    
    /**
     * Measures elements that have been marked for measurement
     * @param container Container element
     * @param items List of all items
     * @returns Whether any heights were updated
     */
    measureMarkedElements: (container: HTMLElement, items: any[]): boolean => {
      const elementsToMeasure = container.querySelectorAll('[data-needs-measurement="true"]');
      let heightsChanged = false;
      
      if (elementsToMeasure.length > 0) {
        heightsChanged = true;
        
        elementsToMeasure.forEach(el => {
          const id = (el as HTMLElement).getAttribute('data-id');
          if (id) {
            // Find the item, accounting for possible transformed structures
            const item = items.find(item => {
              const itemId = getItemId(item);
              return itemId === id;
            });
            
            if (item) {
              const height = (el as HTMLElement).offsetHeight;
              if (height > 0) {
                itemHeights.set(id, height);
                delete (el as HTMLElement).dataset.needsMeasurement;
              }
            }
          }
        });
      }
      
      return heightsChanged;
    },
    
    /**
     * Clears all cached heights
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
    }
  };
};

export type ItemMeasurement = ReturnType<typeof createItemMeasurement>;