// src/components/menu/api.ts

import { MenuComponent, MenuContent, MenuPosition, MenuEvents } from "./types";

/**
 * API configuration options for menu component
 * @category Components
 * @internal
 */
interface ApiOptions {
  menu: {
    open: (event?: Event, interactionType?: "mouse" | "keyboard") => void;
    close: (
      event?: Event,
      restoreFocus?: boolean,
      skipAnimation?: boolean
    ) => void;
    toggle: (event?: Event, interactionType?: "mouse" | "keyboard") => void;
    isOpen: () => boolean;
    setItems: (items: MenuContent[]) => void;
    getItems: () => MenuContent[];
    setPosition: (position: MenuPosition) => void;
    getPosition: () => MenuPosition;
    setSelected: (itemId: string) => void;
    getSelected: () => string | null;
  };
  opener: {
    setOpener: (opener: HTMLElement | string) => void;
    getOpener: () => HTMLElement;
  };
  submenu?: {
    hasOpenSubmenu: () => boolean;
    closeAllSubmenus: () => void;
  };
  events?: {
    on: <T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]) => void;
    off: <T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]) => void;
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
  on?: <T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]) => void;
  off?: <T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]) => void;
  emit?: (event: string, data: unknown) => void;
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
const withAPI =
  ({ menu, opener, events, lifecycle }: ApiOptions) =>
  (component: ComponentWithElements): MenuComponent => {
    // Create the enhanced component
    const menuComponent: MenuComponent = {
      element: component.element,

      /**
       * Opens the menu
       * @param event - Optional event that triggered the open
       * @param interactionType - The type of interaction that triggered the open ('mouse' or 'keyboard')
       * @returns Menu component for chaining
       */
      open(event?: Event, interactionType: "mouse" | "keyboard" = "mouse") {
        // Determine interaction type from event if not explicitly provided
        if (event && !interactionType) {
          if (event instanceof KeyboardEvent) {
            interactionType = "keyboard";
          }
        }

        menu.open(event, interactionType);
        return this;
      },

      /**
       * Closes the menu
       * @param event - Optional event that triggered the close
       * @returns Menu component for chaining
       */
      close(
        event?: Event,
        restoreFocus: boolean = true,
        skipAnimation: boolean = false
      ) {
        menu.close(event, restoreFocus, skipAnimation);
        return this;
      },

      /**
       * Toggles the menu's open state
       * @param event - Optional event that triggered the toggle
       * @param interactionType - The type of interaction that triggered the toggle
       * @returns Menu component for chaining
       */
      toggle(event?: Event, interactionType?: "mouse" | "keyboard") {
        // Determine interaction type from event if not explicitly provided
        if (event && !interactionType) {
          if (event instanceof KeyboardEvent) {
            interactionType = "keyboard";
          } else if (event instanceof MouseEvent) {
            interactionType = "mouse";
          }
        }

        menu.toggle(event, interactionType);
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
       * Updates the menu's opener element
       * @param openerElement - New opener element or selector
       * @returns Menu component for chaining
       */
      setOpener(openerElement: HTMLElement | string) {
        opener.setOpener(openerElement);
        return this;
      },

      /**
       * Gets the current opener element
       * @returns Current opener element
       */
      getOpener() {
        return opener.getOpener();
      },

      /**
       * Updates the menu's position
       * @param position - New position value
       * @returns Menu component for chaining
       */
      setPosition(position: MenuPosition) {
        menu.setPosition(position);
        return this;
      },

      /**
       * Gets the current menu position
       * @returns Current position
       */
      getPosition() {
        return menu.getPosition();
      },

      /**
       * Sets the selected menu item
       * @param itemId - ID of the menu item to mark as selected
       * @returns Menu component for chaining
       */
      setSelected(itemId: string) {
        menu.setSelected(itemId);
        return this;
      },

      /**
       * Gets the currently selected menu item's ID
       * @returns ID of the selected menu item or null if none is selected
       */
      getSelected() {
        return menu.getSelected();
      },

      /**
       * Adds an event listener to the menu
       * @param event - Event name ('open', 'close', 'select')
       * @param handler - Event handler function
       * @returns Menu component for chaining
       */
      on<T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]) {
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
      off<T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]) {
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
      },
    };

    return menuComponent;
  };

export { withAPI };
