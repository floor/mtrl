// src/components/list/features/selection.ts

import { LIST_CLASSES, LIST_EVENTS } from "../constants";
import { addClass, hasClass, removeClass } from "../../../core/dom";
import { PREFIX } from "../../../core";
import type {
  ListConfig,
  ListFeatureHost,
  ListItem,
  ListSelection,
} from "../types";

/** The event withSelection emits before it changes the selection. */
interface ListSelectEvent {
  item: ListItem;
  element: Element;
  originalEvent: Event;
  component: ListFeatureHost;
  preventDefault: () => void;
  defaultPrevented: boolean;
}

/**
 * Adds selection management capabilities to a list component
 * Simplified implementation for rendered lists
 *
 * @param config - Configuration options
 * @returns Function that enhances a component with selection management
 */
export const withSelection =
  (config: ListConfig<ListItem>) =>
  <C extends ListFeatureHost>(component: C): C & ListSelection => {
  // The element half of the old `!component.element ||` here could not fire:
  // withElement runs before this in the only pipe that calls it, and the host
  // type says so. What is live is trackSelection.
  if (!config.trackSelection) {
    return {
      ...component,
      // No-ops rather than an absence, so a caller never has to check before
      // calling. They return `this` for the same reason the real ones do.
      getSelectedItems: () => [],
      getSelectedItemIds: () => [],
      isItemSelected: () => false,
      selectItem() {
        return this;
      },
      deselectItem() {
        return this;
      },
      clearSelection() {
        return this;
      },
      setSelection() {
        return this;
      },
    };
  }

  // Track selected items
  const selectedItems = new Set<string>();

  // Initialize from initialSelection if provided
  if (Array.isArray(config.initialSelection)) {
    config.initialSelection.forEach((id: string | number) =>
      selectedItems.add(String(id))
    );
  }

  // Initialize from items marked as selected
  if (Array.isArray(config.items)) {
    config.items.forEach((item: ListItem, index: number) => {
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
    const itemElements = component.element.querySelectorAll("[data-id]");
    itemElements.forEach((el: Element) => {
      // The selector above is [data-id], so this is never null. TS cannot see
      // that, and a null id matching nothing is the right answer anyway.
      const itemId = el.getAttribute("data-id");
      const isSelected = itemId !== null && selectedItems.has(itemId);

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
  const handleItemClick = (e: Event) => {
    // A click can land on a text node's parent or on the item itself, so the
    // target is whatever Element was hit, and closest walks up to the row.
    const target = e.target instanceof Element ? e.target : null;
    const itemElement = target?.closest("[data-id]");
    if (!itemElement) return;

    const itemId = itemElement.getAttribute("data-id");
    if (!itemId) return;

    // Find the item data
    const items = component.list?.getItems() || [];
    let item = items.find((i: ListItem) => String(i?.id) === itemId);
    
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
    const selectionEvent: ListSelectEvent = {
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
  const updateItemState = (itemId: string | number, selected: boolean): void => {
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
      return items.filter((item: ListItem, index: number) => {
        const itemId = item?.id || String(index);
        return selectedItems.has(String(itemId));
      });
    },
    getSelectedItemIds: () => Array.from(selectedItems),
    isItemSelected: (itemId: string | number) => selectedItems.has(String(itemId)),
    // `this`, not the captured `component`: that is the component as it was
    // handed to this feature, which does not carry the selection API these
    // return -- the same defect #120 took out of core.
    selectItem(itemId: string | number) {
      updateItemState(itemId, true);
      return this;
    },
    deselectItem(itemId: string | number) {
      updateItemState(itemId, false);
      return this;
    },
    clearSelection() {
      if (selectedItems.size > 0) {
        selectedItems.clear();
        component.element
          .querySelectorAll(`.${PREFIX}-${LIST_CLASSES.SELECTED}`)
          .forEach((el: Element) => removeClass(el as HTMLElement, LIST_CLASSES.SELECTED));
      }
      return this;
    },
    setSelection(itemIds: (string | number)[]) {
      selectedItems.clear();
      if (Array.isArray(itemIds)) {
        itemIds.forEach((itemId: string | number) => selectedItems.add(String(itemId)));
      }
      applySelectionState();
      return this;
    },
  };
};

export default withSelection;