// src/components/menu/api.ts
import { ApiOptions, BaseComponent, MenuComponent, MenuItemConfig, MenuPositionConfig } from './types';

/**
 * Enhances menu component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI = ({ lifecycle }: ApiOptions) => 
  (component: BaseComponent): MenuComponent => ({
    ...component as any,
    element: component.element,

    /**
     * Shows the menu
     * @returns {MenuComponent} Component instance
     */
    show(): MenuComponent {
      component.show?.();
      return this;
    },

    /**
     * Hides the menu
     * @returns {MenuComponent} Component instance
     */
    hide(): MenuComponent {
      component.hide?.();
      return this;
    },

    /**
     * Positions the menu relative to a target
     * @param {HTMLElement} target - Target element
     * @param {MenuPositionConfig} options - Position options
     * @returns {MenuComponent} Component instance
     */
    position(target: HTMLElement, options?: MenuPositionConfig): MenuComponent {
      component.position?.(target, options);
      return this;
    },

    /**
     * Adds an item to the menu
     * @param {MenuItemConfig} config - Item configuration
     * @returns {MenuComponent} Component instance
     */
    addItem(config: MenuItemConfig): MenuComponent {
      component.addItem?.(config);
      return this;
    },

    /**
     * Removes an item by name
     * @param {string} name - Item name to remove
     * @returns {MenuComponent} Component instance
     */
    removeItem(name: string): MenuComponent {
      component.removeItem?.(name);
      return this;
    },

    /**
     * Gets all registered items
     * @returns {Map<string, any>} Map of item names to configurations
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
     * @param {Function} handler - Event handler
     * @returns {MenuComponent} Component instance
     */
    on(event: string, handler: Function): MenuComponent {
      component.on?.(event, handler);
      return this;
    },

    /**
     * Unregisters an event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {MenuComponent} Component instance
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