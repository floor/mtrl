// src/components/menu/api.ts

import { MenuComponent, MenuContent, MenuPlacement, MenuEvent, MenuSelectEvent } from './types';

/**
 * API configuration options for menu component
 * @category Components
 * @internal
 */
interface ApiOptions {
  menu: {
    open: (event?: Event) => any;
    close: (event?: Event) => any;
    toggle: (event?: Event) => any;
    isOpen: () => boolean;
    setItems: (items: MenuContent[]) => any;
    getItems: () => MenuContent[];
    setPlacement: (placement: MenuPlacement) => any;
    getPlacement: () => MenuPlacement;
  };
  anchor: {
    setAnchor: (anchor: HTMLElement | string) => any;
    getAnchor: () => HTMLElement;
  };
  events?: {
    on: <T extends string>(event: T, handler: (event: any) => void) => any;
    off: <T extends string>(event: T, handler: (event: any) => void) => any;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Component with required elements and methods for API enhancement
 * @category Components
 * @internal
 */
interface ComponentWithElements {
  element: HTMLElement;
  on?: <T extends string>(event: T, handler: (event: any) => void) => any;
  off?: <T extends string>(event: T, handler: (event: any) => void) => any;
  emit?: (event: string, data: any) => void;
}

/**
 * Enhances a menu component with API methods.
 * This follows the higher-order function pattern to add public API methods
 * to the component, making them available to the end user.
 * 
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @category Components
 * @internal This is an internal utility for the Menu component
 */
export const withAPI = ({ menu, anchor, events, lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): MenuComponent => ({
    ...component as any,
    element: component.element,
    

    /**
     * Opens the menu
     * @param event - Optional event that triggered the open
     * @param interactionType - The type of interaction that triggered the open ('mouse' or 'keyboard')
     * @returns Menu component for chaining
     */
    open(event?: Event, interactionType: 'mouse' | 'keyboard' = 'mouse') {
      menu.open(event, interactionType);
      return this;
    },
    
    /**
     * Closes the menu
     * @param event - Optional event that triggered the close
     * @returns Menu component for chaining
     */
    close(event?: Event) {
      menu.close(event);
      return this;
    },
    
    /**
     * Toggles the menu's open state
     * @param event - Optional event that triggered the toggle
     * @returns Menu component for chaining
     */
    toggle(event?: Event) {
      menu.toggle(event);
      return this;
    },
    
    /**
     * Checks if the menu is currently open
     * @returns True if the menu is open
     */
    isOpen() {
      return menu.isOpen();
    },
    
    /**
     * Updates the menu items
     * @param items - New array of menu items and dividers
     * @returns Menu component for chaining
     */
    setItems(items: MenuContent[]) {
      menu.setItems(items);
      return this;
    },
    
    /**
     * Gets the current menu items
     * @returns Array of current menu items and dividers
     */
    getItems() {
      return menu.getItems();
    },
    
    /**
     * Updates the menu's anchor element
     * @param anchorElement - New anchor element or selector
     * @returns Menu component for chaining
     */
    setAnchor(anchorElement: HTMLElement | string) {
      anchor.setAnchor(anchorElement);
      return this;
    },
    
    /**
     * Gets the current anchor element
     * @returns Current anchor element
     */
    getAnchor() {
      return anchor.getAnchor();
    },
    
    /**
     * Updates the menu's placement
     * @param placement - New placement value
     * @returns Menu component for chaining
     */
    setPlacement(placement: MenuPlacement) {
      menu.setPlacement(placement);
      return this;
    },
    
    /**
     * Gets the current menu placement
     * @returns Current placement
     */
    getPlacement() {
      return menu.getPlacement();
    },
    
    /**
     * Adds an event listener to the menu
     * @param event - Event name ('open', 'close', 'select')
     * @param handler - Event handler function
     * @returns Menu component for chaining
     */
    on(event, handler) {
      if (events?.on) {
        events.on(event, handler);
      } else if (component.on) {
        component.on(event, handler);
      }
      return this;
    },
    
    /**
     * Removes an event listener from the menu
     * @param event - Event name
     * @param handler - Event handler function
     * @returns Menu component for chaining
     */
    off(event, handler) {
      if (events?.off) {
        events.off(event, handler);
      } else if (component.off) {
        component.off(event, handler);
      }
      return this;
    },
    
    /**
     * Destroys the menu component and cleans up resources
     */
    destroy() {
      lifecycle.destroy();
    }
  });

export default withAPI;