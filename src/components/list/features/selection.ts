// src/components/list/features/selection.ts

import { LIST_CLASSES, LIST_EVENTS } from "../constants";
import { addClass, hasClass, removeClass } from "../../../core/dom";
import { PREFIX } from "../../../core";

/**
 * Adds selection management capabilities to a list component
 * Simplified implementation for rendered lists
 *
 * @param config - Configuration options
 * @returns Function that enhances a component with selection management
 */
export const withSelection = (config) => (component) => {
  if (!component.element || !config.trackSelection) {
    return {
      ...component,
      // Return no-op methods when selection is disabled
      getSelectedItems: () => [],
      getSelectedItemIds: () => [],
      isItemSelected: () => false,
      selectItem: () => component,
      deselectItem: () => component,
      clearSelection: () => component,
      setSelection: () => component,
    };
  }

  // Track selected items
  const selectedItems = new Set();

  // Initialize from initialSelection if provided
  if (Array.isArray(config.initialSelection)) {
    config.initialSelection.forEach((id) => selectedItems.add(String(id)));
  }

  // Initialize from items marked as selected
  if (Array.isArray(config.items)) {
    config.items.forEach((item, index) => {
      if (item?.selected) {
        const itemId = item.id || String(index);
        selectedItems.add(String(itemId));
      }
    });
  }

  /**
   * Apply selection state to visible elements
   */
  const applySelectionState = () => {
    const itemElements = component.element?.querySelectorAll("[data-id]") || [];
    itemElements.forEach((el) => {
      const itemId = el.getAttribute("data-id");
      const isSelected = selectedItems.has(itemId);

      if (isSelected && !hasClass(el as HTMLElement, LIST_CLASSES.SELECTED)) {
        addClass(el as HTMLElement, LIST_CLASSES.SELECTED);
      } else if (!isSelected && hasClass(el as HTMLElement, LIST_CLASSES.SELECTED)) {
        removeClass(el as HTMLElement, LIST_CLASSES.SELECTED);
      }
    });
  };

  /**
   * Handle item clicks for selection
   */
  const handleItemClick = (e) => {
    const itemElement = e.target.closest("[data-id]");
    if (!itemElement) return;

    const itemId = itemElement.getAttribute("data-id");
    if (!itemId) return;

    // Find the item data
    const items = component.list?.getItems() || [];
    let item = items.find((i) => String(i?.id) === itemId);
    
    // If no ID match, try by index
    if (!item) {
      const index = parseInt(itemId, 10);
      if (!isNaN(index) && index >= 0 && index < items.length) {
        item = items[index];
      }
    }

    if (!item) {
      console.warn(`Item not found for ID: ${itemId}`);
      return;
    }

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
    component.emit?.(LIST_EVENTS.SELECT, selectionEvent);

    // Exit if default was prevented
    if (selectionEvent.defaultPrevented) return;

    // Toggle selection based on mode
    if (config.multiSelect) {
      if (selectedItems.has(itemId)) {
        selectedItems.delete(itemId);
        removeClass(itemElement as HTMLElement, LIST_CLASSES.SELECTED);
      } else {
        selectedItems.add(itemId);
        addClass(itemElement as HTMLElement, LIST_CLASSES.SELECTED);
      }
    } else {
      // Single-select mode
      const isCurrentlySelected = hasClass(itemElement as HTMLElement, LIST_CLASSES.SELECTED);

      // Clear all previous selections
      const prevSelected = component.element.querySelectorAll(`.${PREFIX}-${LIST_CLASSES.SELECTED}`);
      prevSelected.forEach((el) => removeClass(el as HTMLElement, LIST_CLASSES.SELECTED));
      selectedItems.clear();

      // Add new selection if not already selected
      if (!isCurrentlySelected) {
        selectedItems.add(itemId);
        addClass(itemElement as HTMLElement, LIST_CLASSES.SELECTED);
      }
    }
  };

  /**
   * Update item selection state
   */
  const updateItemState = (itemId, selected) => {
    const stringId = String(itemId);
    
    if (selected) {
      selectedItems.add(stringId);
    } else {
      selectedItems.delete(stringId);
    }

    // Update DOM if element is visible
    const itemElement = component.element.querySelector(`[data-id="${stringId}"]`);
    if (itemElement) {
      if (selected && !hasClass(itemElement as HTMLElement, LIST_CLASSES.SELECTED)) {
        addClass(itemElement as HTMLElement, LIST_CLASSES.SELECTED);
      } else if (!selected && hasClass(itemElement as HTMLElement, LIST_CLASSES.SELECTED)) {
        removeClass(itemElement as HTMLElement, LIST_CLASSES.SELECTED);
      }
    }
  };

  // Add event listener
  component.element.addEventListener("click", handleItemClick);

  // Apply initial selection state after a brief delay to ensure DOM is ready
  setTimeout(applySelectionState, 10);

  // Clean up on destruction
  if (component.lifecycle?.destroy) {
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
      const items = component.list?.getItems() || [];
      return items.filter((item, index) => {
        const itemId = item?.id || String(index);
        return selectedItems.has(String(itemId));
      });
    },
    getSelectedItemIds: () => Array.from(selectedItems),
    isItemSelected: (itemId) => selectedItems.has(String(itemId)),
    selectItem: (itemId) => {
      updateItemState(itemId, true);
      return component;
    },
    deselectItem: (itemId) => {
      updateItemState(itemId, false);
      return component;
    },
    clearSelection: () => {
      if (selectedItems.size > 0) {
        selectedItems.clear();
        component.element
          .querySelectorAll(`.${PREFIX}-${LIST_CLASSES.SELECTED}`)
          .forEach((el) => removeClass(el as HTMLElement, LIST_CLASSES.SELECTED));
      }
      return component;
    },
    setSelection: (itemIds) => {
      selectedItems.clear();
      if (Array.isArray(itemIds)) {
        itemIds.forEach((itemId) => selectedItems.add(String(itemId)));
      }
      applySelectionState();
      return component;
    },
  };
};

export default withSelection;