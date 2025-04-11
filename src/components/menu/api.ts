// src/components/menu/api.ts
import { ApiOptions, BaseComponent, MenuComponent, MenuItemConfig, MenuPositionConfig } from './types';

/**
 * Enhances a menu component with a standardized public API
 * 
 * This HOC creates a consistent interface for interacting with the menu component,
 * ensuring all methods return the component instance for method chaining.
 * 
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods
 * 
 * @internal
 */
export const withAPI = ({ lifecycle }: ApiOptions) => 
  (component: BaseComponent): MenuComponent => ({
    ...component as any,
    element: component.element,

    /**
     * Shows the menu
     * @returns {MenuComponent} Component instance for chaining
     */
    show(): MenuComponent {
      component.show?.();
      return this;
    },

    /**
     * Hides the menu
     * @returns {MenuComponent} Component instance for chaining
     */
    hide(): MenuComponent {
      component.hide?.();
      return this;
    },

    /**
     * Positions the menu relative to a target element
     * @param {HTMLElement} target - Target element to position against
     * @param {MenuPositionConfig} options - Position configuration
     * @returns {MenuComponent} Component instance for chaining
     */
    position(target: HTMLElement, options?: MenuPositionConfig): MenuComponent {
      component.position?.(target, options);
      return this;
    },

    /**
     * Adds an item to the menu
     * @param {MenuItemConfig} config - Item configuration
     * @returns {MenuComponent} Component instance for chaining
     */
    addItem(config: MenuItemConfig): MenuComponent {
      component.addItem?.(config);
      return this;
    },

    /**
     * Removes an item from the menu
     * @param {string} name - Item name
     * @returns {MenuComponent} Component instance for chaining
     */
    removeItem(name: string): MenuComponent {
      component.removeItem?.(name);
      return this;
    },

    /**
     * Gets all registered menu items
     * @returns Map of item names to their data
     */
    getItems() {
      return component.getItems?.() || new Map();
    },

    /**
     * Checks if the menu is currently visible
     * @returns {boolean} Whether the menu is visible
     */
    isVisible(): boolean {
      return component.isVisible?.() || false;
    },

    /**
     * Registers an event handler
     * @param {string} event - Event name
     * @param {Function} handler - Callback function
     * @returns {MenuComponent} Component instance for chaining
     */
    on(event: string, handler: Function): MenuComponent {
      component.on?.(event, handler);
      return this;
    },

    /**
     * Unregisters an event handler
     * @param {string} event - Event name
     * @param {Function} handler - Callback function
     * @returns {MenuComponent} Component instance for chaining
     */
    off(event: string, handler: Function): MenuComponent {
      component.off?.(event, handler);
      return this;
    },

    /**
     * Destroys the menu component and cleans up resources
     * @returns {MenuComponent} Component instance
     */
    destroy(): MenuComponent {
      lifecycle.destroy?.();
      return this;
    }
  });