// src/core/collection/collection.ts

/**
 * Event types for collection changes
 */
export const COLLECTION_EVENTS = {
  CHANGE: 'change',
  ADD: 'add',
  UPDATE: 'update',
  REMOVE: 'remove',
  ERROR: 'error',
  LOADING: 'loading'
} as const;

/**
 * Collection event type
 */
export type CollectionEvent = typeof COLLECTION_EVENTS[keyof typeof COLLECTION_EVENTS];

/**
 * Observer callback type for collection events
 */
export type CollectionObserver<T> = (payload: { event: CollectionEvent; data: any }) => void;

/**
 * Query operators for filtering
 */
export const OPERATORS = {
  EQ: 'eq',
  NE: 'ne',
  GT: 'gt',
  GTE: 'gte',
  LT: 'lt',
  LTE: 'lte',
  IN: 'in',
  NIN: 'nin',
  CONTAINS: 'contains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith'
} as const;

/**
 * Type for all collection items
 */
export interface CollectionItem {
  id: string;
  [key: string]: any;
}

/**
 * Collection configuration
 */
export interface CollectionConfig<T extends CollectionItem> {
  /**
   * Transform function for items
   */
  transform?: (item: any) => T;
  
  /**
   * Validation function for items
   */
  validate?: (item: any) => boolean;
  
  /**
   * Initial capacity for collection
   */
  initialCapacity?: number;
}

/**
 * Collection interface
 */
export interface Collection<T extends CollectionItem> {
  /**
   * Subscribe to collection changes
   * @param observer - Observer callback
   * @returns Unsubscribe function
   */
  subscribe: (observer: CollectionObserver<T>) => () => void;
  
  /**
   * Get collection items based on current query and sort
   * @returns Collection items
   */
  getItems: () => readonly T[];
  
  /**
   * Get collection size
   * @returns Number of items
   */
  getSize: () => number;
  
  /**
   * Get loading state
   * @returns Loading state
   */
  isLoading: () => boolean;
  
  /**
   * Get error state
   * @returns Error object
   */
  getError: () => Error | null;
  
  /**
   * Set query filter
   * @param queryFn - Query function
   */
  query: (queryFn: ((item: T) => boolean) | null) => void;
  
  /**
   * Set sort function
   * @param sortFn - Sort function
   */
  sort: (sortFn: ((a: T, b: T) => number) | null) => void;
  
  /**
   * Add items to collection
   * @param items - Items to add
   * @returns Added items
   */
  add: (items: T | readonly T[]) => Promise<readonly T[]>;
  
  /**
   * Update items in collection
   * @param items - Items to update
   * @returns Updated items
   */
  update: (items: T | readonly T[]) => Promise<readonly T[]>;
  
  /**
   * Remove items from collection
   * @param ids - Item IDs to remove
   * @returns Removed item IDs
   */
  remove: (ids: string | readonly string[]) => Promise<readonly string[]>;
  
  /**
   * Clear all items from collection
   */
  clear: () => void;
}

/**
 * Creates a collection for managing items
 * @param config - Collection configuration
 * @returns Collection interface
 */
export const createCollection = <T extends CollectionItem>(
  config: CollectionConfig<T> = {}
): Collection<T> => {
  // Core state - minimized to only what's necessary
  const data = new Map<string, T>();
  const observers = new Set<CollectionObserver<T>>();
  
  // Query and sort state
  let queryFn: ((item: T) => boolean) | null = null;
  let sortFn: ((a: T, b: T) => number) | null = null;
  
  // Cache for filtered/sorted results
  let cache: readonly T[] | null = null;
  let cacheValid = false;
  
  // Status flags
  let loading = false;
  let error: Error | null = null;
  
  // Performance optimizations
  const handlers: CollectionObserver<T>[] = [];
  const eventObj = { event: COLLECTION_EVENTS.CHANGE as CollectionEvent, data: null as any };
  
  // Initialize functions with fallbacks
  const transform = config.transform || ((item: any) => item as T);
  const validate = config.validate || (() => true);
  
  // Use a function to share notification logic
  function notifyObservers(eventType: CollectionEvent, eventData: any): void {
    if (observers.size === 0) return;
    
    eventObj.event = eventType;
    eventObj.data = eventData;
    
    handlers.length = 0;
    observers.forEach(fn => handlers.push(fn));
    
    for (let i = 0; i < handlers.length; i++) {
      handlers[i](eventObj);
    }
  }
  
  // Optimized function to get items with filtering and sorting
  function getFilteredItems(): readonly T[] {
    // Return cache if valid
    if (cacheValid && cache !== null) {
      return cache;
    }
    
    // No filtering or sorting needed
    if (!queryFn && !sortFn) {
      const result = Array.from(data.values());
      cache = result;
      cacheValid = true;
      return result;
    }
    
    // Get all items as array
    const items = Array.from(data.values());
    let result = items;
    
    // Apply filtering if needed
    if (queryFn) {
      result = items.filter(queryFn);
    }
    
    // Apply sorting if needed
    if (sortFn) {
      result.sort(sortFn);
    }
    
    // Update cache and return
    cache = result;
    cacheValid = true;
    return result;
  }
  
  // Process multiple items efficiently
  function processItems(items: T | readonly T[]): T[] {
    if (!Array.isArray(items)) {
      // Single item case
      if (!validate(items)) return [];
      return [transform(items)];
    }
    
    // Empty array check
    if (items.length === 0) return [];
    
    // Process multiple items
    const result: T[] = [];
    for (let i = 0; i < items.length; i++) {
      if (validate(items[i])) {
        const transformed = transform(items[i]);
        if (transformed.id) {
          result.push(transformed);
        } else {
          throw new Error('Items must have an id property');
        }
      }
    }
    
    return result;
  }
  
  // Create and return the collection interface
  return {
    // Subscription management
    subscribe(observer) {
      observers.add(observer);
      return () => {
        observers.delete(observer);
      };
    },
    
    // Data access - readonly to prevent mutation
    getItems: getFilteredItems,
    
    getSize() {
      return data.size;
    },
    
    isLoading() {
      return loading;
    },
    
    getError() {
      return error;
    },
    
    // Query and sort methods
    query(newQueryFn) {
      queryFn = newQueryFn;
      cacheValid = false;
      notifyObservers(COLLECTION_EVENTS.CHANGE, getFilteredItems());
    },
    
    sort(newSortFn) {
      sortFn = newSortFn;
      cacheValid = false;
      notifyObservers(COLLECTION_EVENTS.CHANGE, getFilteredItems());
    },
    
    // Data modification methods
    async add(items) {
      try {
        loading = true;
        notifyObservers(COLLECTION_EVENTS.LOADING, true);
        
        // Process all items at once
        const processed = processItems(items);
        
        // Early return if no valid items
        if (processed.length === 0) {
          return processed;
        }
        
        // Add all items to the map
        for (let i = 0; i < processed.length; i++) {
          data.set(processed[i].id, processed[i]);
        }
        
        // Invalidate cache
        cacheValid = false;
        
        // Notify observers
        notifyObservers(COLLECTION_EVENTS.ADD, processed);
        notifyObservers(COLLECTION_EVENTS.CHANGE, getFilteredItems());
        
        return processed;
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        notifyObservers(COLLECTION_EVENTS.ERROR, error);
        throw error;
      } finally {
        loading = false;
        notifyObservers(COLLECTION_EVENTS.LOADING, false);
      }
    },
    
    async update(items) {
      try {
        loading = true;
        notifyObservers(COLLECTION_EVENTS.LOADING, true);
        
        // Convert to array if single item
        const itemsArray = Array.isArray(items) ? items : [items];
        
        // Early return if no items
        if (itemsArray.length === 0) {
          return [];
        }
        
        // Verify all items exist before updating
        for (let i = 0; i < itemsArray.length; i++) {
          if (!data.has(itemsArray[i].id)) {
            throw new Error(`Item with id ${itemsArray[i].id} not found`);
          }
        }
        
        // Process and update all items
        const processed = processItems(itemsArray);
        
        // Add to map
        for (let i = 0; i < processed.length; i++) {
          data.set(processed[i].id, processed[i]);
        }
        
        // Invalidate cache
        cacheValid = false;
        
        // Notify observers
        notifyObservers(COLLECTION_EVENTS.UPDATE, processed);
        notifyObservers(COLLECTION_EVENTS.CHANGE, getFilteredItems());
        
        return processed;
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        notifyObservers(COLLECTION_EVENTS.ERROR, error);
        throw error;
      } finally {
        loading = false;
        notifyObservers(COLLECTION_EVENTS.LOADING, false);
      }
    },
    
    async remove(ids) {
      try {
        loading = true;
        notifyObservers(COLLECTION_EVENTS.LOADING, true);
        
        // Convert to array if single id
        const idsArray = Array.isArray(ids) ? ids : [ids];
        
        // Early return if no ids
        if (idsArray.length === 0) {
          return [];
        }
        
        // Verify all ids exist
        for (let i = 0; i < idsArray.length; i++) {
          if (!data.has(idsArray[i])) {
            throw new Error(`Item with id ${idsArray[i]} not found`);
          }
        }
        
        // Remove all items
        for (let i = 0; i < idsArray.length; i++) {
          data.delete(idsArray[i]);
        }
        
        // Invalidate cache
        cacheValid = false;
        
        // Notify observers
        notifyObservers(COLLECTION_EVENTS.REMOVE, idsArray);
        notifyObservers(COLLECTION_EVENTS.CHANGE, getFilteredItems());
        
        return idsArray;
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        notifyObservers(COLLECTION_EVENTS.ERROR, error);
        throw error;
      } finally {
        loading = false;
        notifyObservers(COLLECTION_EVENTS.LOADING, false);
      }
    },
    
    clear() {
      // Clear data
      data.clear();
      
      // Reset state
      queryFn = null;
      sortFn = null;
      cache = null;
      cacheValid = false;
      
      // Notify observers
      notifyObservers(COLLECTION_EVENTS.CHANGE, []);
    }
  };
};