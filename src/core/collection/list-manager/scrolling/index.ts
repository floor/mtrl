import {
  ListManagerState,
  ListManagerConfig,
  ScrollToPosition,
} from "../types";

/**
 * Scrolling manager dependencies
 */
export interface ScrollingDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  container: HTMLElement;
}

/**
 * Creates a scrolling manager for handling scroll-related functionality
 * @param deps Dependencies from the main list manager
 * @returns Scrolling management functions
 */
export const createScrollingManager = (deps: ScrollingDependencies) => {
  const { state, config, container } = deps;

  /**
   * Scroll to a specific item by ID
   * @param itemId Item ID to scroll to
   * @param position Position ('start', 'center', 'end')
   */
  const scrollToItem = (
    itemId: string,
    position: ScrollToPosition = "start"
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

    container.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: "smooth",
    });
  };

  return {
    scrollToItem,
  };
};
