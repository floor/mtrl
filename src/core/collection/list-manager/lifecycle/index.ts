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
  loadNext: () => Promise<{ hasNext: boolean; items: any[] }>;
  loadPage: (pageNumber: number) => Promise<{ hasNext: boolean; items: any[] }>;
  itemsCollection: any;
  initialItems: any[];
  cleanupFunctions: (() => void)[];
  createScrollTracker: any;
  COLLECTION_EVENTS: any;
  getPaginationFlags: () => {
    justJumpedToPage: boolean;
    isPreloadingPages: boolean;
  };
  getTimeoutFlags: () => {
    pageJumpTimeout: number | null;
    scrollStopTimeout: NodeJS.Timeout | null;
  };
  clearTimeouts: () => void;
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
    loadNext,
    loadPage,
    itemsCollection,
    initialItems,
    cleanupFunctions,
    createScrollTracker,
    COLLECTION_EVENTS,
    getPaginationFlags,
    getTimeoutFlags,
    clearTimeouts,
  } = deps;

  /**
   * Initialize the list manager and set up event listeners
   * @returns Cleanup function
   */
  const initialize = (): (() => void) => {
    console.log(`🚀 [Initialize] Starting list manager initialization`);

    // Set mounted flag
    state.mounted = true;

    // Store container dimensions
    state.containerHeight = container.clientHeight;

    // Set up scroll tracking with callbacks
    const scrollTracker = createScrollTracker(container, elements, config, {
      onScroll: updateVisibleItems,
      onLoadMore: loadNext,
    });

    const scrollTrackingCleanup = scrollTracker.setup();
    cleanupFunctions.push(scrollTrackingCleanup);

    // Subscribe to collection changes
    const unsubscribe = itemsCollection.subscribe(({ event }) => {
      if (event === COLLECTION_EVENTS.CHANGE) {
        const { justJumpedToPage, isPreloadingPages } = getPaginationFlags();

        // Skip updates if we're jumping to a page or preloading
        if (justJumpedToPage || isPreloadingPages) {
          return;
        }

        // Mark total height as dirty to trigger recalculation
        state.totalHeightDirty = true;

        // Use rAF to delay update to next frame for better performance
        requestAnimationFrame(() => {
          updateVisibleItems(state.scrollTop);
        });
      }
    });

    cleanupFunctions.push(unsubscribe);

    // If using static items, add them to the collection right away
    if (state.useStatic && initialItems && initialItems.length > 0) {
      itemsCollection
        .add(initialItems)
        .then(() => {
          // Force an update after adding items
          requestAnimationFrame(() => {
            updateVisibleItems(state.scrollTop);
          });
        })
        .catch((err) => {
          console.error("Error adding static items to collection:", err);
        });
    } else if (!state.useStatic) {
      // Initial load for API data - use loadPage(1) for consistent initialization
      console.log(
        "🚀 [Initialize] Using loadPage(1) for consistent initialization"
      );
      loadPage(1)
        .then(() => {
          console.log("✅ [Initialize] Initial page load complete");
        })
        .catch((err) => {
          console.error("Error loading initial page:", err);
        });
    }

    // Handle resize events with ResizeObserver if available
    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver((entries) => {
        // Only update if container dimensions changed
        for (const entry of entries) {
          if (entry.target === container) {
            const newHeight = container.clientHeight;
            if (newHeight !== state.containerHeight) {
              state.containerHeight = newHeight;

              // Debounce resize handling
              if (state.resizeRAF) {
                cancelAnimationFrame(state.resizeRAF);
              }

              state.resizeRAF = requestAnimationFrame(() => {
                updateVisibleItems(state.scrollTop);
                state.resizeRAF = null;
              });
            }
          }
        }
      });

      resizeObserver.observe(container);

      cleanupFunctions.push(() => {
        resizeObserver.disconnect();

        if (state.resizeRAF) {
          cancelAnimationFrame(state.resizeRAF);
          state.resizeRAF = null;
        }
      });
    } else {
      // Fallback to window resize event
      let resizeTimeout: number | null = null;

      const handleResize = () => {
        // Debounce resize event
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        resizeTimeout = window.setTimeout(() => {
          const newHeight = container.clientHeight;
          if (newHeight !== state.containerHeight) {
            state.containerHeight = newHeight;
            updateVisibleItems(state.scrollTop);
          }

          resizeTimeout = null;
        }, 100);
      };

      // Use 'as any' to bypass TypeScript error with window.addEventListener
      (window as any).addEventListener("resize", handleResize, {
        passive: true,
      });

      cleanupFunctions.push(() => {
        (window as any).removeEventListener("resize", handleResize);

        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
          resizeTimeout = null;
        }
      });
    }

    console.log(`✅ [Initialize] List manager initialized successfully`);

    // Return cleanup function
    return () => {
      console.log(`🧹 [Cleanup] Cleaning up list manager`);

      // Mark as unmounted
      state.mounted = false;

      // Clear any pending timeouts
      clearTimeouts();

      // Run all cleanup functions
      cleanupFunctions.forEach((fn) => fn());
      cleanupFunctions.length = 0;

      console.log(`✅ [Cleanup] List manager cleanup complete`);
    };
  };

  return {
    initialize,
  };
};
