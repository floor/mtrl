// src/components/list/features/selection.ts

import { LIST_CLASSES, LIST_EVENTS } from "../constants";
import { addClass, hasClass, removeClass } from "../../../core/dom";
import { PREFIX } from "../../../core";

/**
 * Adds selection management capabilities to a list component
 * Optimized implementation for better performance
 *
 * @param config - Configuration options
 * @returns Function that enhances a component with selection management
 */
export const withSelection = (config) => (component) => {
  if (!component.element || !config.trackSelection) {
    return component;
  }

  // Track selected items
  const selectedItems = new Set();

  // Initialize with pre-selected items
  if (Array.isArray(config.items)) {
    config.items.forEach((item) => {
      if (item.selected) selectedItems.add(item.id);
    });
  }

  // Also initialize from initialSelection if provided
  if (Array.isArray(config.initialSelection)) {
    config.initialSelection.forEach((id) => {
      selectedItems.add(id);
    });
  }

  /**
   * Hook into the list manager's rendering process
   * This ensures selection state is applied when items are created or recycled
   */
  const hookIntoRendering = () => {
    // Wait for list manager to be initialized
    if (!component.list) {
      setTimeout(hookIntoRendering, 0);
      return;
    }

    // Set the render hook if available
    if (typeof component.list.setRenderHook === "function") {
      component.list.setRenderHook((item, element) => {
        // Apply selection state only if needed (avoid unnecessary DOM ops)
        if (selectedItems.has(item.id)) {
          if (!hasClass(element, LIST_CLASSES.SELECTED)) {
            addClass(element, LIST_CLASSES.SELECTED);
          }
        } else if (hasClass(element, LIST_CLASSES.SELECTED)) {
          removeClass(element, LIST_CLASSES.SELECTED);
        }
      });
    }
  };

  // Start hooking process
  hookIntoRendering();

  /**
   * Performance Optimization: Use event delegation with caching
   * This avoids attaching listeners to each item element
   */
  const handleItemClick = (e) => {
    // Skip if not clicking on or inside an item element
    if (!e.target.closest("[data-id]")) return;

    const itemElement = e.target.closest("[data-id]");
    const itemId = itemElement.getAttribute("data-id");

    // Exit if we can't find this ID
    if (!itemId) return;

    // Find the item data
    const item = component.list?.getAllItems().find((i) => i.id === itemId);
    if (!item) return;

    // Create selection event data
    const selectionEvent = {
      item,
      element: itemElement,
      originalEvent: e,
      component,
      preventDefault: () => {
        selectionEvent.defaultPrevented = true;
      },
      defaultPrevented: false,
    };

    // Emit event before modifying selection
    component.emit(LIST_EVENTS.SELECT, selectionEvent);

    // Exit if default was prevented
    if (selectionEvent.defaultPrevented) return;

    // Toggle selection based on mode
    if (config.multiSelect) {
      if (selectedItems.has(itemId)) {
        selectedItems.delete(itemId);
        removeClass(itemElement, LIST_CLASSES.SELECTED);
      } else {
        selectedItems.add(itemId);
        addClass(itemElement, LIST_CLASSES.SELECTED);
      }
    } else {
      // For single-select, use classList method to determine current state
      const isCurrentlySelected = hasClass(itemElement, LIST_CLASSES.SELECTED);

      // If already selected, just deselect
      if (isCurrentlySelected) {
        selectedItems.clear();
        removeClass(itemElement, LIST_CLASSES.SELECTED);
      } else {
        // Clear previous selection from DOM first
        const prevSelected = component.element.querySelectorAll(
          `.${PREFIX}-${LIST_CLASSES.SELECTED}`
        );

        prevSelected.forEach((el) => {
          removeClass(el, LIST_CLASSES.SELECTED);
        });

        // Clear all selections and add new one
        selectedItems.clear();
        selectedItems.add(itemId);
        addClass(itemElement, LIST_CLASSES.SELECTED);
      }
    }
  };

  // Add event listener
  component.element.addEventListener("click", handleItemClick);

  /**
   * Batch DOM updates for better performance
   * Update visible elements in a single pass
   */
  const updateVisibleElements = () => {
    // Get all visible item elements
    const itemElements = component.element.querySelectorAll("[data-id]");

    // Update each element based on selection state
    itemElements.forEach((el) => {
      const itemId = el.getAttribute("data-id");
      const isSelected = selectedItems.has(itemId);

      if (isSelected && !hasClass(el, LIST_CLASSES.SELECTED)) {
        addClass(el, LIST_CLASSES.SELECTED);
      } else if (!isSelected && hasClass(el, LIST_CLASSES.SELECTED)) {
        removeClass(el, LIST_CLASSES.SELECTED);
      }
    });
  };

  /**
   * Updates item selection state
   * Optimized to minimize DOM operations
   * @param {string} itemId - Item ID
   * @param {boolean} selected - Whether the item is selected
   */
  const updateItemState = (itemId, selected) => {
    // Update selection state
    if (selected) {
      selectedItems.add(itemId);
    } else {
      selectedItems.delete(itemId);
    }

    // Find the element only if it's in the visible viewport
    const itemElement = component.element.querySelector(
      `[data-id="${itemId}"]`
    );
    if (itemElement) {
      if (selected && !hasClass(itemElement, LIST_CLASSES.SELECTED)) {
        addClass(itemElement, LIST_CLASSES.SELECTED);
      } else if (!selected && hasClass(itemElement, LIST_CLASSES.SELECTED)) {
        removeClass(itemElement, LIST_CLASSES.SELECTED);
      }
    }
    // Non-visible elements will be updated when they're rendered via the hook
  };

  // Clean up on destruction
  if (component.lifecycle && component.lifecycle.destroy) {
    const originalDestroy = component.lifecycle.destroy;
    component.lifecycle.destroy = () => {
      component.element.removeEventListener("click", handleItemClick);
      originalDestroy();
    };
  }

  // Return component with selection capabilities
  return {
    ...component,
    getSelectedItems: () => {
      // Lazy evaluation for selected items - only fetch complete items when needed
      const allItems = component.list?.getAllItems() || [];
      return allItems.filter((item) => selectedItems.has(item.id));
    },
    getSelectedItemIds: () => Array.from(selectedItems),
    isItemSelected: (itemId) => selectedItems.has(itemId),
    selectItem: (itemId) => {
      updateItemState(itemId, true);
      return component;
    },
    deselectItem: (itemId) => {
      updateItemState(itemId, false);
      return component;
    },
    clearSelection: () => {
      // Fast clearing for bulk operations
      const hadSelection = selectedItems.size > 0;

      if (hadSelection) {
        // Clear the Set first (fast operation)
        selectedItems.clear();

        // Then update the visible DOM elements
        component.element
          .querySelectorAll(`.${PREFIX}-${LIST_CLASSES.SELECTED}`)
          .forEach((el) => removeClass(el, LIST_CLASSES.SELECTED));
      }

      return component;
    },
    setSelection: (itemIds) => {
      // Efficient bulk updates

      // Don't do anything if the new selection is empty and we're already empty
      if (!itemIds?.length && selectedItems.size === 0) {
        return component;
      }

      // Clear current selection
      selectedItems.clear();

      // Set new selection in memory
      if (Array.isArray(itemIds)) {
        itemIds.forEach((itemId) => selectedItems.add(itemId));
      }

      // Update DOM in a single batch operation
      updateVisibleElements();

      return component;
    },
  };
};

export default withSelection;
