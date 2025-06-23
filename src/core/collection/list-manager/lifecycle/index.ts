import {
  ListManagerState,
  ListManagerConfig,
  ListManagerElements,
} from "../types";

/**
 * Lifecycle management dependencies
 */
export interface LifecycleDependencies {
  state: ListManagerState;
  config: ListManagerConfig;
  elements: ListManagerElements;
  container: HTMLElement;
  updateVisibleItems: (scrollTop?: number, isPageJump?: boolean) => void;
  checkLoadMore: (scrollTop: number) => void;
}

/**
 * Creates a lifecycle manager for initialization and cleanup
 * @param deps Dependencies from the main list manager
 * @returns Lifecycle management functions
 */
export const createLifecycleManager = (deps: LifecycleDependencies) => {
  const {
    state,
    config,
    elements,
    container,
    updateVisibleItems,
    checkLoadMore,
  } = deps;
  let resizeObserver: ResizeObserver | null = null;

  /**
   * Initialize the list manager and set up event listeners
   * @returns Cleanup function
   */
  const initialize = (): (() => void) => {
    console.log(`🚀 [Initialize] Starting list manager initialization`);

    // Mark as mounted
    state.mounted = true;

    // Store container dimensions
    state.containerHeight = container.clientHeight;

    // Create scroll event handler
    const scrollHandler = () => {
      if (!state.mounted) return;

      const scrollTop = container.scrollTop;
      updateVisibleItems(scrollTop);
    };

    // Create resize handler
    const handleResize = () => {
      if (!state.mounted) return;

      console.log(`📐 [Resize] Container resized`);

      // Update container dimensions
      state.containerHeight = container.clientHeight;

      // Recalculate visible items
      updateVisibleItems(state.scrollTop);
    };

    // Set up scroll listener
    container.addEventListener("scroll", scrollHandler, { passive: true });

    // Set up resize observer if available
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    } else {
      // Fallback to window resize
      window.addEventListener("resize", handleResize);
    }

    console.log(`✅ [Initialize] List manager initialized successfully`);

    // Return cleanup function
    return () => {
      console.log(`🧹 [Cleanup] Cleaning up list manager`);

      // Mark as unmounted
      state.mounted = false;

      // Remove scroll listener
      container.removeEventListener("scroll", scrollHandler);

      // Clean up resize observer or window listener
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      } else {
        window.removeEventListener("resize", handleResize);
      }

      console.log(`✅ [Cleanup] List manager cleanup complete`);
    };
  };

  return {
    initialize,
  };
};
