// src/components/list/api.js

/**
 * API configuration options for VirtualList component
 */
interface ApiOptions {
  list: {
    refresh: () => Promise<void>;
    loadNext: () => Promise<{ hasNext: boolean; items: any[] }>;
    loadPage: (
      pageNumber: number,
      options?: { preservePrevious?: boolean }
    ) => Promise<{ hasNext: boolean; items: any[] }>;
    loadPrevious: () => Promise<{ hasPrev: boolean; items: any[] }>;
    scrollNext: () => Promise<{ hasNext: boolean; items: any[] }>;
    scrollPrevious: () => Promise<{ hasNext: boolean; items: any[] }>;
    scrollToItem: (
      itemId: string,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => void;
    scrollToIndex: (
      index: number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => Promise<void>;
    scrollTo: (
      pageNumber: number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => Promise<void>;
    scrollToItemById: (
      itemId: string,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => Promise<void>;
    getVisibleItems: () => any[];
    getAllItems: () => any[];
    isLoading: () => boolean;
    hasNextPage: () => boolean;
    onCollectionChange: (
      callback: (event: { type: string; data: any }) => void
    ) => () => void;
    onPageChange: (callback: (event: any, data: any) => void) => () => void;
    getCurrentPage: () => number;
    getPageSize: () => number;
    getCollection: () => any;
    isApiMode: () => boolean;
  };
  events: {
    on: (event: string, handler: Function) => any;
    off: (event: string, handler: Function) => any;
  };
  lifecycle: {
    destroy: () => void;
  };
  config: {
    animate?: boolean;
  };
  // Added selection methods
  getSelectedItems?: () => any[];
  getSelectedItemIds?: () => string[];
  isItemSelected?: (itemId: string) => boolean;
  selectItem?: (itemId: string) => any;
  deselectItem?: (itemId: string) => any;
  clearSelection?: () => any;
  setSelection?: (itemIds: string[]) => any;
}

/**
 * Component with required elements and methods for API enhancement
 */
interface ComponentWithElements {
  element: HTMLElement;
  on?: (event: string, handler: Function) => any;
  off?: (event: string, handler: Function) => any;
}

/**
 * Enhances a VirtualList component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI =
  ({ list, events, lifecycle, config }: ApiOptions) =>
  (component: ComponentWithElements) => ({
    ...component,
    element: component.element,

    /**
     * Refreshes the list with the latest data
     * @returns {Promise<void>} Promise that resolves when refresh is complete
     */
    refresh: async () => {
      await list.refresh();
      return component;
    },

    /**
     * Loads next items
     * @returns {Promise<Object>} Promise with load result
     */
    loadNext: async () => {
      const result = await list.loadNext();
      return result;
    },

    /**
     * Loads a specific page (only works with page-based pagination)
     * @param {number} pageNumber - The page number to load (1-indexed)
     * @param {Object} options - Load options
     * @returns {Promise<Object>} Promise with load result
     */
    loadPage: async (
      pageNumber: number,
      options?: { preservePrevious?: boolean }
    ) => {
      const result = await list.loadPage(pageNumber, options);
      return result;
    },

    /**
     * Loads the previous page (only works with page-based pagination)
     * @returns {Promise<Object>} Promise with load result
     */
    loadPrevious: async () => {
      const result = await list.loadPrevious();
      return result;
    },

    /**
     * Scrolls to the next page and loads it if necessary
     * @returns {Promise<Object>} Promise with load result
     */
    scrollNext: async () => {
      const result = await list.scrollNext();
      return result;
    },

    /**
     * Scrolls to the previous page and loads it if necessary
     * @returns {Promise<Object>} Promise with load result
     */
    scrollPrevious: async () => {
      const result = await list.scrollPrevious();
      return result;
    },

    /**
     * Scrolls to a specific item by ID
     * @param {string} itemId - Item ID to scroll to
     * @param {string} position - Position ('start', 'center', 'end')
     * @param {boolean} animate - Whether to animate the scroll
     * @returns {Object} Component instance for chaining
     */
    scrollToItem: (
      itemId: string,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => {
      const shouldAnimate =
        animate !== undefined ? animate : config?.animate || false;
      list.scrollToItem(itemId, position, shouldAnimate);
      return component;
    },

    /**
     * Scrolls to a specific index
     * @param {number} index - Index to scroll to
     * @param {string} position - Position ('start', 'center', 'end')
     * @param {boolean} animate - Whether to animate the scroll
     * @returns {Promise<void>} Promise that resolves when scroll is complete
     */
    scrollToIndex: async (
      index: number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => {
      const shouldAnimate =
        animate !== undefined ? animate : config?.animate || false;
      await list.scrollToIndex(index, position, shouldAnimate);
      return component;
    },

    /**
     * Scrolls to a specific page with animation support (strategy-agnostic)
     * @param {number} pageNumber - Page number to scroll to (1-indexed)
     * @param {string} position - Position ('start', 'center', 'end')
     * @param {boolean} animate - Whether to animate the scroll
     * @returns {Promise<void>} Promise that resolves when scroll is complete
     */
    scrollTo: async (
      pageNumber: number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => {
      const shouldAnimate =
        animate !== undefined ? animate : config?.animate || false;

      // Get the configured page size from the list manager
      const pageSize = list.getPageSize();

      // Calculate the starting index of the page (0-based)
      // Page 1 starts at index 0, page 2 starts at pageSize, etc.
      const startIndex = (pageNumber - 1) * pageSize;

      await list.scrollToIndex(startIndex, position, shouldAnimate);
      return component;
    },

    /**
     * Scrolls to a specific item by ID using backend lookup
     * @param {string} itemId - Item ID to scroll to
     * @param {string} position - Position ('start', 'center', 'end')
     * @param {boolean} animate - Whether to animate the scroll
     * @returns {Promise<void>} Promise that resolves when scroll is complete
     */
    scrollToItemById: async (
      itemId: string,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => {
      const shouldAnimate =
        animate !== undefined ? animate : config?.animate || false;
      await list.scrollToItemById(itemId, position, shouldAnimate);
      return component;
    },

    /**
     * Gets all currently visible items
     * @returns {Array} Visible items
     */
    getVisibleItems: () => list.getVisibleItems(),

    /**
     * Gets all loaded items
     * @returns {Array} All loaded items
     */
    getAllItems: () => list.getAllItems(),

    /**
     * Checks if the list is currently loading
     * @returns {boolean} True if loading
     */
    isLoading: () => list.isLoading(),

    /**
     * Checks if the list has more items to load
     * @returns {boolean} True if has more items
     */
    hasNextPage: () => list.hasNextPage(),

    /**
     * Subscribe to collection change events
     * @param {Function} callback - Event callback function
     * @returns {Function} Unsubscribe function
     */
    onCollectionChange: (callback) => list.onCollectionChange(callback),

    /**
     * Subscribe to page change events
     * @param {Function} callback - Event callback function
     * @returns {Function} Unsubscribe function
     */
    onPageChange: (callback) => list.onPageChange(callback),

    /**
     * Get current page number based on scroll position
     * @returns {number} Current page number
     */
    getCurrentPage: () => list.getCurrentPage(),

    /**
     * Get the configured page size
     * @returns {number} Page size
     */
    getPageSize: () => list.getPageSize(),

    /**
     * Get the underlying collection
     * @returns {Object} Collection instance
     */
    getCollection: () => list.getCollection(),

    /**
     * Check if list is in API mode
     * @returns {boolean} True if using API mode
     */
    isApiMode: () => list.isApiMode(),

    /**
     * Adds an event listener to the list
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Object} Component instance for chaining
     */
    on: (event, handler) => {
      events.on(event, handler);
      return component;
    },

    /**
     * Removes an event listener from the list
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Object} Component instance for chaining
     */
    off: (event, handler) => {
      events.off(event, handler);
      return component;
    },

    /**
     * Destroys the component and cleans up resources
     */
    destroy: () => {
      lifecycle.destroy();
    },
  });

export default withAPI;
