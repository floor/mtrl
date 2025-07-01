import {
  ListManagerState,
  ListManagerConfig,
  ScrollToPosition,
} from "../types";
import { DEFAULTS } from "../constants";

/**
 * Scrolling manager dependencies
 */
export interface ScrollingDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  container: HTMLElement;
  loadPage?: (
    pageNumber: number,
    options?: {
      setScrollPosition?: boolean;
      replaceCollection?: boolean;
      animate?: boolean;
    }
  ) => Promise<{ hasNext: boolean; items: any[] }>;
  itemMeasurement?: {
    calculateOffsets?: (items: any[]) => void;
    getItemOffset?: (items: any[], itemId: string) => number;
    getItemHeight?: (item: any) => number;
  };
  collection?: string;
  scrollJumpManager?: {
    loadScrollJumpWithBackgroundRanges: (
      targetPage: number,
      animate?: boolean
    ) => Promise<void>;
    loadAdditionalRangesInBackground: (pages: number[], phase?: string) => void;
    loadScrollToIndexWithBackgroundRanges: (
      index: number,
      animate?: boolean
    ) => Promise<void>;
  };
}

/**
 * Creates a scrolling manager for programmatic scrolling operations
 */
export const createScrollingManager = (deps: ScrollingDependencies) => {
  const {
    state,
    config,
    container,
    loadPage,
    itemMeasurement,
    collection,
    scrollJumpManager,
  } = deps;

  /**
   * Scroll to a specific index in the list
   * @param index 0-based index to scroll to
   * @param position Position ('start', 'center', 'end')
   * @param animate Whether to animate the scroll (defaults to false for instant scroll)
   */
  const scrollToIndex = async (
    index: number,
    position: ScrollToPosition = "start",
    animate: boolean = false
  ): Promise<void> => {
    // Validate index
    if (index < 0) {
      console.warn(`Invalid index: ${index}. Index must be 0 or greater.`);
      return;
    }

    console.log("🔗 [ScrollToIndex] Scrolling to index:", index);

    // Check if we're in static mode
    if (state.useStatic) {
      // For static lists, check if index is within bounds
      if (index >= state.items.length) {
        console.warn(
          `Index ${index} is out of bounds. List has ${state.items.length} items.`
        );
        return;
      }

      // Calculate scroll position directly
      const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
      let scrollPosition = index * itemHeight;

      // Adjust position based on requested alignment
      if (position === "center") {
        scrollPosition = scrollPosition - state.containerHeight / 2;
      } else if (position === "end") {
        scrollPosition = scrollPosition - state.containerHeight + itemHeight;
      }

      // Ensure we don't scroll past boundaries
      scrollPosition = Math.max(0, scrollPosition);
      const maxScroll = Math.max(
        0,
        state.items.length * itemHeight - state.containerHeight
      );
      scrollPosition = Math.min(scrollPosition, maxScroll);

      // Perform the scroll
      if (animate) {
        container.scrollTo({ top: scrollPosition, behavior: "smooth" });
      } else {
        container.scrollTop = scrollPosition;
      }
      return;
    }

    // For dynamic lists, calculate which page contains this index
    const pageSize = config.pageSize || 20;
    const targetPage = Math.floor(index / pageSize) + 1; // Pages are 1-based

    if (!loadPage) {
      console.error("❌ [ScrollToIndex] loadPage function not available");
      return;
    }

    try {
      // Use specialized scroll-to-index function with precise viewport calculation
      if (scrollJumpManager?.loadScrollToIndexWithBackgroundRanges) {
        await scrollJumpManager.loadScrollToIndexWithBackgroundRanges(
          index,
          animate
        );
      } else if (scrollJumpManager?.loadScrollJumpWithBackgroundRanges) {
        await scrollJumpManager.loadScrollJumpWithBackgroundRanges(
          targetPage,
          animate
        );
      } else {
        // Fallback to simple page loading
        await loadPage(targetPage, {
          setScrollPosition: true,
          replaceCollection: false,
          animate,
        });
      }

      // After loading, scroll to the exact position within the page
      setTimeout(() => {
        const itemHeight = config.itemHeight || DEFAULTS.itemHeight;
        let scrollPosition = index * itemHeight;

        // Adjust position based on requested alignment
        if (position === "center") {
          scrollPosition = scrollPosition - state.containerHeight / 2;
        } else if (position === "end") {
          scrollPosition = scrollPosition - state.containerHeight + itemHeight;
        }

        // Ensure we don't scroll past boundaries
        scrollPosition = Math.max(0, scrollPosition);

        // Perform the scroll
        if (animate) {
          container.scrollTo({ top: scrollPosition, behavior: "smooth" });
        } else {
          container.scrollTop = scrollPosition;
        }
      }, 100); // Small delay to ensure page is loaded and rendered
    } catch (error) {
      console.error(
        `❌ [ScrollToIndex] Failed to scroll to index ${index}:`,
        error
      );
    }
  };

  /**
   * Scroll to a specific item by ID using backend lookup
   * @param itemId Item ID to scroll to
   * @param position Position ('start', 'center', 'end')
   * @param animate Whether to animate the scroll (defaults to false for instant scroll)
   */
  const scrollToItemById = async (
    itemId: string,
    position: ScrollToPosition = "start",
    animate: boolean = false
  ): Promise<void> => {
    if (!collection) {
      console.error("❌ [ScrollToItemById] Collection name not provided");
      return;
    }

    try {
      // Make API call to find the item's position
      const response = await fetch(
        `/api/${collection}/find-position/${itemId}`
      );

      if (!response.ok) {
        console.error(
          `❌ [ScrollToItemById] API call failed: ${response.status} ${response.statusText}`
        );
        return;
      }

      const result = await response.json();

      if (!result.exists) {
        console.warn(`⚠️ [ScrollToItemById] Item ${itemId} not found`);
        return;
      }

      // Use scrollToIndex to navigate to the item
      await scrollToIndex(result.index, position, animate);

      // Now scroll to the item (should be loaded)
      requestAnimationFrame(() => {
        scrollToItem(itemId, position, animate);
      });
    } catch (error) {
      console.error(
        `❌ [ScrollToItemById] Failed to find item ${itemId}:`,
        error
      );
    }
  };

  /**
   * Scroll to a specific item by ID
   * @param itemId Item ID to scroll to
   * @param position Position ('start', 'center', 'end')
   * @param animate Whether to animate the scroll (defaults to true for backward compatibility)
   */
  const scrollToItem = (
    itemId: string,
    position: ScrollToPosition = "start",
    animate: boolean = true
  ): void => {
    const itemIndex = state.items.findIndex(
      (item) => item && item.id === itemId
    );
    if (itemIndex === -1) return;

    const itemHeight = config.itemHeight || 48;
    let scrollPosition = itemIndex * itemHeight;

    // Adjust position based on requested alignment
    if (position === "center") {
      scrollPosition = scrollPosition - state.containerHeight / 2;
    } else if (position === "end") {
      scrollPosition = scrollPosition - state.containerHeight + itemHeight;
    }

    // Ensure we don't scroll past boundaries
    scrollPosition = Math.max(0, scrollPosition);

    // Perform the scroll
    if (animate) {
      container.scrollTo({ top: scrollPosition, behavior: "smooth" });
    } else {
      container.scrollTop = scrollPosition;
    }
  };

  return {
    scrollToItem,
    scrollToIndex,
    scrollToItemById,
  };
};
