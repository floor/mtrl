import { ListManagerConfig } from "../types";
import { SCROLL, OFFSET } from "../constants";

/**
 * Calculate viewport pages for a target index
 */
export const calcViewportPages = (
  idx: number,
  vh: number,
  ih: number,
  ps: number,
  sp: number,
  total?: number
) => {
  const page = Math.floor(idx / ps) + 1;
  const buffer = ih;
  const start = Math.max(0, sp - buffer);
  const end = sp + vh + buffer;
  const startIdx = Math.floor(start / ih);
  const endIdx = Math.floor(end / ih);
  const startPage = Math.floor(startIdx / ps) + 1;
  const endPage = Math.floor(endIdx / ps) + 1;
  const maxPage = total ? Math.ceil(total / ps) : endPage;

  const pages: number[] = [];
  for (let p = Math.max(1, startPage); p <= Math.min(endPage, maxPage); p++) {
    pages.push(p);
  }

  return { page, pages, items: Math.ceil(vh / ih) + 2 };
};

/**
 * Calculate smart viewport needs for offset-based pagination
 * Uses configurable viewport multiplier for smooth scrolling experience
 * @param scrollTop Current scroll position
 * @param containerHeight Height of the viewport container
 * @param itemHeight Height of each item
 * @param totalItems Total number of items (optional)
 * @param viewportMultiplier How many viewports worth of data to load (defaults from constants)
 * @returns Offset and limit for smooth data loading
 */
export const calcViewportOffset = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems?: number,
  viewportMultiplier: number = OFFSET.VIEWPORT_MULTIPLIER
): {
  offset: number;
  limit: number;
  startIndex: number;
  endIndex: number;
} => {
  // Calculate which item indices should be visible
  const startIndex = Math.floor(scrollTop / itemHeight);
  const itemsInViewport = Math.ceil(containerHeight / itemHeight);

  // 🎯 VIEWPORT MULTIPLIER: Use configurable multiplier for smooth scrolling!
  // This prevents holes during scrolling and provides better UX
  const totalItemsToLoad = Math.ceil(itemsInViewport * viewportMultiplier);

  // Start loading a bit before the current position for smooth scrolling
  const bufferBefore = Math.floor(itemsInViewport * OFFSET.BUFFER_MULTIPLIER);
  const loadStartIndex = Math.max(0, startIndex - bufferBefore);
  const loadEndIndex = loadStartIndex + totalItemsToLoad;

  // Constrain to valid range if totalItems is known
  const constrainedStartIndex = Math.max(0, loadStartIndex);
  const constrainedEndIndex = totalItems
    ? Math.min(loadEndIndex, totalItems)
    : loadEndIndex;

  // Apply min/max limits from constants
  const limit = Math.max(
    OFFSET.MIN_LOAD_SIZE,
    Math.min(OFFSET.MAX_LOAD_SIZE, constrainedEndIndex - constrainedStartIndex)
  );

  console.log(
    `🎯 [OFFSET-CALC] Smart loading: scrollTop=${scrollTop}, loading items ${constrainedStartIndex}-${
      constrainedStartIndex + limit - 1
    } (${limit} items = ${itemsInViewport} per viewport × ${viewportMultiplier})`
  );

  return {
    offset: constrainedStartIndex,
    limit,
    startIndex: constrainedStartIndex,
    endIndex: constrainedStartIndex + limit,
  };
};

/**
 * Calculate scroll position with bounds
 */
export const calcScrollPos = (
  idx: number,
  pos: "start" | "center" | "end",
  ih: number,
  ch: number,
  maxItems?: number
) => {
  let sp = idx * ih;
  if (pos === "center") sp -= ch / 2;
  else if (pos === "end") sp -= ch - ih;

  sp = Math.max(0, sp);
  if (maxItems) {
    const max = Math.max(0, maxItems * ih - ch);
    sp = Math.min(sp, max);
  }
  return sp;
};

/**
 * Development-only logging helper
 */
export const devLog = (msg: string, data?: any) => {
  if (process.env.NODE_ENV === "development") {
    console.log(msg, data);
  }
};

/**
 * Production error logging
 */
export const logError = (msg: string, error?: any) => {
  console.error(msg, error?.message || error);
};

/**
 * Check if scroll difference is significant enough to process
 */
export const isSignificantScroll = (
  currentPos: number,
  lastPos: number,
  threshold = SCROLL.THRESHOLD
): boolean => {
  return Math.abs(currentPos - lastPos) >= threshold;
};
