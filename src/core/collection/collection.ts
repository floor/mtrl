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
export type CollectionEvent = keyof typeof COLLECTION_EVENTS;

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
}

/**
 * Base Collection class providing data management interface
 * @template T - Type of items in collection
 */
export class Collection<T extends CollectionItem> {
  #items = new Map<string, T>();
  #observers = new Set<CollectionObserver<T>>();
  #query: ((item: T) => boolean) | null = null;
  #sort: ((a: T, b: T) => number) | null = null;
  #loading = false;
  #error: Error | null = null;

  /**
   * Transform function for items
   */
  transform: (item: any) => T;
  
  /**
   * Validation function for items
   */
  validate: (item: any) => boolean;

  /**
   * Creates a new collection instance
   * @param config - Collection configuration
   */
  constructor(config: CollectionConfig<T> = {}) {
    this.transform = config.transform || ((item: any) => item as T);
    this.validate = config.validate || (() => true);
  }

  /**
   * Subscribe to collection changes
   * @param observer - Observer callback
   * @returns Unsubscribe function
   */
  subscribe(observer: CollectionObserver<T>): () => void {
    this.#observers.add(observer);
    return () => this.#observers.delete(observer);
  }

  /**
   * Notify observers of collection changes
   * @param event - Event type
   * @param data - Event data
   */
  #notify(event: CollectionEvent, data: any): void {
    this.#observers.forEach(observer => observer({ event, data }));
  }

  /**
   * Set loading state
   * @param loading - Loading state
   */
  #setLoading(loading: boolean): void {
    this.#loading = loading;
    this.#notify(COLLECTION_EVENTS.LOADING, loading);
  }

  /**
   * Set error state
   * @param error - Error object
   */
  #setError(error: Error): void {
    this.#error = error;
    this.#notify(COLLECTION_EVENTS.ERROR, error);
  }

  /**
   * Get collection items based on current query and sort
   * @returns Collection items
   */
  get items(): T[] {
    let result = Array.from(this.#items.values());

    if (this.#query) {
      result = result.filter(this.#query);
    }

    if (this.#sort) {
      result.sort(this.#sort);
    }

    return result;
  }

  /**
   * Get collection size
   * @returns Number of items
   */
  get size(): number {
    return this.#items.size;
  }

  /**
   * Get loading state
   * @returns Loading state
   */
  get loading(): boolean {
    return this.#loading;
  }

  /**
   * Get error state
   * @returns Error object
   */
  get error(): Error | null {
    return this.#error;
  }

  /**
   * Set query filter
   * @param queryFn - Query function
   */
  query(queryFn: (item: T) => boolean): void {
    this.#query = queryFn;
    this.#notify(COLLECTION_EVENTS.CHANGE, this.items);
  }

  /**
   * Set sort function
   * @param sortFn - Sort function
   */
  sort(sortFn: (a: T, b: T) => number): void {
    this.#sort = sortFn;
    this.#notify(COLLECTION_EVENTS.CHANGE, this.items);
  }

  /**
   * Add items to collection
   * @param items - Items to add
   * @returns Added items
   */
  async add(items: T | T[]): Promise<T[]> {
    try {
      this.#setLoading(true);
      const toAdd = Array.isArray(items) ? items : [items];

      const validated = toAdd.filter(this.validate);
      const transformed = validated.map(this.transform);

      transformed.forEach(item => {
        if (!item.id) {
          throw new Error('Items must have an id property');
        }
        this.#items.set(item.id, item);
      });

      this.#notify(COLLECTION_EVENTS.ADD, transformed);
      this.#notify(COLLECTION_EVENTS.CHANGE, this.items);

      return transformed;
    } catch (error) {
      this.#setError(error as Error);
      throw error;
    } finally {
      this.#setLoading(false);
    }
  }

  /**
   * Update items in collection
   * @param items - Items to update
   * @returns Updated items
   */
  async update(items: T | T[]): Promise<T[]> {
    try {
      this.#setLoading(true);
      const toUpdate = Array.isArray(items) ? items : [items];

      const updated = toUpdate.map(item => {
        if (!this.#items.has(item.id)) {
          throw new Error(`Item with id ${item.id} not found`);
        }

        const validated = this.validate(item);
        if (!validated) {
          throw new Error(`Invalid item: ${item.id}`);
        }

        const transformed = this.transform(item);
        this.#items.set(item.id, transformed);
        return transformed;
      });

      this.#notify(COLLECTION_EVENTS.UPDATE, updated);
      this.#notify(COLLECTION_EVENTS.CHANGE, this.items);

      return updated;
    } catch (error) {
      this.#setError(error as Error);
      throw error;
    } finally {
      this.#setLoading(false);
    }
  }

  /**
   * Remove items from collection
   * @param ids - Item IDs to remove
   * @returns Removed item IDs
   */
  async remove(ids: string | string[]): Promise<string[]> {
    try {
      this.#setLoading(true);
      const toRemove = Array.isArray(ids) ? ids : [ids];

      toRemove.forEach(id => {
        if (!this.#items.has(id)) {
          throw new Error(`Item with id ${id} not found`);
        }
        this.#items.delete(id);
      });

      this.#notify(COLLECTION_EVENTS.REMOVE, toRemove);
      this.#notify(COLLECTION_EVENTS.CHANGE, this.items);

      return toRemove;
    } catch (error) {
      this.#setError(error as Error);
      throw error;
    } finally {
      this.#setLoading(false);
    }
  }

  /**
   * Clear all items from collection
   */
  clear(): void {
    this.#items.clear();
    this.#query = null;
    this.#sort = null;
    this.#notify(COLLECTION_EVENTS.CHANGE, this.items);
  }
}