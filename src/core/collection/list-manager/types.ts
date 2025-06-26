// src/core/collection/list-manager/types.ts
import { Collection } from "../collection";

/**
 * Load parameters for API requests
 */
export interface LoadParams {
  page?: number;
  cursor?: string;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

/**
 * Configuration for list manager
 */
export interface ListManagerConfig {
  /**
   * Transform function for items
   */
  transform?: (item: any) => any;

  /**
   * Base URL for API requests
   */
  baseUrl?: string | null;

  /**
   * Function to render an item
   */
  renderItem: (
    item: any,
    index: number,
    recycledElement?: HTMLElement
  ) => HTMLElement;

  /**
   * Callback after load operations
   */
  afterLoad?: (result: LoadStatus) => void;

  /**
   * Items for static mode
   */
  staticItems?: any[] | null;

  /**
   * Number of extra items to render outside viewport
   */
  renderBufferSize?: number;

  /**
   * Number of items to keep in DOM but invisible
   */
  overscanCount?: number;

  /**
   * Number of items to render outside viewport for smooth scrolling
   * @default 3
   */
  overscan?: number;

  /**
   * Default height for items
   */
  itemHeight?: number;

  /**
   * Whether items can have varying heights
   * When false (default), all items use the same height for better performance
   * When true, each item's height is measured individually
   */
  dynamicItemSize?: boolean;

  /**
   * Whether to measure initial items
   */
  measureItemsInitially?: boolean;

  /**
   * Number of items per page
   */
  pageSize?: number;

  /**
   * Threshold for loading more (0.0-1.0)
   */
  loadThreshold?: number;

  /**
   * Throttle time for scroll events (ms)
   */
  throttleMs?: number;

  /**
   * Whether to deduplicate items by ID
   */
  dedupeItems?: boolean;

  /**
   * Scroll detection strategy
   */
  scrollStrategy?: ScrollStrategy;

  /**
   * Legacy support for static items
   */
  items?: any[];

  /**
   * Collection name
   */
  collection?: string;

  /**
   * Pagination configuration
   */
  pagination?: {
    /**
     * Pagination strategy to use ('cursor', 'page', or 'offset')
     * @default 'cursor'
     */
    strategy?: "cursor" | "page" | "offset";

    /**
     * Parameter name for page size (for page-based pagination)
     * @default 'per_page'
     */
    perPageParamName?: string;

    /**
     * Parameter name for limit (for cursor/offset pagination)
     * @default 'limit'
     */
    limitParamName?: string;
  };
}

/**
 * Scroll tracking strategies
 */
export type ScrollStrategy = "scroll" | "intersection" | "hybrid";

/**
 * Page change events
 */
export const PAGE_EVENTS = {
  PAGE_CHANGE: "page-change",
  SCROLL_PAGE_CHANGE: "scroll-page-change",
} as const;

export type PageEvent = (typeof PAGE_EVENTS)[keyof typeof PAGE_EVENTS];

export interface PageChangeEventData {
  page: number;
  previousPage?: number;
  scrollPosition: number;
  totalPages?: number;
  trigger: "navigation" | "scroll";
}

/**
 * List manager interface
 */
export interface ListManager {
  /**
   * Loads items from API or static data
   */
  loadItems: (params?: any) => Promise<{ items: any[]; meta: PaginationMeta }>;

  /**
   * Loads next page/items
   */
  loadNext: () => Promise<{ hasNext: boolean; items: any[] }>;

  /**
   * Refreshes the list
   */
  refresh: () => Promise<void>;

  /**
   * Loads a specific page (only works with page-based pagination)
   */
  loadPage: (
    pageNumber: number,
    options?: { preservePrevious?: boolean }
  ) => Promise<{ hasNext: boolean; items: any[] }>;

  /**
   * Loads the previous page (only works with page-based pagination)
   */
  loadPreviousPage: () => Promise<{ hasPrev: boolean; items: any[] }>;

  /**
   * Scrolls to the next page and loads it if necessary
   */
  scrollNext: () => Promise<{ hasNext: boolean; items: any[] }>;

  /**
   * Scrolls to the previous page and loads it if necessary
   */
  scrollPrevious: () => Promise<{ hasPrev: boolean; items: any[] }>;

  /**
   * Updates visible items based on scroll position
   */
  updateVisibleItems: (scrollTop?: number) => void;

  /**
   * Scrolls to a specific item by ID
   */
  scrollToItem: (itemId: string, position?: ScrollToPosition) => void;

  /**
   * Sets custom heights for items
   */
  setItemHeights: (heightsMap: Record<string, number>) => boolean;

  /**
   * Subscribe to page change events
   */
  onPageChange: (
    callback: (event: PageEvent, data: PageChangeEventData) => void
  ) => () => void;

  /**
   * Subscribe to collection change events
   */
  onCollectionChange: (
    callback: (event: { type: string; data: any }) => void
  ) => () => void;

  /**
   * Get current page number based on scroll position
   */
  getCurrentPage: () => number;

  /**
   * Gets the underlying collection
   */
  getCollection: () => Collection<any>;

  /**
   * Gets currently visible items
   */
  getVisibleItems: () => any[];

  /**
   * Gets all items
   */
  getAllItems: () => any[];

  /**
   * Checks if list is loading
   */
  isLoading: () => boolean;

  /**
   * Checks if there are more items to load
   */
  hasNextPage: () => boolean;

  /**
   * Checks if list is in API mode
   */
  isApiMode: () => boolean;

  /**
   * Sets a hook function for rendering
   */
  setRenderHook?: (hookFn: (item: any, element: HTMLElement) => void) => void;

  /**
   * Destroys the list manager
   */
  destroy: () => void;
}

/**
 * Position for scrolling to an item
 */
export type ScrollToPosition = "start" | "center" | "end";

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  cursor: string | null;
  hasNext: boolean;
  total?: number;
}

/**
 * Load operation status
 */
export interface LoadStatus {
  loading: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  items: any[];
  allItems: any[];
}

/**
 * List interface
 */
export interface List {
  component: HTMLElement;
  items: any[];
  setItems: (items: any[]) => void;
}

/**
 * Page loader configuration
 */
export interface PageLoaderConfig {
  onLoad?: (status: LoadStatus) => void;
  pageSize?: number;
}

/**
 * Page loader interface
 */
export interface PageLoader {
  load: (
    cursor?: string | null,
    addToHistory?: boolean
  ) => Promise<{ hasNext: boolean; hasPrev: boolean }>;
  loadNext: () => Promise<{ hasNext: boolean; hasPrev: boolean }>;
  loadPrev: () => Promise<{ hasNext: boolean; hasPrev: boolean }>;
  loading: boolean;
  cursor: string | null;
}

/**
 * Item interface
 */
export interface ListItem {
  id: string;
  headline: string;
  supportingText: string;
  meta: string;
}

/**
 * Internal list manager state
 */
/**
 * Internal list manager state
 */
export interface ListManagerState {
  /**
   * All items
   */
  items: any[];

  /**
   * Currently visible items
   */
  visibleItems: any[];

  /**
   * Visible range indices
   */
  visibleRange: { start: number; end: number };

  /**
   * Total height of all items
   */
  totalHeight: number;

  /**
   * Whether total height needs recalculation
   */
  totalHeightDirty: boolean;

  /**
   * Map of item heights (legacy - use itemMeasurement)
   */
  itemHeights: Map<string, number>;

  /**
   * Whether list is currently loading
   */
  loading: boolean;

  /**
   * Current pagination cursor
   */
  cursor: string | null;

  /**
   * Current page number (when using page-based pagination)
   */
  page?: number;

  /**
   * Pagination strategy being used
   */
  paginationStrategy?: string;

  /**
   * Whether there are more items to load
   */
  hasNext: boolean;

  /**
   * Map of item elements for DOM recycling
   */
  itemElements: Map<string, HTMLElement>;

  /**
   * Current scroll position
   */
  scrollTop: number;

  /**
   * Container height
   */
  containerHeight: number;

  /**
   * RequestAnimationFrame ID for scroll updates
   */
  scrollRAF: number | null;

  /**
   * RequestAnimationFrame ID for resize updates
   */
  resizeRAF: number | null;

  /**
   * Whether component is mounted
   */
  mounted: boolean;

  /**
   * Total item count (may differ from items.length)
   */
  itemCount: number;

  /**
   * Whether list is in static mode
   */
  useStatic: boolean;

  /**
   * Custom render hook function
   */
  renderHook: ((item: any, element: HTMLElement) => void) | null;
}

/**
 * DOM elements used by the list manager
 */
export interface ListManagerElements {
  /**
   * Container element
   */
  container: HTMLElement;

  /**
   * Content container element
   */
  content: HTMLElement;

  /**
   * Spacer element for scroll height
   */
  spacer: HTMLElement;

  /**
   * Top sentinel for intersection detection
   */
  topSentinel?: HTMLElement | null;

  /**
   * Bottom sentinel for intersection detection
   */
  bottomSentinel?: HTMLElement | null;
}

/**
 * Visible range calculation result
 */
export interface VisibleRange {
  /**
   * Start index
   */
  start: number;

  /**
   * End index
   */
  end: number;
}
