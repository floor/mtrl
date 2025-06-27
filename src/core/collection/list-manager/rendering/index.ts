import { ListManagerConfig, ListManagerElements, VisibleRange } from "../types";
import { placeholderRenderHook } from "../data-generator";

/**
 * Rendering manager dependencies
 */
export interface RenderingDependencies {
  config: ListManagerConfig;
  elements: ListManagerElements;
}

/**
 * Creates a rendering manager for handling virtual positioning and rendering
 * @param deps Dependencies from the main list manager
 * @returns Rendering management functions
 */
export const createRenderingManager = (deps: RenderingDependencies) => {
  const { config, elements } = deps;

  /**
   * Calculate item positions with virtual offset support for page jumping
   * @param items All items in the local state
   * @param visibleRange Visible range with start and end indices
   * @param virtualOffset Virtual offset for positioning items (used when jumping to pages)
   * @returns Array of positions with index, item, and offset
   */
  const calculateItemPositionsWithVirtualOffset = (
    items: any[],
    visibleRange: VisibleRange,
    virtualOffset: number = 0
  ): Array<{ index: number; item: any; offset: number }> => {
    const positions: Array<{ index: number; item: any; offset: number }> = [];
    const itemHeight = config.itemHeight || 84;

    // Calculate proper virtual positions based on item IDs
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      if (items[i]) {
        const item = items[i];
        const itemId = parseInt(item.id);
        const naturalOffset = (itemId - 1) * itemHeight;

        positions.push({
          index: i,
          item: item,
          offset: naturalOffset,
        });
      }
    }

    console.log(`🎯 [VirtualPositioning] Natural positioning:`, {
      visibleRangeStart: visibleRange.start,
      visibleRangeEnd: visibleRange.end,
      firstItemId: items[visibleRange.start]?.id,
      lastItemId: items[visibleRange.end - 1]?.id,
      firstItemOffset: positions[0]?.offset,
      lastItemOffset: positions[positions.length - 1]?.offset,
      itemCount: positions.length,
    });

    return positions;
  };

  /**
   * Render items with custom virtual positions
   * @param positions Array of item positions with virtual offsets
   */
  const renderItemsWithVirtualPositions = (
    positions: Array<{ index: number; item: any; offset: number }>
  ): void => {
    if (!elements.content) {
      console.warn("Cannot render items: content element missing");
      return;
    }

    // Clear existing items (except sentinels)
    const existingItems = Array.from(elements.content.children).filter(
      (child) =>
        child !== elements.topSentinel &&
        child !== elements.bottomSentinel &&
        (child as HTMLElement).classList.contains("mtrl-list-item")
    );
    existingItems.forEach((item) => item.remove());

    // Create document fragment for batch DOM updates
    const fragment = document.createDocumentFragment();

    // Render each item at its virtual position
    positions.forEach(({ index, item, offset }) => {
      if (!item) return;

      console.log(
        "🎨 [RenderingManager] Rendering item directly (BYPASSING HOOK!)",
        {
          item: { id: item.id, _isFake: item._isFake },
          index,
        }
      );

      // Create the item element
      const element = config.renderItem(item, index);
      if (!element) return;

      console.log(
        "🔍 [RenderingManager] Item rendered by config.renderItem, classes from user code:",
        {
          element,
          itemId: item.id,
          isFake: item._isFake,
          classesFromUserRenderItem: Array.from(element.classList),
        }
      );

      // Add CSS classes
      if (!element.classList.contains("mtrl-list-item")) {
        element.classList.add("mtrl-list-item");
      }

      // Apply placeholder render hook (this was missing!)
      console.log("🔧 [RenderingManager] Applying placeholder hook...");
      placeholderRenderHook(item, element);
      console.log("✅ [RenderingManager] Placeholder hook applied");

      // Set data attributes
      if (item.id && !element.hasAttribute("data-id")) {
        element.setAttribute("data-id", item.id);
      }

      // Position the element at its virtual offset
      element.style.position = "absolute";
      element.style.top = `${offset}px`;
      element.style.left = "0";
      element.style.width = "100%";

      fragment.appendChild(element);
    });

    // Add the fragment to the content
    elements.content.appendChild(fragment);

    // Re-add sentinel elements if they exist
    if (elements.topSentinel && !elements.topSentinel.parentNode) {
      elements.content.insertBefore(
        elements.topSentinel,
        elements.content.firstChild
      );
    }
    if (elements.bottomSentinel && !elements.bottomSentinel.parentNode) {
      elements.content.appendChild(elements.bottomSentinel);
    }

    // Removed excessive logging
  };

  return {
    calculateItemPositionsWithVirtualOffset,
    renderItemsWithVirtualPositions,
  };
};
