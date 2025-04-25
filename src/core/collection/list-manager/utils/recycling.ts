// src/core/collection/list-manager/utils/recycling.ts

/**
 * Creates a recycling pool manager for better performance
 * Reduces DOM creation by reusing elements
 */
export const createRecyclingPool = () => {
  const pools = new Map<string, HTMLElement[]>();
  const poolSizeLimit = 50; // Limit pool size to prevent memory leaks
  
  return {
    /**
     * Gets a recycled element of the appropriate type if available
     * @param item Item to get recycled element for
     * @returns Recycled element or null if none available
     */
    getRecycledElement: (item: any): HTMLElement | null => {
      // Get type info from item or use 'default'
      const itemType = item.type || 'default';
      
      if (!pools.has(itemType)) {
        pools.set(itemType, []);
        return null;
      }
      
      const pool = pools.get(itemType)!;
      return pool.length > 0 ? pool.pop()! : null;
    },
    
    /**
     * Adds an element to the recycling pool
     * @param element Element to recycle
     * @param forceRecycle Whether to force recycling even for small elements
     */
    recycleElement: (element: HTMLElement, forceRecycle = false): void => {
      if (!element) return;
      
      // Skip recycling for simple elements unless forced
      if (!forceRecycle && element.innerHTML.length < 100) return;
      
      const itemType = element.dataset.itemType || 'default';
      
      if (!pools.has(itemType)) {
        pools.set(itemType, []);
      }
      
      const pool = pools.get(itemType)!;
      
      // Limit pool size to prevent memory bloat
      if (pool.length < poolSizeLimit) {
        // Clear internal state to prevent memory leaks
        element.style.display = 'none';
        element.style.top = '-9999px';
        
        // Remove any data-* attributes except itemType
        for (const key in element.dataset) {
          if (key !== 'itemType') {
            delete element.dataset[key];
          }
        }
        
        pool.push(element);
      }
    },
    
    /**
     * Get all recycled elements in a pool
     * @param itemType Type of items to get
     * @returns Array of recycled elements
     */
    getPool: (itemType: string): HTMLElement[] => {
      return pools.get(itemType) || [];
    },
    
    /**
     * Clears all recycling pools
     */
    clear: (): void => {
      pools.forEach(pool => {
        pool.length = 0;
      });
      pools.clear();
    },
    
    /**
     * Gets the total number of recycled elements
     * @returns Total count of recycled elements
     */
    getSize: (): number => {
      let count = 0;
      pools.forEach(pool => {
        count += pool.length;
      });
      return count;
    }
  };
};

export type RecyclingPool = ReturnType<typeof createRecyclingPool>;