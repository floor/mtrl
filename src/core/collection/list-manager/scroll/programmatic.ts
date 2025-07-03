/**
 * Programmatic Scrolling Utilities
 * Simple utility functions for calculating scroll positions
 */

import {
  ListManagerState,
  ListManagerConfig,
  ScrollToPosition,
} from "../types";
import { DEFAULTS } from "../constants";

/**
 * Calculate scroll position for a given index
 * @param index Target index
 * @param position Alignment position ('start', 'center', 'end')
 * @param itemHeight Height of each item
 * @param containerHeight Height of the container
 * @returns Calculated scroll position
 */
export const calculateScrollPosition = (
  index: number,
  position: ScrollToPosition = "start",
  itemHeight: number,
  containerHeight: number
): number => {
  let scrollPosition = index * itemHeight;

  // Adjust position based on requested alignment
  if (position === "center") {
    scrollPosition = scrollPosition - containerHeight / 2;
  } else if (position === "end") {
    scrollPosition = scrollPosition - containerHeight + itemHeight;
  }

  // Ensure we don't scroll past boundaries
  return Math.max(0, scrollPosition);
};

/**
 * Validate scroll index bounds
 * @param index Index to validate
 * @param maxItems Maximum number of items
 * @returns True if valid, false otherwise
 */
export const validateScrollIndex = (
  index: number,
  maxItems: number
): boolean => {
  return index >= 0 && index < maxItems;
};

/**
 * Execute a scroll operation on a container
 * @param container HTML element to scroll
 * @param position Target scroll position
 * @param animate Whether to animate the scroll
 */
export const executeScroll = (
  container: HTMLElement,
  position: number,
  animate: boolean = false
): void => {
  if (animate) {
    container.scrollTo({ top: position, behavior: "smooth" });
  } else {
    container.scrollTop = position;
  }
};

/**
 * Find item index by ID in the state
 * @param itemId ID to search for
 * @param items Array of items to search in
 * @returns Index if found, -1 otherwise
 */
export const findItemIndex = (itemId: string, items: any[]): number => {
  return items.findIndex((item) => item && item.id === itemId);
};
