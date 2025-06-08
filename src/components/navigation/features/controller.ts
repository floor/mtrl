// src/components/navigation/features/controller.ts
import { BaseComponent, NavClass } from "../types";

/**
 * Configuration interface for controller feature
 */
interface ControllerConfig {
  /** Component prefix for class names */
  prefix?: string;

  /** Debug mode flag */
  debug?: boolean;

  /** Component name */
  componentName?: string;

  /** Additional configuration options */
  [key: string]: any;
}

/**
 * Enhanced component with controller capabilities
 */
interface ControllerComponent extends BaseComponent {
  /** Handler method for item click events */
  handleItemClick: (id: string) => void;
}

/**
 * Adds event delegation controller to a navigation component
 * This centralizes event handling for all navigation items
 *
 * @param {ControllerConfig} config - Controller configuration
 * @returns {Function} Component enhancer function
 */
export const withController =
  (config: ControllerConfig) =>
  (component: BaseComponent): ControllerComponent => {
    const prefix = config.prefix || "mtrl";

    /**
     * Updates the active state for an item
     * @param {HTMLElement} item - Item element to activate
     * @param {boolean} active - Whether to make active or inactive
     */
    const updateItemState = (item: HTMLElement, active: boolean): void => {
      // Safety check - ensure item exists
      if (!item) return;

      // Determine the correct active attribute based on role
      const role = item.getAttribute("role");

      if (active) {
        item.classList.add(`${prefix}-${NavClass.ITEM}--active`);

        // Set appropriate attribute based on role
        if (role === "tab") {
          item.setAttribute("aria-selected", "true");
          item.setAttribute("tabindex", "0");
        } else if (!item.getAttribute("aria-haspopup")) {
          // Use aria-current for navigation items that aren't expandable
          item.setAttribute("aria-current", "page");
        }
      } else {
        item.classList.remove(`${prefix}-${NavClass.ITEM}--active`);

        // Remove appropriate attribute based on role
        if (role === "tab") {
          item.setAttribute("aria-selected", "false");
          item.setAttribute("tabindex", "-1");
        } else if (item.hasAttribute("aria-current")) {
          item.removeAttribute("aria-current");
        }
      }
    };

    /**
     * Handle expandable item toggle
     * @param {HTMLElement} item - Expandable item element
     * @returns {boolean} Whether the item was expandable and handled
     */
    const handleExpandableItem = (item: HTMLElement): boolean => {
      const isExpandable = item.getAttribute("aria-expanded") !== null;
      if (!isExpandable) return false;

      // Toggle expanded state
      const isExpanded = item.getAttribute("aria-expanded") === "true";
      item.setAttribute("aria-expanded", (!isExpanded).toString());

      // Find and toggle nested container - use flexible selectors
      const container = item.closest(
        `.${prefix}-${NavClass.ITEM_CONTAINER}, .mtrl-nav-item-container`
      );
      if (container) {
        const nestedContainer = container.querySelector(
          `.${prefix}-${NavClass.NESTED_CONTAINER}, .mtrl-nav-nested-container`
        );
        if (nestedContainer) {
          (nestedContainer as HTMLElement).hidden = isExpanded;

          // Also toggle expand icon rotation if present
          const expandIcon = item.querySelector(
            `.${prefix}-${NavClass.EXPAND_ICON}, .mtrl-nav-expand-icon`
          );
          if (expandIcon && (expandIcon as HTMLElement).style) {
            (expandIcon as HTMLElement).style.transform = isExpanded
              ? ""
              : "rotate(90deg)";
          }
        }
      }

      // For expandable items, we still emit a change event
      const id = (item as HTMLElement).dataset.id;
      if (id && component.emit) {
        component.emit("expandToggle", {
          id,
          expanded: !isExpanded,
        });
      }

      return true;
    };

    // Create the enhanced component with handleItemClick method
    const enhancedComponent: ControllerComponent = {
      ...component,

      /**
       * Handler method for item click events
       * @param {string} id - ID of the clicked item
       */
      handleItemClick(id: string) {
        if (!component.items) {
          return;
        }

        const itemData = component.items.get(id);
        if (!itemData) {
          return;
        }

        // Find the currently active item by DOM query instead of relying on getActive
        const activeElement = component.element.querySelector(
          `.${prefix}-${NavClass.ITEM}--active, .mtrl-nav-item--active`
        );

        // Check if this item is already active - prevent infinite loops
        // if (activeElement && activeElement === itemData.element) {
        //   return;
        // }

        // Deactivate previous active item if found
        if (activeElement) {
          updateItemState(activeElement as HTMLElement, false);
        }

        // Make sure itemData.element exists before updating
        if (itemData.element) {
          updateItemState(itemData.element, true);
        }

        // Emit change event
        if (component.emit) {
          // Get the path to the item (for nested items)
          const path = component.getItemPath ? component.getItemPath(id) : [];

          component.emit("change", {
            id,
            item: itemData,
            previousItem: activeElement
              ? {
                  element: activeElement as HTMLElement,
                  config: { id: (activeElement as HTMLElement).dataset.id },
                }
              : null,
            path,
            source: "userAction",
          });
        }
      },
    };

    // Set up click event delegation for all navigation items
    component.element.addEventListener("click", (event: Event) => {
      const target = event.target as HTMLElement;

      // Use more flexible selectors that match actual DOM structure
      const item = target.closest(
        `.${prefix}-${NavClass.ITEM}, .mtrl-nav-item`
      ) as HTMLElement;

      if (!item) {
        // Fallback to elements with data-id attribute
        const itemByDataId = target.closest("[data-id]") as HTMLElement;
        if (!itemByDataId) {
          return;
        }
      }

      // Use the found item or fallback
      const navItem = item || (target.closest("[data-id]") as HTMLElement);

      if (
        navItem.hasAttribute("disabled") ||
        navItem.getAttribute("aria-disabled") === "true"
      ) {
        return;
      }

      // Get the ID from the data attribute
      const id = navItem.dataset.id;
      if (!id) {
        return;
      }

      // Handle expandable items first
      if (handleExpandableItem(navItem)) {
        return;
      }

      // Let the enhanced component handle normal item activation
      enhancedComponent.handleItemClick(id);
    });

    // Add keyboard support for navigation
    component.element.addEventListener("keydown", (event: KeyboardEvent) => {
      // Only handle specific keys
      if (
        ![
          "Enter",
          " ",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
        ].includes(event.key)
      ) {
        return;
      }

      const isVertical = ["rail", "drawer"].includes(component.variant || "");
      const isHorizontal = ["bar"].includes(component.variant || "");

      // Handle Enter/Space for activation
      if (event.key === "Enter" || event.key === " ") {
        const item = document.activeElement as HTMLElement;
        if (item && item.classList.contains(`${prefix}-${NavClass.ITEM}`)) {
          event.preventDefault();

          const id = item.dataset.id;
          if (id) {
            item.click(); // Trigger a click event for the item
          }
        }
        return;
      }

      // Get all focusable navigation items - use flexible selector
      const items = Array.from(
        component.element.querySelectorAll(
          `.${prefix}-${NavClass.ITEM}:not([disabled]):not([aria-disabled="true"]), 
         .mtrl-nav-item:not([disabled]):not([aria-disabled="true"])`
        )
      ) as HTMLElement[];

      if (items.length === 0) return;

      // Find the currently focused item
      const focusedItem = document.activeElement as HTMLElement;
      const focusedIndex = items.indexOf(focusedItem);

      // Handle navigation keys
      let newIndex = -1;

      if (
        (isVertical &&
          (event.key === "ArrowDown" || event.key === "ArrowRight")) ||
        (isHorizontal && event.key === "ArrowRight")
      ) {
        newIndex = focusedIndex < 0 ? 0 : (focusedIndex + 1) % items.length;
      } else if (
        (isVertical &&
          (event.key === "ArrowUp" || event.key === "ArrowLeft")) ||
        (isHorizontal && event.key === "ArrowLeft")
      ) {
        newIndex =
          focusedIndex < 0
            ? items.length - 1
            : (focusedIndex - 1 + items.length) % items.length;
      } else if (event.key === "Home") {
        newIndex = 0;
      } else if (event.key === "End") {
        newIndex = items.length - 1;
      }

      if (newIndex >= 0) {
        event.preventDefault();
        items[newIndex].focus();
      }
    });

    return enhancedComponent;
  };

export default withController;
