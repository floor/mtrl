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
   * Apply selection state to visible elements
   */
  const applySelectionState = () => {
    const itemElements = component.element?.querySelectorAll("[data-id]") || [];
    itemElements.forEach((el) => {
      const itemId = el.getAttribute("data-id");
      const isSelected = selectedItems.has(itemId);

      if (isSelected && !hasClass(el as HTMLElement, LIST_CLASSES.SELECTED)) {
        addClass(el as HTMLElement, LIST_CLASSES.SELECTED);
      } else if (
        !isSelected &&
        hasClass(el as HTMLElement, LIST_CLASSES.SELECTED)
      ) {
        removeClass(el as HTMLElement, LIST_CLASSES.SELECTED);
      }
    });
  };

  /**
   * The render hook function that applies selection state to newly rendered items
   */
  const selectionRenderHook = (item, element) => {
    if (selectedItems.has(item.id)) {
      if (!hasClass(element, LIST_CLASSES.SELECTED)) {
        addClass(element, LIST_CLASSES.SELECTED);
      }
    } else if (hasClass(element, LIST_CLASSES.SELECTED)) {
      removeClass(element, LIST_CLASSES.SELECTED);
    }
  };

  /**
   * Set up the render hook with proper timing
   */
  const setupRenderHook = () => {
    if (!component.list) {
      // Retry until list manager is ready
      setTimeout(setupRenderHook, 10);
      return;
    }

    if (typeof component.list.setRenderHook === "function") {
      component.list.setRenderHook(selectionRenderHook);
      console.log("✅ Selection render hook installed");
    } else {
      console.warn("❌ setRenderHook not available on component.list");
    }
  };

  // Set up render hook
  setupRenderHook();

  /**
   * Listen for load events to reapply selection state after page navigation
   */
  if (component.on) {
    component.on(LIST_EVENTS.LOAD, () => {
      // Apply selection state after page loads
      setTimeout(applySelectionState, 50);
    });
  }

  /**
   * Handle item clicks for selection
   */
  const handleItemClick = (e) => {
    console.log("🎯 HANDLE ITEM CLICK CALLED:", e.target);

    if (!e.target.closest("[data-id]")) {
      console.log("❌ No data-id element found");
      return;
    }

    const itemElement = e.target.closest("[data-id]");
    const itemId = itemElement.getAttribute("data-id");

    console.log("🎯 Found item element:", { itemId, element: itemElement });

    if (!itemId) {
      console.log("❌ No item ID found");
      return;
    }

    // Find the item data
    const allItems = component.list?.getAllItems();
    const visibleItems = component.list?.getVisibleItems();
    console.log("🎯 All items:", allItems?.length);
    console.log("🎯 Visible items:", visibleItems?.length);

    // Try visible items first (what's actually displayed), then all items
    let item = visibleItems?.find((i) => i.id === itemId);
    if (!item) {
      item = allItems?.find((i) => i.id === itemId);
    }

    console.log("🎯 Found item data:", item);
    console.log(
      "🎯 Found in:",
      item
        ? visibleItems?.find((i) => i.id === itemId)
          ? "visible"
          : "all"
        : "neither"
    );

    if (!item) {
      console.log("❌ Item not found in list data:", itemId);
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

    console.log("🎯 About to emit selection event:", selectionEvent);

    // Emit event before modifying selection
    component.emit(LIST_EVENTS.SELECT, selectionEvent);

    // Exit if default was prevented
    if (selectionEvent.defaultPrevented) {
      console.log("❌ Selection event was prevented");
      return;
    }

    console.log("🎯 Processing selection toggle:", {
      multiSelect: config.multiSelect,
      currentlySelected: selectedItems.has(itemId),
    });

    // Toggle selection based on mode
    if (config.multiSelect) {
      if (selectedItems.has(itemId)) {
        selectedItems.delete(itemId);
        removeClass(itemElement, LIST_CLASSES.SELECTED);
        console.log("🎯 Deselected item:", itemId);
      } else {
        selectedItems.add(itemId);
        addClass(itemElement, LIST_CLASSES.SELECTED);
        console.log("🎯 Selected item:", itemId);
      }
    } else {
      // For single-select mode
      const isCurrentlySelected = hasClass(itemElement, LIST_CLASSES.SELECTED);

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

    console.log("🎯 Final selection state:", {
      selectedCount: selectedItems.size,
      selectedIds: Array.from(selectedItems),
    });
  };

  // Add event listener
  component.element.addEventListener("click", handleItemClick);

  /**
   * Update visible elements based on selection state
   */
  const updateVisibleElements = () => {
    const itemElements = component.element.querySelectorAll("[data-id]");
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
   * Update item selection state
   */
  const updateItemState = (itemId, selected) => {
    if (selected) {
      selectedItems.add(itemId);
    } else {
      selectedItems.delete(itemId);
    }

    // Update DOM if element is visible
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
      if (selectedItems.size > 0) {
        selectedItems.clear();
        component.element
          .querySelectorAll(`.${PREFIX}-${LIST_CLASSES.SELECTED}`)
          .forEach((el) => removeClass(el, LIST_CLASSES.SELECTED));
      }
      return component;
    },
    setSelection: (itemIds) => {
      if (!itemIds?.length && selectedItems.size === 0) {
        return component;
      }

      selectedItems.clear();
      if (Array.isArray(itemIds)) {
        itemIds.forEach((itemId) => selectedItems.add(itemId));
      }
      updateVisibleElements();
      return component;
    },
  };
};

export default withSelection;
