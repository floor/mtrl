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
