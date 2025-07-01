// src/components/list/types.ts

/**
 * Configuration for the List component
 * @interface ListConfig
 */
export interface ListConfig {
  /**
   * Collection name to fetch data from
   * @default 'items'
   */
  collection?: string;

  /**
   * Transform function for API items
   * @param {any} item - Raw item from API
   * @returns {any} Transformed item
   */
  transform?: (item: any) => any;

  /**
   * Base URL for API requests
   * @default 'http://localhost:4000/api'
   */
  baseUrl?: string;

  /**
   * Static array of items to display
   * @default []
   */
  items?: any[];

  /**
   * Default height for items in pixels
   * This is used for calculation before actual measurement
   * @default 48
   */
  itemHeight?: number;

  /**
   * Number of items to fetch per page
   * @default 20
   */
  pageSize?: number;

  /**
   * Number of extra items to render above/below viewport
   * Higher values reduce blank spaces during fast scrolling but impact performance
   * @default 5
   */
  renderBufferSize?: number;

  /**
   * Function to render an item
   * @param {any} item - Item to render
   * @param {number} index - Item index in the list
   * @returns {HTMLElement} Rendered DOM element
   */
  renderItem: (item: any, index: number) => HTMLElement;

  /**
   * Callback when items are loaded
   * @param {Object} data - Load result data
   */
  afterLoad?: (data: LoadResult) => void;

  /**
   * Whether to track item selection
   * When true, clicked items will receive a selected class
   * @default true
   */
  trackSelection?: boolean;

  /**
   * Whether to allow multiple item selection
   * @default false
   */
  multiSelect?: boolean;

  /**
   * Initial selection state (array of item IDs)
   */
  initialSelection?: string[];

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Additional CSS classes
   */
  class?: string;

  /**
   * Default animation behavior for scroll operations
   * When true, scroll operations will be animated by default
   * @default false
   */
  animate?: boolean;
}

/**
 * Result of a load operation
 * @interface LoadResult
 */
export interface LoadResult {
  /**
   * Whether the list is currently loading
   */
  loading: boolean;

  /**
   * Whether there are more items to load
   */
  hasNext: boolean;

  /**
   * Whether there are previous items (if paginating)
   */
  hasPrev: boolean;

  /**
   * Newly loaded items
   */
  items: any[];

  /**
   * All loaded items
   */
  allItems: any[];
}

/**
 * Selection event data
 * @interface SelectEvent
 */
export interface SelectEvent {
  /**
   * Selected item data
   */
  item: any;

  /**
   * DOM element for the selected item
   */
  element: HTMLElement;

  /**
   * Original DOM event
   */
  originalEvent: Event;

  /**
   * Component instance
   */
  component: ListComponent;

  /**
   * Prevent default behavior
   */
  preventDefault: () => void;

  /**
   * Whether default was prevented
   */
  defaultPrevented: boolean;
}

/**
 * Load event data
 * @interface LoadEvent
 */
export interface LoadEvent extends LoadResult {
  /**
   * Component instance
   */
  component: VirtualListComponent;

  /**
   * Prevent default behavior
   */
  preventDefault: () => void;

  /**
   * Whether default was prevented
   */
  defaultPrevented: boolean;
}

/**
 * Virtual List component interface - enhanced list with virtual scrolling
 * @interface VirtualListComponent
 */
export interface VirtualListComponent extends ListComponent {
  /**
   * Updates the virtual scroll parameters
   * @returns {VirtualListComponent} Component instance for chaining
   */
  updateScrollParams?: () => VirtualListComponent;

  /**
   * Gets the scroll position
   * @returns {number} Current scroll position
   */
  getScrollTop?: () => number;

  /**
   * Sets the scroll position
   * @param {number} scrollTop - Scroll position to set
   * @returns {VirtualListComponent} Component instance for chaining
   */
  setScrollTop?: (scrollTop: number) => VirtualListComponent;
}

/**
 * List component interface
 * @interface ListComponent
 */
export interface ListComponent {
  /**
   * Component's root DOM element
   */
  element: HTMLElement;

  /**
   * Refreshes the list with the latest data
   * @returns {Promise<VirtualListComponent>} Promise that resolves with component
   */
  refresh: () => Promise<VirtualListComponent>;

  /**
   * Loads more items
   * @returns {Promise<{hasNext: boolean, items: any[]}>} Promise with load result
   */
  loadMore: () => Promise<{ hasNext: boolean; items: any[] }>;

  /**
   * Loads a specific page (only works with page-based pagination)
   * @param {number} pageNumber - The page number to load (1-indexed)
   * @param {Object} options - Load options
   * @returns {Promise<{hasNext: boolean, items: any[]}>} Promise with load result
   */
  loadPage: (
    pageNumber: number,
    options?: { preservePrevious?: boolean }
  ) => Promise<{ hasNext: boolean; items: any[] }>;

  /**
   * Loads the previous page (only works with page-based pagination)
   * @returns {Promise<{hasPrev: boolean, items: any[]}>} Promise with load result
   */
  loadPreviousPage: () => Promise<{ hasPrev: boolean; items: any[] }>;

  /**
   * Scrolls to the next page and loads it if necessary
   * @returns {Promise<{hasNext: boolean, items: any[]}>} Promise with load result
   */
  scrollNext: () => Promise<{ hasNext: boolean; items: any[] }>;

  /**
   * Scrolls to the previous page and loads it if necessary
   * @returns {Promise<{hasPrev: boolean, items: any[]}>} Promise with load result
   */
  scrollPrevious: () => Promise<{ hasPrev: boolean; items: any[] }>;

  /**
   * Scrolls to a specific item by ID
   * @param {string} itemId - Item ID to scroll to
   * @param {string} position - Position ('start', 'center', 'end')
   * @param {boolean} animate - Whether to animate the scroll
   * @returns {VirtualListComponent} Component instance for chaining
   */
  scrollToItem: (
    itemId: string,
    position?: "start" | "center" | "end",
    animate?: boolean
  ) => VirtualListComponent;

  /**
   * Scroll to a specific index in the list
   * @param {number} index - Index to scroll to (0-based)
   * @param {string} position - Position ('start', 'center', 'end')
   * @param {boolean} animate - Whether to animate the scroll
   * @returns {Promise<VirtualListComponent>} Promise that resolves when scroll is complete
   */
  scrollToIndex: (
    index: number,
    position?: "start" | "center" | "end",
    animate?: boolean
  ) => Promise<VirtualListComponent>;

  /**
   * Scroll to a specific page with animation support
   * @param {number} pageNumber - Page number to scroll to (1-indexed)
   * @param {string} position - Position ('start', 'center', 'end')
   * @param {boolean} animate - Whether to animate the scroll
   * @returns {Promise<VirtualListComponent>} Promise that resolves when scroll is complete
   */
  scrollToPage: (
    pageNumber: number,
    position?: "start" | "center" | "end",
    animate?: boolean
  ) => Promise<VirtualListComponent>;

  /**
   * Scroll to a specific item by ID using backend lookup
   * @param {string} itemId - Item ID to scroll to
   * @param {string} position - Position ('start', 'center', 'end')
   * @param {boolean} animate - Whether to animate the scroll
   * @returns {Promise<VirtualListComponent>} Promise that resolves when scroll is complete
   */
  scrollToItemById: (
    itemId: string,
    position?: "start" | "center" | "end",
    animate?: boolean
  ) => Promise<VirtualListComponent>;

  /**
   * Gets all currently visible items
   * @returns {any[]} Visible items
   */
  getVisibleItems: () => any[];

  /**
   * Gets all loaded items
   * @returns {any[]} All loaded items
   */
  getAllItems: () => any[];

  /**
   * Gets the configured page size
   * @returns {number} Page size
   */
  getPageSize: () => number;

  /**
   * Checks if the list is currently loading
   * @returns {boolean} True if loading
   */
  isLoading: () => boolean;

  /**
   * Checks if the list has more items to load
   * @returns {boolean} True if has more items
   */
  hasNextPage: () => boolean;

  /**
   * Gets the currently selected items
   * @returns {any[]} Selected items
   */
  getSelectedItems: () => any[];

  /**
   * Gets the IDs of currently selected items
   * @returns {string[]} Selected item IDs
   */
  getSelectedItemIds: () => string[];

  /**
   * Checks if an item is selected
   * @param {string} itemId - Item ID to check
   * @returns {boolean} True if item is selected
   */
  isItemSelected: (itemId: string) => boolean;

  /**
   * Selects an item
   * @param {string} itemId - Item ID to select
   * @returns {ListComponent} Component instance for chaining
   */
  selectItem: (itemId: string) => ListComponent;

  /**
   * Deselects an item
   * @param {string} itemId - Item ID to deselect
   * @returns {ListComponent} Component instance for chaining
   */
  deselectItem: (itemId: string) => ListComponent;

  /**
   * Clears all selections
   * @returns {ListComponent} Component instance for chaining
   */
  clearSelection: () => ListComponent;

  /**
   * Sets the selection to the specified item IDs
   * @param {string[]} itemIds - Item IDs to select
   * @returns {ListComponent} Component instance for chaining
   */
  setSelection: (itemIds: string[]) => ListComponent;

  /**
   * Adds an event listener to the list
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {ListComponent} Component instance for chaining
   */
  on: <T extends keyof ListEvents>(
    event: T,
    handler: ListEvents[T]
  ) => ListComponent;

  /**
   * Removes an event listener from the list
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {ListComponent} Component instance for chaining
   */
  off: <T extends keyof ListEvents>(
    event: T,
    handler: ListEvents[T]
  ) => ListComponent;

  /**
   * Destroys the component and cleans up resources
   */
  destroy: () => void;
}

/**
 * Event handlers for List
 * @interface ListEvents
 */
export interface ListEvents {
  select: (event: SelectEvent) => void;
  load: (event: LoadEvent) => void;
  scroll: (event: {
    originalEvent: Event;
    component: VirtualListComponent;
  }) => void;
}
