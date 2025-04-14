// src/core/collection/list-manager.ts

import { createRouteAdapter, RouteAdapter, QueryDefinition } from './adapters/route';

/**
 * List item interface
 */
export interface ListItem {
  id: string;
  [key: string]: any;
}

/**
 * List with items setter
 */
export interface List {
  setItems: (items: any[]) => void;
}

/**
 * Metadata for pagination
 */
export interface PaginationMeta {
  cursor: string | null;
  hasNext: boolean;
}

/**
 * Response format from loadItems
 */
export interface LoadItemsResponse<T = any> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Load status callback data
 */
export interface LoadStatus<T = any> {
  loading: boolean;
  hasNext?: boolean;
  hasPrev?: boolean;
  items?: T[];
}

/**
 * Page loader configuration
 */
export interface PageLoaderConfig<T = any> {
  onLoad?: (status: LoadStatus<T>) => void;
  pageSize?: number;
}

/**
 * Page loader interface
 */
export interface PageLoader<T = any> {
  /**
   * Load a specific page by cursor
   * @param cursor - Cursor pointing to the page
   * @param addToHistory - Whether to add current cursor to history
   * @returns Page status
   */
  load: (cursor?: string | null, addToHistory?: boolean) => Promise<{
    hasNext: boolean;
    hasPrev: boolean;
  } | undefined>;

  /**
   * Load next page
   * @returns Page status
   */
  loadNext: () => Promise<{
    hasNext: boolean;
    hasPrev: boolean;
  } | undefined>;

  /**
   * Load previous page
   * @returns Page status
   */
  loadPrev: () => Promise<{
    hasNext: boolean;
    hasPrev: boolean;
  } | undefined>;

  /**
   * Current loading state
   */
  readonly loading: boolean;

  /**
   * Current cursor
   */
  readonly cursor: string | null;
}

/**
 * List manager config
 */
export interface ListManagerConfig<T = any> {
  /**
   * Transform function to convert API items to app format
   */
  transform?: (item: any) => T;
  
  /**
   * Base URL for API requests
   */
  baseUrl?: string;
}

/**
 * List manager interface
 */
export interface ListManager<T = any> {
  /**
   * Load items with optional parameters
   * @param params - Query parameters
   * @returns Loaded items with pagination metadata
   */
  loadItems: (params?: Record<string, any>) => Promise<LoadItemsResponse<T>>;
  
  /**
   * Create a page loader for the specified list
   * @param list - List to manage
   * @param config - Page loader configuration
   * @returns Page loader
   */
  createPageLoader: (list: List, config?: PageLoaderConfig<T>) => PageLoader<T>;
}

/**
 * Creates a list manager for a specific collection
 * @param collection - Collection name
 * @param config - Configuration options
 * @returns List manager methods
 */
export const createListManager = <T = any>(
  collection: string, 
  config: ListManagerConfig<T> = {}
): ListManager<T> => {
  const {
    transform = (item: any) => item as T,
    baseUrl = 'http://localhost:4000/api'
  } = config;

  // Initialize route adapter
  const adapter: RouteAdapter = createRouteAdapter({
    base: baseUrl,
    endpoints: {
      list: `/${collection}`
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });

  /**
   * Load items with cursor pagination
   * @param params - Query parameters
   * @returns Loaded items with pagination metadata
   */
  const loadItems = async (params: Record<string, any> = {}): Promise<LoadItemsResponse<T>> => {
    try {
      const response = await adapter.read(params as QueryDefinition);

      return {
        items: response.items.map(transform),
        meta: response.meta as PaginationMeta
      };
    } catch (error) {
      console.error(`Error loading ${collection}:`, error);
      return {
        items: [],
        meta: {
          cursor: null,
          hasNext: false
        }
      };
    }
  };

  /**
   * Create a page loader for the specified list
   * @param list - List to manage
   * @param config - Page loader configuration
   * @returns Page loader
   */
  const createPageLoader = (
    list: List, 
    { onLoad, pageSize = 20 }: PageLoaderConfig<T> = {}
  ): PageLoader<T> => {
    let currentCursor: string | null = null;
    let loading = false;
    const pageHistory: Array<string | null> = [];

    /**
     * Load a specific page by cursor
     * @param cursor - Cursor pointing to the page
     * @param addToHistory - Whether to add current cursor to history
     * @returns Page status
     */
    const load = async (
      cursor: string | null = null, 
      addToHistory = true
    ): Promise<{ hasNext: boolean; hasPrev: boolean } | undefined> => {
      if (loading) return;

      loading = true;
      onLoad?.({ loading: true });

      const { items, meta } = await loadItems({
        limit: pageSize,
        cursor
      });

      if (addToHistory && cursor) {
        pageHistory.push(currentCursor);
      }
      currentCursor = meta.cursor;

      list.setItems(items);
      loading = false;

      const status = {
        loading: false,
        hasNext: meta.hasNext,
        hasPrev: pageHistory.length > 0,
        items
      };
      
      onLoad?.(status);

      return {
        hasNext: meta.hasNext,
        hasPrev: pageHistory.length > 0
      };
    };

    /**
     * Load next page
     * @returns Page status
     */
    const loadNext = (): Promise<{ hasNext: boolean; hasPrev: boolean } | undefined> => 
      load(currentCursor);

    /**
     * Load previous page
     * @returns Page status
     */
    const loadPrev = (): Promise<{ hasNext: boolean; hasPrev: boolean } | undefined> => {
      const previousCursor = pageHistory.pop();
      return load(previousCursor, false);
    };

    return {
      load,
      loadNext,
      loadPrev,
      get loading(): boolean { return loading; },
      get cursor(): string | null { return currentCursor; }
    };
  };

  return {
    loadItems,
    createPageLoader
  };
};

/**
 * Transform functions for common collections
 */
export const transforms = {
  /**
   * Transform track data
   * @param track - Raw track data
   * @returns Formatted track data
   */
  track: (track: any): ListItem => ({
    id: track._id,
    headline: track.title || 'Untitled',
    supportingText: track.artist || 'Unknown Artist',
    meta: track.year?.toString() || ''
  }),

  /**
   * Transform playlist data
   * @param playlist - Raw playlist data
   * @returns Formatted playlist data
   */
  playlist: (playlist: any): ListItem => ({
    id: playlist._id,
    headline: playlist.name || 'Untitled Playlist',
    supportingText: `${playlist.tracks?.length || 0} tracks`,
    meta: playlist.creator || ''
  }),

  /**
   * Transform country data
   * @param country - Raw country data
   * @returns Formatted country data
   */
  country: (country: any): ListItem => ({
    id: country._id,
    headline: country.name || country.code,
    supportingText: country.continent || '',
    meta: country.code || ''
  })
};

/**
 * Usage example:
 *
 * const trackManager = createListManager<TrackItem>('track', {
 *   transform: transforms.track
 * });
 *
 * const loader = trackManager.createPageLoader(list, {
 *   onLoad: ({ loading, hasNext, items }) => {
 *     updateNavigation({ loading, hasNext });
 *     logEvent(`Loaded ${items.length} tracks`);
 *   }
 * });
 *
 * // Initial load
 * await loader.load();
 *
 * // Navigation
 * nextButton.onclick = () => loader.loadNext();
 * prevButton.onclick = () => loader.loadPrev();
 */