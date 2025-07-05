// src/core/collection/list-manager/renderer.ts
import { ListManagerConfig, ListManagerElements, VisibleRange } from "../types";
import { RecyclingPool } from "../utils/recycling";
import { ItemMeasurement } from "../dom/measurement";
import {
  calculateItemPositions,
  calculateSequentialItemPositions,
} from "../utils/viewport";

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

  // 🚀 PERFORMANCE: Cache frequently accessed values
  const itemHeight = config.itemHeight || 84;
  const itemHeightPx = `${itemHeight}px`;
  const paginationStrategy = config.pagination?.strategy || "cursor";
  const isDynamicSize = config.dynamicItemSize === true;

  // 🚀 PERFORMANCE: Pre-allocate reusable objects to avoid garbage collection
  const reusableCurrentIds = new Set<string>();
  const reusablePreviousIds = new Set<string>();
  const reusableToAdd: Array<{ index: number; item: any; offset: number }> = [];
  const reusableToRemove: Array<[string, HTMLElement]> = [];

  // 🚀 PERFORMANCE: Cache regex pattern for transform parsing
  const transformRegex = /translateY\((\d+)px\)/;

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
      placeholder.style.height = itemHeightPx;
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
      placeholder.style.height = itemHeightPx;
      return placeholder;
    }

    // 🚀 PERFORMANCE: Batch DOM modifications and cache checks
    const classList = element.classList;
    const hasListClass = classList.contains("mtrl-list-item");
    const hasDataId = element.hasAttribute("data-id");
    const hasHeight = element.style.height;
    const hasNeedsMeasurement = element.hasAttribute("data-needs-measurement");

    // Add CSS class for easier selection
    if (!hasListClass) {
      classList.add("mtrl-list-item");
    }

    // Ensure element has a data-id attribute for selection targeting
    if (item.id && !hasDataId) {
      element.setAttribute("data-id", item.id);
    }

    // Set type for recycling
    if (item.type) {
      element.dataset.itemType = item.type;
    }

    // Add measurement flag if using dynamic sizing or for auto-detecting first item
    if ((isDynamicSize || itemElements.size === 0) && !hasNeedsMeasurement) {
      element.dataset.needsMeasurement = "true";
    }

    // Apply itemHeight as CSS height only if NOT using dynamic sizing
    if (itemHeight && !hasHeight && !isDynamicSize) {
      element.style.height = itemHeightPx;
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

    // 🚀 PERFORMANCE: Count same items without creating temporary arrays
    let sameItemCount = 0;

    // Iterate over the smaller set for better performance
    const smallerSet =
      currentVisibleIds.size < previousVisibleIds.size
        ? currentVisibleIds
        : previousVisibleIds;
    const largerSet =
      currentVisibleIds.size < previousVisibleIds.size
        ? previousVisibleIds
        : currentVisibleIds;

    for (const id of smallerSet) {
      if (largerSet.has(id)) {
        sameItemCount++;
      }
    }

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
      // Use sequential positioning for cursor pagination, regular positioning for page/offset
      const positions =
        paginationStrategy === "cursor"
          ? calculateSequentialItemPositions(items, visibleRange, itemHeight)
          : calculateItemPositions(items, visibleRange, itemMeasurement);

      // 🚀 PERFORMANCE: Reuse Set objects to avoid garbage collection
      reusableCurrentIds.clear();
      reusablePreviousIds.clear();

      // Build ID sets efficiently without creating temporary arrays
      for (let i = 0; i < positions.length; i++) {
        reusableCurrentIds.add(positions[i].item.id);
      }

      for (const [id] of itemElements) {
        reusablePreviousIds.add(id);
      }

      // Determine if we should do a partial update
      const doPartialUpdate = shouldUsePartialUpdate(
        reusableCurrentIds,
        reusablePreviousIds,
        visibleRange
      );

      if (doPartialUpdate) {
        // Partial update - only add/remove/reposition necessary items

        // 🚀 PERFORMANCE: Reuse arrays to avoid garbage collection
        reusableToAdd.length = 0;
        reusableToRemove.length = 0;

        // Find items to add and remove efficiently
        for (let i = 0; i < positions.length; i++) {
          const pos = positions[i];
          if (!reusablePreviousIds.has(pos.item.id)) {
            reusableToAdd.push(pos);
          }
        }

        for (const [id, element] of itemElements) {
          if (!reusableCurrentIds.has(id)) {
            reusableToRemove.push([id, element]);
          }
        }

        // Remove items that are no longer visible
        for (let i = 0; i < reusableToRemove.length; i++) {
          const [id, element] = reusableToRemove[i];
          recyclePool.recycleElement(element);
          itemElements.delete(id);
          element.remove();
        }

        // Add new items
        if (reusableToAdd.length > 0) {
          const fragment = document.createDocumentFragment();

          for (let i = 0; i < reusableToAdd.length; i++) {
            const { index, item, offset } = reusableToAdd[i];
            const element = createItemElement(item, index);

            element.style.position = "absolute";
            element.style.transform = `translateY(${offset}px)`;

            // Ensure itemHeight is applied only if NOT using dynamic sizing
            if (itemHeight && !element.style.height && !isDynamicSize) {
              element.style.height = itemHeightPx;
            }

            fragment.appendChild(element);
            itemElements.set(item.id, element);
          }

          elements.content.appendChild(fragment);
        }

        // Reposition existing items
        for (let i = 0; i < positions.length; i++) {
          const { item, offset } = positions[i];
          if (itemElements.has(item.id)) {
            const element = itemElements.get(item.id)!;
            // 🚀 PERFORMANCE: Use cached regex and avoid string parsing
            const currentTransform = element.style.transform;
            const match = transformRegex.exec(currentTransform);
            const currentOffset = match ? parseInt(match[1], 10) : 0;
            if (currentOffset !== offset) {
              element.style.transform = `translateY(${offset}px)`;
            }
          }
        }
      } else {
        // Full rerender - replace all elements

        // 🚀 PERFORMANCE: Save references to existing elements for recycling without Array.from
        const existingElements = new Map<string, HTMLElement>();
        const children = elements.content.children;

        // Use backwards iteration to avoid issues with live NodeList
        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i] as HTMLElement;
          if (child === topSentinel || child === bottomSentinel) continue;

          const id = child.getAttribute("data-id");
          if (id) {
            existingElements.set(id, child);
            child.remove(); // Remove but keep reference
          }
        }

        // Create document fragment for batch DOM updates
        const fragment = document.createDocumentFragment();

        // Clear the item elements map before adding new elements
        itemElements.clear();

        // Render visible items
        for (let i = 0; i < positions.length; i++) {
          const { index, item, offset } = positions[i];
          let element: HTMLElement;

          // Reuse existing element if available
          if (existingElements.has(item.id)) {
            element = existingElements.get(item.id)!;
            existingElements.delete(item.id);

            // Update position using GPU-accelerated transforms
            element.style.transform = `translateY(${offset}px)`;
            element.style.willChange = "transform";

            // Ensure itemHeight is applied only if NOT using dynamic sizing
            if (itemHeight && !element.style.height && !isDynamicSize) {
              element.style.height = itemHeightPx;
            }

            // Check if it needs measurement (first item or dynamic sizing)
            if (isDynamicSize || itemElements.size === 0) {
              element.dataset.needsMeasurement = "true";
            }
          } else {
            element = createItemElement(item, index);

            // Position the element using GPU-accelerated transforms
            element.style.position = "absolute";
            element.style.transform = `translateY(${offset}px)`;

            // Ensure itemHeight is applied only if NOT using dynamic sizing
            if (itemHeight && !element.style.height && !isDynamicSize) {
              element.style.height = itemHeightPx;
            }
          }

          // Add to fragment
          fragment.appendChild(element);

          // Store the element reference
          itemElements.set(item.id, element);
        }

        // Recycle any remaining elements
        for (const [, element] of existingElements) {
          recyclePool.recycleElement(element);
        }

        // 🚀 PERFORMANCE: Avoid expensive innerHTML = "" by removing remaining children
        const remainingChildren = elements.content.children;
        while (remainingChildren.length > 0) {
          const child = remainingChildren[0];
          if (child === topSentinel || child === bottomSentinel) {
            // Skip sentinels - they should stay
            if (remainingChildren.length > 1) {
              remainingChildren[1].remove();
            } else {
              break;
            }
          } else {
            child.remove();
          }
        }

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
