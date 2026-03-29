// src/components/drawer/api.ts
import { DrawerComponent, DrawerItemConfig } from './types';
import { addClass } from '../../core';

/**
 * API configuration options for drawer component
 * @category Components
 * @internal
 */
interface ApiOptions {
  state: {
    open: () => void;
    close: () => void;
    toggle: () => void;
    isOpen: () => boolean;
  };
  items: {
    setActive: (id: string) => void;
    getActive: () => string | null;
    setItems: (items: DrawerItemConfig[] | undefined) => void;
    getItems: () => DrawerItemConfig[] | undefined;
    setBadge: (id: string, badge: string) => void;
  };
  headline: {
    setHeadline: (text: string) => void;
    getHeadline: () => string;
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
  getClass: (name: string) => string;
  on?: (event: string, handler: Function) => ComponentWithElements;
  off?: (event: string, handler: Function) => ComponentWithElements;
  addClass?: (...classes: string[]) => ComponentWithElements;
}

/**
 * Enhances a drawer component with public API methods.
 * This follows the higher-order function pattern to add public API methods
 * to the component, making them available to the end user.
 *
 * All methods that modify the component return the component for chaining.
 *
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @category Components
 * @internal This is an internal utility for the Drawer component
 */
export const withAPI =
  ({ state, items, headline, lifecycle }: ApiOptions) =>
  (component: ComponentWithElements): DrawerComponent => {
    const drawerComponent: DrawerComponent = {
      element: component.element,
      getClass: component.getClass,

      lifecycle,

      // ----------------------------------------------------------------
      // Event methods
      // ----------------------------------------------------------------

      on(event: string, handler: Function) {
        if (component.on) {
          component.on(event, handler);
        }
        return drawerComponent;
      },

      off(event: string, handler: Function) {
        if (component.off) {
          component.off(event, handler);
        }
        return drawerComponent;
      },

      addClass(...classes: string[]) {
        if (component.addClass) {
          component.addClass(...classes);
        } else {
          addClass(component.element, ...classes);
        }
        return drawerComponent;
      },

      // ----------------------------------------------------------------
      // State methods
      // ----------------------------------------------------------------

      open() {
        state.open();
        return drawerComponent;
      },

      close() {
        state.close();
        return drawerComponent;
      },

      toggle() {
        state.toggle();
        return drawerComponent;
      },

      isOpen() {
        return state.isOpen();
      },

      // ----------------------------------------------------------------
      // Item methods
      // ----------------------------------------------------------------

      setActive(id: string) {
        items.setActive(id);
        return drawerComponent;
      },

      getActive() {
        return items.getActive();
      },

      setItems(newItems: DrawerItemConfig[]) {
        items.setItems(newItems);
        return drawerComponent;
      },

      getItems() {
        return (items.getItems() || []) as DrawerItemConfig[];
      },

      setBadge(id: string, badge: string) {
        items.setBadge(id, badge);
        return drawerComponent;
      },

      // ----------------------------------------------------------------
      // Headline methods
      // ----------------------------------------------------------------

      setHeadline(text: string) {
        headline.setHeadline(text);
        return drawerComponent;
      },

      getHeadline() {
        return headline.getHeadline();
      },

      // ----------------------------------------------------------------
      // Lifecycle
      // ----------------------------------------------------------------

      destroy() {
        lifecycle.destroy();
      },
    };

    return drawerComponent;
  };
