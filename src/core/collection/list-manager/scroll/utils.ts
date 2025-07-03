import { ListManagerConfig } from "../types";
import { SCROLL } from "../constants";

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
 * Calculate ultra-precise viewport needs for offset-based pagination
 * Loads EXACTLY what's visible for maximum efficiency
 * @param scrollTop Current scroll position
 * @param containerHeight Height of the viewport container
 * @param itemHeight Height of each item
 * @param totalItems Total number of items (optional)
 * @returns Offset and limit for precise data loading
 */
export const calcViewportOffset = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems?: number
): {
  offset: number;
  limit: number;
  startIndex: number;
  endIndex: number;
} => {
  // Calculate which item indices should be visible
  const startIndex = Math.floor(scrollTop / itemHeight);
  const itemsInViewport = Math.ceil(containerHeight / itemHeight);

  // 🎯 ULTRA-PRECISE: No buffer for offset strategy!
  // Since we load on-demand with virtual positioning, we can load EXACTLY what's visible
  const endIndex = startIndex + itemsInViewport;

  // Constrain to valid range if totalItems is known
  const constrainedStartIndex = Math.max(0, startIndex);
  const constrainedEndIndex = totalItems
    ? Math.min(endIndex, totalItems)
    : endIndex;

  const limit = Math.max(1, constrainedEndIndex - constrainedStartIndex);

  console.log(
    `🎯 [OFFSET-CALC] Ultra-precise loading: scrollTop=${scrollTop}, viewport needs items ${constrainedStartIndex}-${
      constrainedEndIndex - 1
    } (${limit} items exactly)`
  );

  return {
    offset: constrainedStartIndex,
    limit,
    startIndex: constrainedStartIndex,
    endIndex: constrainedEndIndex,
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
