/**
 * Optimized Scroll Manager
 * Uses RAF throttling, caching, and passive listeners for maximum performance
 */

export interface OptimizedScrollConfig {
  container: HTMLElement;
  onScroll: (scrollTop: number) => void;
  onLoadMore?: () => void;
  throttleMs?: number;
  enablePassive?: boolean;
}

export interface OptimizedScrollManager {
  setup: () => () => void;
  destroy: () => void;
  getCurrentScrollTop: () => number;
}

/**
 * Creates an optimized scroll manager with RAF throttling
 */
export const createOptimizedScrollManager = (
  config: OptimizedScrollConfig
): OptimizedScrollManager => {
  const { container, onScroll, onLoadMore, enablePassive = true } = config;

  // Performance optimizations
  let rafId: number | null = null;
  let lastScrollTop = 0;
  let lastKnownScrollTop = 0;
  let isScrolling = false;

  // Cache frequently accessed properties
  const containerHeight = container.clientHeight;
  let scrollHeight = container.scrollHeight;

  // Passive event listener options for better performance
  const eventOptions: boolean | AddEventListenerOptions = enablePassive
    ? { passive: true }
    : false;

  /**
   * RAF-throttled scroll handler - only runs at 60fps max
   */
  const optimizedScrollHandler = () => {
    if (!isScrolling) return;

    const currentScrollTop = container.scrollTop;

    // Skip if scroll position hasn't changed (bounce back from rubber banding)
    if (currentScrollTop === lastScrollTop) {
      rafId = requestAnimationFrame(optimizedScrollHandler);
      return;
    }

    lastScrollTop = currentScrollTop;
    lastKnownScrollTop = currentScrollTop;

    // Call the scroll callback
    onScroll(currentScrollTop);

    // Check for load more if enabled
    if (onLoadMore && shouldLoadMore(currentScrollTop)) {
      onLoadMore();
    }

    // Continue RAF loop while scrolling
    rafId = requestAnimationFrame(optimizedScrollHandler);
  };

  /**
   * Optimized load more detection
   */
  const shouldLoadMore = (scrollTop: number): boolean => {
    // Cache scroll height on demand
    const currentScrollHeight = container.scrollHeight;
    if (currentScrollHeight !== scrollHeight) {
      scrollHeight = currentScrollHeight;
    }

    const threshold = scrollHeight * 0.8; // 80% threshold
    return scrollTop + containerHeight >= threshold;
  };

  /**
   * Scroll start handler - begins RAF loop
   */
  const handleScrollStart = () => {
    if (!isScrolling) {
      isScrolling = true;
      rafId = requestAnimationFrame(optimizedScrollHandler);
    }
  };

  /**
   * Scroll end handler - ends RAF loop
   */
  const handleScrollEnd = () => {
    isScrolling = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };

  // Debounced scroll end detection
  let scrollEndTimer: NodeJS.Timeout | null = null;
  const debouncedScrollEnd = () => {
    if (scrollEndTimer) {
      clearTimeout(scrollEndTimer);
    }
    scrollEndTimer = setTimeout(handleScrollEnd, 150);
  };

  /**
   * Main scroll event handler
   */
  const handleScroll = () => {
    handleScrollStart();
    debouncedScrollEnd();
  };

  /**
   * Setup optimized scroll tracking
   */
  const setup = (): (() => void) => {
    // Add optimized scroll listener
    container.addEventListener("scroll", handleScroll, eventOptions);

    // Cleanup function
    return () => {
      container.removeEventListener("scroll", handleScroll, eventOptions);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer);
      }
    };
  };

  /**
   * Destroy and cleanup
   */
  const destroy = () => {
    handleScrollEnd();
    if (scrollEndTimer) {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = null;
    }
  };

  /**
   * Get current scroll position (cached)
   */
  const getCurrentScrollTop = (): number => {
    return lastKnownScrollTop;
  };

  return {
    setup,
    destroy,
    getCurrentScrollTop,
  };
};
