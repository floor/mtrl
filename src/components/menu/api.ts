// src/components/menu/api.ts
import { ApiOptions, BaseComponent, MenuComponent, MenuItemConfig, MenuPositionConfig } from './types';

/**
 * Enhances a menu component with public API methods
 * 
 * This is a higher-order function that wraps a base component and exposes
 * a standardized public API following the MenuComponent interface. It ensures
 * all methods return the component instance for method chaining and handles
 * proper resource cleanup during component destruction.
 * 
 * @param {ApiOptions} options - API configuration including lifecycle methods
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal
 * @category Components
 */
export const withAPI = ({ lifecycle }: ApiOptions) => 
  (component: BaseComponent): MenuComponent => ({
    ...component as any,
    element: component.element,

    /**
     * Shows the menu
     * 
     * Makes the menu visible in the DOM. This method triggers the 'open' event.
     * If called when the menu is already visible, it has no effect.
     * 
     * @returns {MenuComponent} Component instance for method chaining
     * @example
     * ```typescript
     * // Show a menu
     * menu.show();
     * 
     * // Position and show a menu in one chain
     * menu.position(buttonElement).show();
     * ```
     */
    show(): MenuComponent {
      component.show?.();
      return this;
    },

    /**
     * Hides the menu
     * 
     * Makes the menu invisible in the DOM. This method triggers the 'close' event.
     * If called when the menu is already hidden, it has no effect.
     * 
     * @returns {MenuComponent} Component instance for method chaining
     * @example
     * ```typescript
     * // Hide a menu
     * menu.hide();
     * 
     * // Listen for clicks outside the menu to hide it
     * document.addEventListener('click', (event) => {
     *   if (menu.isVisible() && !menu.element.contains(event.target)) {
     *     menu.hide();
     *   }
     * });
     * ```
     */
    hide(): MenuComponent {
      component.hide?.();
      return this;
    },

    /**
     * Positions the menu relative to a target element
     * 
     * Calculates and sets the position of the menu relative to the specified target element.
     * This allows precise control over menu placement in the UI.
     * 
     * @param {HTMLElement} target - Target element to position against
     * @param {MenuPositionConfig} options - Position configuration
     * @returns {MenuComponent} Component instance for method chaining
     * @example
     * ```typescript
     * // Position relative to a button with default alignment (left, bottom)
     * menu.position(document.getElementById('menuButton'));
     * 
     * // Position with custom alignment
     * menu.position(buttonElement, {
     *   align: 'right',    // Align to the right edge of the target
     *   vAlign: 'top',     // Position above the target
     *   offsetX: 5,        // Add 5px horizontal offset
     *   offsetY: 10        // Add 10px vertical offset
     * });
     * ```
     */
    position(target: HTMLElement, options?: MenuPositionConfig): MenuComponent {
      component.position?.(target, options);
      return this;
    },

    /**
     * Adds an item to the menu
     * 
     * Dynamically adds a new item to the menu. This can be called at any time,
     * even after the menu has been rendered and shown.
     * 
     * @param {MenuItemConfig} config - Item configuration
     * @returns {MenuComponent} Component instance for method chaining
     * @example
     * ```typescript
     * // Add a standard item
     * menu.addItem({ name: 'edit', text: 'Edit' });
     * 
     * // Add a divider
     * menu.addItem({ type: 'divider' });
     * 
     * // Add a disabled item
     * menu.addItem({ name: 'print', text: 'Print', disabled: true });
     * 
     * // Add an item with a submenu
     * menu.addItem({
     *   name: 'share',
     *   text: 'Share',
     *   items: [
     *     { name: 'email', text: 'Email' },
     *     { name: 'link', text: 'Copy Link' }
     *   ]
     * });
     * ```
     */
    addItem(config: MenuItemConfig): MenuComponent {
      component.addItem?.(config);
      return this;
    },

    /**
     * Removes an item from the menu
     * 
     * Dynamically removes an item from the menu by its name identifier.
     * If the item doesn't exist, no action is taken.
     * 
     * @param {string} name - Name identifier of the item to remove
     * @returns {MenuComponent} Component instance for method chaining
     * @example
     * ```typescript
     * // Remove an item by name
     * menu.removeItem('delete');
     * 
     * // Check if a condition is met, then remove an item
     * if (!userHasEditPermission) {
     *   menu.removeItem('edit');
     * }
     * ```
     */
    removeItem(name: string): MenuComponent {
      component.removeItem?.(name);
      return this;
    },

    /**
     * Gets all registered menu items
     * 
     * Returns a Map containing all the current menu items, indexed by their name.
     * Each entry contains the item's DOM element and configuration.
     * 
     * @returns {Map<string, MenuItemData>} Map of item names to their data
     * @example
     * ```typescript
     * // Get all items
     * const items = menu.getItems();
     * 
     * // Check if a specific item exists
     * if (items.has('delete')) {
     *   console.log('Delete item exists');
     * }
     * 
     * // Get the element for a specific item
     * const editItem = items.get('edit');
     * if (editItem) {
     *   console.log('Edit item element:', editItem.element);
     *   console.log('Edit item config:', editItem.config);
     * }
     * ```
     */
    getItems() {
      return component.getItems?.() || new Map();
    },

    /**
     * Checks if the menu is currently visible
     * 
     * Returns true if the menu is currently visible in the DOM,
     * false otherwise.
     * 
     * @returns {boolean} Whether the menu is visible
     * @example
     * ```typescript
     * // Check if menu is visible before performing an action
     * if (menu.isVisible()) {
     *   menu.hide();
     * } else {
     *   menu.position(button).show();
     * }
     * 
     * // Toggle menu visibility
     * toggleButton.addEventListener('click', () => {
     *   if (menu.isVisible()) {
     *     menu.hide();
     *   } else {
     *     menu.position(toggleButton).show();
     *   }
     * });
     * ```
     */
    isVisible(): boolean {
      return component.isVisible?.() || false;
    },

    /**
     * Registers an event handler
     * 
     * Subscribes to menu events like 'select', 'open', 'close', etc.
     * The handler will be called whenever the specified event occurs.
     * 
     * @param {string} event - Event name to listen for
     * @param {Function} handler - Callback function to execute when the event occurs
     * @returns {MenuComponent} Component instance for method chaining
     * @example
     * ```typescript
     * // Listen for item selection
     * menu.on('select', (event) => {
     *   console.log(`Selected item: ${event.name}`);
     *   
     *   if (event.name === 'delete') {
     *     confirmDelete();
     *   }
     * });
     * 
     * // Listen for menu opening
     * menu.on('open', () => {
     *   console.log('Menu opened');
     *   analytics.trackMenuOpen();
     * });
     * 
     * // Listen for submenu opening
     * menu.on('submenuOpen', (data) => {
     *   console.log('Submenu opened:', data);
     * });
     * ```
     */
    on(event: string, handler: Function): MenuComponent {
      component.on?.(event, handler);
      return this;
    },

    /**
     * Unregisters an event handler
     * 
     * Removes a previously registered event handler.
     * If the handler is not found, no action is taken.
     * 
     * @param {string} event - Event name to stop listening for
     * @param {Function} handler - The handler function to remove
     * @returns {MenuComponent} Component instance for method chaining
     * @example
     * ```typescript
     * // Define a handler function
     * const handleSelection = (event) => {
     *   console.log(`Selected: ${event.name}`);
     * };
     * 
     * // Register the handler
     * menu.on('select', handleSelection);
     * 
     * // Later, unregister the handler
     * menu.off('select', handleSelection);
     * ```
     */
    off(event: string, handler: Function): MenuComponent {
      component.off?.(event, handler);
      return this;
    },

    /**
     * Destroys the menu component and cleans up resources
     * 
     * Performs complete cleanup by removing event listeners, DOM elements,
     * and references to prevent memory leaks. After calling this method,
     * the menu instance should not be used again.
     * 
     * @returns {MenuComponent} Component instance
     * @example
     * ```typescript
     * // When no longer needed, destroy the menu
     * menu.destroy();
     * 
     * // When navigating away or changing views
     * function changeView() {
     *   // Clean up existing components
     *   contextMenu.destroy();
     *   
     *   // Set up new view
     *   setupNewView();
     * }
     * ```
     */
    destroy(): MenuComponent {
      // First close any open submenus
      component.hide?.();

      // Then destroy the component
      lifecycle.destroy?.();

      // Final cleanup - forcibly remove from DOM if still attached
      if (component.element && component.element.parentNode) {
        component.element.remove();
      }

      return this;
    }
  });