import { VIEWPORT } from "../constants";

/**
 * Scroll-based viewport calculations
 */

export interface ViewportRange {
  start: number;
  end: number;
}

/**
 * Calculate visible range for fixed height items
 */
export const calcVisibleRange = (
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  bufferSize = VIEWPORT.RENDER_BUFFER_SIZE,
  overscan = VIEWPORT.OVERSCAN_COUNT
): ViewportRange => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const endIndex = startIndex + visibleCount;

  const start = Math.max(0, startIndex - bufferSize - overscan);
  const end = Math.min(totalItems, endIndex + bufferSize + overscan);

  return { start, end };
};

// Note: isLoadThresholdReached is available in utils/viewport.ts

/**
 * Calculate current page from scroll position
 */
export const calcPageFromScroll = (
  scrollTop: number,
  pageSize: number,
  itemHeight: number
): number => {
  if (pageSize <= 0 || itemHeight <= 0) return 1;
  const pageHeight = pageSize * itemHeight;
  return Math.max(1, Math.floor(scrollTop / pageHeight) + 1);
};
