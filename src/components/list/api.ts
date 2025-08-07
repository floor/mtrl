// src/components/list/api.ts

/**
 * API configuration options for List component
 */
interface ApiOptions {
  list: {
    refresh: () => void;
    getItems: () => any[];
    getAllItems: () => any[];
    getVisibleItems: () => any[];
    scrollToItem: (
      itemId: string | number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => void;
    scrollToIndex: (
      index: number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => void;
    isLoading: () => boolean;
    hasNextPage: () => boolean;
  };
  selection: {
    getSelectedItems: () => any[];
    getSelectedItemIds: () => string[];
    isItemSelected: (itemId: string | number) => boolean;
    selectItem: (itemId: string | number) => any;
    deselectItem: (itemId: string | number) => any;
    clearSelection: () => any;
    setSelection: (itemIds: (string | number)[]) => any;
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
 * Enhances a List component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI =
  ({ list, selection, events, lifecycle, config }: ApiOptions) =>
  (component: ComponentWithElements) => ({
    ...component,
    element: component.element,

    /**
     * Refreshes the list display
     * @returns {Promise<Object>} Promise that resolves with component
     */
    refresh: async () => {
      list.refresh();
      return component;
    },

    /**
     * Gets all items in the list
     * @returns {Array} All items
     */
    getAllItems: () => list.getAllItems(),

    /**
     * Gets all visible items (same as getAllItems for rendered lists)
     * @returns {Array} Visible items
     */
    getVisibleItems: () => list.getVisibleItems(),

    /**
     * Scrolls to a specific item by ID
     * @param {string|number} itemId - Item ID to scroll to
     * @param {string} position - Position ('start', 'center', 'end')
     * @param {boolean} animate - Whether to animate the scroll
     * @returns {Object} Component instance for chaining
     */
    scrollToItem: (
      itemId: string | number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => {
      const shouldAnimate = animate !== undefined ? animate : config?.animate || false;
      list.scrollToItem(itemId, position, shouldAnimate);
      return component;
    },

    /**
     * Scrolls to a specific index
     * @param {number} index - Index to scroll to
     * @param {string} position - Position ('start', 'center', 'end')
     * @param {boolean} animate - Whether to animate the scroll
     * @returns {Promise<Object>} Promise that resolves when scroll is complete
     */
    scrollToIndex: async (
      index: number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) => {
      const shouldAnimate = animate !== undefined ? animate : config?.animate || false;
      list.scrollToIndex(index, position, shouldAnimate);
      return component;
    },

    /**
     * Checks if the list is currently loading (always false for rendered lists)
     * @returns {boolean} Always false
     */
    isLoading: () => list.isLoading(),

    /**
     * Checks if the list has more items to load (always false for rendered lists)
     * @returns {boolean} Always false
     */
    hasNextPage: () => list.hasNextPage(),

    /**
     * Gets the currently selected items
     * @returns {Array} Selected items
     */
    getSelectedItems: () => selection.getSelectedItems(),

    /**
     * Gets the IDs of currently selected items
     * @returns {Array} Selected item IDs
     */
    getSelectedItemIds: () => selection.getSelectedItemIds(),

    /**
     * Checks if an item is selected
     * @param {string|number} itemId - Item ID to check
     * @returns {boolean} True if item is selected
     */
    isItemSelected: (itemId: string | number) => selection.isItemSelected(itemId),

    /**
     * Selects an item
     * @param {string|number} itemId - Item ID to select
     * @returns {Object} Component instance for chaining
     */
    selectItem: (itemId: string | number) => {
      selection.selectItem(itemId);
      return component;
    },

    /**
     * Deselects an item
     * @param {string|number} itemId - Item ID to deselect
     * @returns {Object} Component instance for chaining
     */
    deselectItem: (itemId: string | number) => {
      selection.deselectItem(itemId);
      return component;
    },

    /**
     * Clears all selections
     * @returns {Object} Component instance for chaining
     */
    clearSelection: () => {
      selection.clearSelection();
      return component;
    },

    /**
     * Sets the selection to the specified item IDs
     * @param {Array} itemIds - Item IDs to select
     * @returns {Object} Component instance for chaining
     */
    setSelection: (itemIds: (string | number)[]) => {
      selection.setSelection(itemIds);
      return component;
    },

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