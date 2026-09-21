// src/components/list/api.ts

/**
 * API configuration options for List component
 */
interface ApiOptions<T = unknown> {
  list: {
    refresh: () => void;
    getItems: () => T[];
    getAllItems: () => T[];
    getVisibleItems: () => T[];
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
    getSelectedItems: () => T[];
    getSelectedItemIds: () => string[];
    isItemSelected: (itemId: string | number) => boolean;
    selectItem: (itemId: string | number) => unknown;
    deselectItem: (itemId: string | number) => unknown;
    clearSelection: () => unknown;
    setSelection: (itemIds: (string | number)[]) => unknown;
  };
  events: {
    on: (event: string, handler: Function) => unknown;
    off: (event: string, handler: Function) => unknown;
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
export interface ComponentWithElements {
  element: HTMLElement;
  on?: (event: string, handler: Function) => unknown;
  off?: (event: string, handler: Function) => unknown;
}

/**
 * Enhances a List component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI =
  <T = unknown>({ list, selection, events, lifecycle, config }: ApiOptions<T>) =>
  (component: ComponentWithElements) => ({
    ...component,
    element: component.element,

    /**
     * Refreshes the list display
     * @returns {Promise<Object>} Promise that resolves with component
     */
    async refresh() {
      list.refresh();
      return this;
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
    scrollToItem(
      itemId: string | number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) {
      const shouldAnimate = animate !== undefined ? animate : config?.animate || false;
      list.scrollToItem(itemId, position, shouldAnimate);
      return this;
    },

    /**
     * Scrolls to a specific index
     * @param {number} index - Index to scroll to
     * @param {string} position - Position ('start', 'center', 'end')
     * @param {boolean} animate - Whether to animate the scroll
     * @returns {Promise<Object>} Promise that resolves when scroll is complete
     */
    async scrollToIndex(
      index: number,
      position?: "start" | "center" | "end",
      animate?: boolean
    ) {
      const shouldAnimate = animate !== undefined ? animate : config?.animate || false;
      list.scrollToIndex(index, position, shouldAnimate);
      return this;
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
    selectItem(itemId: string | number) {
      selection.selectItem(itemId);
      return this;
    },

    /**
     * Deselects an item
     * @param {string|number} itemId - Item ID to deselect
     * @returns {Object} Component instance for chaining
     */
    deselectItem(itemId: string | number) {
      selection.deselectItem(itemId);
      return this;
    },

    /**
     * Clears all selections
     * @returns {Object} Component instance for chaining
     */
    clearSelection() {
      selection.clearSelection();
      return this;
    },

    /**
     * Sets the selection to the specified item IDs
     * @param {Array} itemIds - Item IDs to select
     * @returns {Object} Component instance for chaining
     */
    setSelection(itemIds: (string | number)[]) {
      selection.setSelection(itemIds);
      return this;
    },

    /**
     * Adds an event listener to the list
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Object} Component instance for chaining
     */
    on(event: string, handler: (...args: never[]) => void) {
      events.on(event, handler);
      return this;
    },

    /**
     * Removes an event listener from the list
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {Object} Component instance for chaining
     */
    off(event: string, handler: (...args: never[]) => void) {
      events.off(event, handler);
      return this;
    },

    /**
     * Destroys the component and cleans up resources
     */
    destroy: () => {
      lifecycle.destroy();
    },
  });

export default withAPI;