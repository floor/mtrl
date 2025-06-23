import {
  PageEvent,
  PageChangeEventData,
  PAGE_EVENTS,
  ListManagerConfig,
} from "../types";

/**
 * Page event observer function type
 */
export type PageEventObserver = (
  event: PageEvent,
  data: PageChangeEventData
) => void;

/**
 * Creates a page event manager for handling page change events
 * @param config Configuration for the list manager
 * @returns Page event management functions
 */
export const createPageEventManager = (config: ListManagerConfig) => {
  const pageEventObservers = new Set<PageEventObserver>();
  let lastEmittedPage: number | null = null;

  /**
   * Subscribe to page change events
   * @param callback Function to call when page changes
   * @returns Unsubscribe function
   */
  const onPageChange = (callback: PageEventObserver) => {
    pageEventObservers.add(callback);
    return () => {
      pageEventObservers.delete(callback);
    };
  };

  /**
   * Emit page change event
   * @param event Event type
   * @param data Event data
   */
  const emitPageChange = (event: PageEvent, data: PageChangeEventData) => {
    console.log(`📢 [PageEvent] Emitting ${event}:`, data);
    pageEventObservers.forEach((callback) => {
      try {
        callback(event, data);
      } catch (error) {
        console.error("Error in page change event handler:", error);
      }
    });
  };

  /**
   * Calculate current page based on scroll position
   * @param scrollTop Current scroll position
   * @param paginationStrategy Current pagination strategy
   * @returns Current page number
   */
  const calculateCurrentPage = (
    scrollTop: number,
    paginationStrategy?: string
  ): number => {
    if (paginationStrategy !== "page") return 1;

    // Ensure we have valid numbers to avoid NaN or undefined results
    const pageSize = config.pageSize || 20;
    const itemHeight = config.itemHeight || 48;
    const validScrollTop = Number(scrollTop) || 0;

    // Guard against division by zero or invalid calculations
    if (pageSize <= 0 || itemHeight <= 0) {
      return 1;
    }

    const pageHeight = pageSize * itemHeight;

    // Calculate which page we're currently viewing based on scroll position
    const currentPage = Math.floor(validScrollTop / pageHeight) + 1;
    return Math.max(1, currentPage);
  };

  /**
   * Check if current page has changed during scroll and emit event
   * @param scrollTop Current scroll position
   * @param paginationStrategy Current pagination strategy
   */
  const checkPageChange = (
    scrollTop: number,
    paginationStrategy?: string
  ): void => {
    if (paginationStrategy !== "page") return;

    const currentPage = calculateCurrentPage(scrollTop, paginationStrategy);

    if (lastEmittedPage !== null && lastEmittedPage !== currentPage) {
      emitPageChange(PAGE_EVENTS.SCROLL_PAGE_CHANGE, {
        page: currentPage,
        previousPage: lastEmittedPage,
        scrollPosition: scrollTop,
        trigger: "scroll",
      });
    }

    lastEmittedPage = currentPage;
  };

  /**
   * Reset the last emitted page (useful when initializing or resetting)
   */
  const resetLastEmittedPage = () => {
    lastEmittedPage = null;
  };

  /**
   * Get the current last emitted page
   */
  const getLastEmittedPage = () => lastEmittedPage;

  return {
    onPageChange,
    emitPageChange,
    calculateCurrentPage,
    checkPageChange,
    resetLastEmittedPage,
    getLastEmittedPage,
  };
};
