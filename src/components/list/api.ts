// src/components/list/api.js

/**
 * API configuration options for VirtualList component
 */
interface ApiOptions {
  list: {
    refresh: () => Promise<void>;
    loadMore: () => Promise<{hasNext: boolean, items: any[]}>;
    scrollToItem: (itemId: string, position?: 'start' | 'center' | 'end') => void;
    getVisibleItems: () => any[];
    getAllItems: () => any[];
    isLoading: () => boolean;
    hasNextPage: () => boolean;
  };
  events: {
    on: (event: string, handler: Function) => any;
    off: (event: string, handler: Function) => any;
  };
  lifecycle: {
    destroy: () => void;
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
export const withAPI = ({ list, events, lifecycle }: ApiOptions) => 
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
     * Loads more items
     * @returns {Promise<Object>} Promise with load result
     */
    loadMore: async () => {
      const result = await list.loadMore();
      return result;
    },
    
    /**
     * Scrolls to a specific item by ID
     * @param {string} itemId - Item ID to scroll to
     * @param {string} position - Position ('start', 'center', 'end')
     * @returns {Object} Component instance for chaining
     */
    scrollToItem: (itemId: string, position: 'start' | 'center' | 'end' = 'start') => {
      list.scrollToItem(itemId, position);
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
    }
  });

export default withAPI;