// src/core/collection/list-manager/renderer.ts
import { ListManagerConfig, ListManagerElements, VisibleRange } from "../types";
import { RecyclingPool } from "../utils/recycling";
import { ItemMeasurement } from "../dom/measurement";
import { calculateItemPositions } from "../utils/viewport";

/**
 * Creates a renderer for list items
 * @param config List manager configuration
 * @param elements DOM elements used by the list manager
 * @param itemMeasurement Item measurement utilities
 * @param recyclePool Element recycling pool
 * @returns Renderer functions
 */
export const createRenderer = (
  config: ListManagerConfig,
  elements: ListManagerElements,
  itemMeasurement: ItemMeasurement,
  recyclePool: RecyclingPool
) => {
  // State for renderer
  let renderHook: ((item: any, element: HTMLElement) => void) | null = null;
  const itemElements = new Map<string, HTMLElement>();
  let lastVisibleRange: VisibleRange = { start: 0, end: 0 };

  // Initialize item measurement system
  if (typeof itemMeasurement.setup === "function") {
    itemMeasurement.setup(config);
  }

  /**
   * Create a wrapped renderItem function with hooks and optimizations
   * @param item Item to render
   * @param index Index in the list
   * @returns DOM element
   */
  const createItemElement = (item: any, index: number): HTMLElement => {
    // Skip invalid items
    if (!item) {
      console.warn("Attempted to render undefined item at index", index);
      const placeholder = document.createElement("div");
      placeholder.style.height = `${config.itemHeight || 48}px`;
      return placeholder;
    }

    // Check for recycled element first
    const recycled = recyclePool.getRecycledElement(item);

    // Create or recycle the element using user-provided function
    const element = config.renderItem(item, index, recycled);

    if (!element) {
      console.warn("renderItem returned null or undefined for item", item);
      // Create a placeholder element to prevent errors
      const placeholder = document.createElement("div");
      placeholder.style.height = `${config.itemHeight || 48}px`;
      return placeholder;
    }

    // Add CSS class for easier selection
    if (!element.classList.contains("mtrl-list-item")) {
      element.classList.add("mtrl-list-item");
    }

    // Ensure element has a data-id attribute for selection targeting
    if (item.id && !element.hasAttribute("data-id")) {
      element.setAttribute("data-id", item.id);
    }

    // Set type for recycling
    if (item.type) {
      element.dataset.itemType = item.type;
    }

    // Add measurement flag if using dynamic sizing or for auto-detecting first item
    if (
      (config.dynamicItemSize === true || itemElements.size === 0) &&
      !element.hasAttribute("data-needs-measurement")
    ) {
      element.dataset.needsMeasurement = "true";
    }

    // Explicitly set height for consistency between placeholders and real items
    if (config.itemHeight && !config.dynamicItemSize) {
      element.style.height = `${config.itemHeight}px`;
      element.style.minHeight = `${config.itemHeight}px`;
      // Store configured height for placeholder hook to preserve
      element.dataset.configuredItemHeight = config.itemHeight.toString();
    }

    // Apply any post-render hooks if available
    if (renderHook) {
      renderHook(item, element);
    }

    return element;
  };

  /**
   * Determine if we should do a partial update or full rerender
   * @param currentVisibleIds Set of currently visible item IDs
   * @param previousVisibleIds Set of previously visible item IDs
   * @returns Whether to do a partial update
   */
  const shouldUsePartialUpdate = (
    currentVisibleIds: Set<string>,
    previousVisibleIds: Set<string>,
    visibleRange: VisibleRange
  ): boolean => {
    // If range has changed dramatically, do a full rerender
    const rangeDifference = Math.abs(
      visibleRange.end -
        visibleRange.start -
        (lastVisibleRange.end - lastVisibleRange.start)
    );

    if (rangeDifference > 10) {
      return false;
    }

    // Count how many items are the same
    let sameItemCount = 0;

    // Convert Set to array and iterate
    Array.from(currentVisibleIds).forEach((id) => {
      if (previousVisibleIds.has(id)) {
        sameItemCount++;
      }
    });

    // If more than 50% of items are the same, do partial update
    return sameItemCount >= currentVisibleIds.size / 2;
  };

  return {
    /**
     * Sets a render hook function that will be called for each rendered item
     * @param hookFn Hook function
     */
    setRenderHook: (
      hookFn: (item: any, element: HTMLElement) => void
    ): void => {
      renderHook = hookFn;
    },

    /**
     * Renders visible items in the viewport
     * @param items All items
     * @param visibleRange Visible range with start and end indices
     * @returns Map of item IDs to rendered elements
     */
    renderVisibleItems: (
      items: any[],
      visibleRange: VisibleRange
    ): Map<string, HTMLElement> => {
      // Check if content exists
      if (!elements.content) {
        console.warn("Cannot render items: content element missing");
        return new Map();
      }

      // Skip rendering if range hasn't changed
      if (
        visibleRange.start === lastVisibleRange.start &&
        visibleRange.end === lastVisibleRange.end
      ) {
        return itemElements;
      }

      // Update visible range
      lastVisibleRange = visibleRange;

      // Cache sentinel elements if they exist
      const topSentinel = elements.topSentinel;
      const bottomSentinel = elements.bottomSentinel;

      // Calculate positions for each visible item
      const positions = calculateItemPositions(
        items,
        visibleRange,
        itemMeasurement
      );

      // Get current visible IDs
      const currentVisibleIds = new Set(positions.map((p) => p.item.id));
      const previousVisibleIds = new Set(itemElements.keys());

      // Determine if we should do a partial update
      const doPartialUpdate = shouldUsePartialUpdate(
        currentVisibleIds,
        previousVisibleIds,
        visibleRange
      );

      if (doPartialUpdate) {
        // Partial update - only add/remove/reposition necessary items

        // Find items to add and remove
        const toAdd = positions.filter(
          (p) => !previousVisibleIds.has(p.item.id)
        );
        const toRemove = Array.from(itemElements.entries()).filter(
          ([id]) => !currentVisibleIds.has(id)
        );

        // Remove items that are no longer visible
        toRemove.forEach(([id, element]) => {
          recyclePool.recycleElement(element);
          itemElements.delete(id);
          element.remove();
        });

        // Add new items
        if (toAdd.length > 0) {
          const fragment = document.createDocumentFragment();

          toAdd.forEach(({ index, item, offset }) => {
            const element = createItemElement(item, index);

            element.style.position = "absolute";
            element.style.transform = `translateY(${offset}px)`;
            element.style.willChange = "transform";
            element.style.left = "0";
            element.style.width = "100%";

            // Explicitly set height for consistency
            if (config.itemHeight) {
              element.style.height = `${config.itemHeight}px`;
              element.style.minHeight = `${config.itemHeight}px`;
              element.dataset.configuredItemHeight =
                config.itemHeight.toString();
            }

            fragment.appendChild(element);
            itemElements.set(item.id, element);
          });

          elements.content.appendChild(fragment);
        }

        // Reposition existing items
        positions.forEach(({ item, offset }) => {
          if (itemElements.has(item.id)) {
            const element = itemElements.get(item.id)!;
            // Extract current transform offset for comparison
            const currentTransform = element.style.transform;
            const currentOffset = currentTransform.match(
              /translateY\((\d+)px\)/
            )?.[1];
            if (parseInt(currentOffset || "0", 10) !== offset) {
              element.style.transform = `translateY(${offset}px)`;
            }

            // Ensure height consistency during partial updates
            if (config.itemHeight) {
              element.style.height = `${config.itemHeight}px`;
              element.style.minHeight = `${config.itemHeight}px`;
              element.dataset.configuredItemHeight =
                config.itemHeight.toString();
            }
          }
        });
      } else {
        // Full rerender - replace all elements

        // Save references to existing elements for recycling
        const existingElements = new Map<string, HTMLElement>();
        Array.from(elements.content.children).forEach((child) => {
          if (child === topSentinel || child === bottomSentinel) return;

          const id = (child as HTMLElement).getAttribute("data-id");
          if (id) {
            existingElements.set(id, child as HTMLElement);
            child.remove(); // Remove but keep reference
          }
        });

        // Create document fragment for batch DOM updates
        const fragment = document.createDocumentFragment();

        // Clear the item elements map before adding new elements
        itemElements.clear();

        // Render visible items
        positions.forEach(({ index, item, offset }) => {
          let element: HTMLElement;

          // Reuse existing element if available
          if (existingElements.has(item.id)) {
            element = existingElements.get(item.id)!;
            existingElements.delete(item.id);

            // Update position using GPU-accelerated transforms
            element.style.transform = `translateY(${offset}px)`;
            element.style.willChange = "transform";

            // Ensure height consistency for reused elements
            if (config.itemHeight) {
              element.style.height = `${config.itemHeight}px`;
              element.style.minHeight = `${config.itemHeight}px`;
              element.dataset.configuredItemHeight =
                config.itemHeight.toString();
            }

            // Check if it needs measurement (first item or dynamic sizing)
            if (config.dynamicItemSize === true || itemElements.size === 0) {
              element.dataset.needsMeasurement = "true";
            }
          } else {
            element = createItemElement(item, index);

            // Position the element using GPU-accelerated transforms
            element.style.position = "absolute";
            element.style.transform = `translateY(${offset}px)`;
            element.style.willChange = "transform";
            element.style.left = "0";
            element.style.width = "100%";

            // Explicitly set height if configured to ensure consistency
            if (config.itemHeight) {
              element.style.height = `${config.itemHeight}px`;
              element.style.minHeight = `${config.itemHeight}px`;
              element.dataset.configuredItemHeight =
                config.itemHeight.toString();
            }
          }

          // Add to fragment
          fragment.appendChild(element);

          // Store the element reference
          itemElements.set(item.id, element);
        });

        // Recycle any remaining elements
        existingElements.forEach((element) => {
          recyclePool.recycleElement(element);
        });

        // Batch DOM update
        elements.content.innerHTML = "";
        elements.content.appendChild(fragment);
      }

      // Add sentinel elements back if they exist
      if (topSentinel && !topSentinel.parentNode) {
        elements.content.insertBefore(topSentinel, elements.content.firstChild);
      }

      if (bottomSentinel && !bottomSentinel.parentNode) {
        elements.content.appendChild(bottomSentinel);
      }

      return itemElements;
    },

    /**
     * Gets all currently rendered item elements
     * @returns Map of item IDs to elements
     */
    getItemElements: (): Map<string, HTMLElement> => {
      return new Map(itemElements);
    },

    /**
     * Resets the visible range to force a full re-render on next call
     */
    resetVisibleRange: (): void => {
      lastVisibleRange = { start: -1, end: -1 };
    },
  };
};

export type Renderer = ReturnType<typeof createRenderer>;
