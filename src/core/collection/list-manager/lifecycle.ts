import {
  ListManagerState,
  ListManagerConfig,
  ListManagerElements,
} from "./types";
import { PAGINATION, PLACEHOLDER } from "./constants";

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
  loadPage: (
    pageNumber: number,
    options?: { setScrollPosition?: boolean; replaceCollection?: boolean }
  ) => Promise<{ hasNext: boolean; items: any[] }>;
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
    // Set mounted flag
    state.mounted = true;

    // Flag to track initial load to prevent double rendering
    let isInitialLoad = true;

    // Safety timeout to ensure flag is cleared even in edge cases
    setTimeout(() => {
      isInitialLoad = false;
    }, 1000);

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
        // Also skip during initial load to prevent double rendering
        if (
          justJumpedToPage ||
          isPreloadingPages ||
          state.loading ||
          isInitialLoad
        ) {
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
          // Clear initial load flag for static data
          isInitialLoad = false;
          // Force an update after adding items
          requestAnimationFrame(() => {
            updateVisibleItems(state.scrollTop);
          });
        })
        .catch((err) => {
          // Clear initial load flag even if there's an error
          isInitialLoad = false;
          // Silently handle static items collection errors
        });
    } else if (!state.useStatic) {
      // Initial load for API data - load page 1 first, then preload additional pages in background
      loadPage(1, {
        setScrollPosition: true,
        replaceCollection: true,
      })
        .then(() => {
          // Clear initial load flag after first page is loaded
          isInitialLoad = false;

          // Background preloading for smoother scrolling (for slow connections)
          const rangesToFetch =
            config.initialRangesToFetch || PAGINATION.INITIAL_RANGES_TO_FETCH;

          if (rangesToFetch > 1) {
            if (PLACEHOLDER.DEBUG_LOGGING) {
              console.log(
                `🔄 [InitialLoad] Preloading pages 2-${rangesToFetch} in background`
              );
            }

            // Load additional pages in background without affecting page state
            setTimeout(async () => {
              for (let i = 2; i <= rangesToFetch; i++) {
                try {
                  // Load additional pages in background (don't update page state or scroll position)
                  await loadPage(i, {
                    setScrollPosition: false, // Don't change scroll position
                    replaceCollection: false, // Don't clear existing items
                  });

                  if (PLACEHOLDER.DEBUG_LOGGING) {
                    console.log(`✅ [InitialLoad] Page ${i} preloaded`);
                  }

                  // Small delay between requests to avoid overwhelming the API
                  if (i < rangesToFetch) {
                    await new Promise((resolve) => setTimeout(resolve, 50));
                  }
                } catch (error) {
                  // Silently handle background loading errors
                  // Don't block the UI if background loading fails
                  console.error(
                    `❌ [InitialLoad] Failed to preload page ${i}:`,
                    error
                  );
                  break; // Stop preloading on first error to avoid cascade failures
                }
              }

              if (PLACEHOLDER.DEBUG_LOGGING) {
                console.log(`✅ [InitialLoad] Background preloading completed`);
              }
            }, 100); // Small delay to ensure main page renders first
          } else {
            if (PLACEHOLDER.DEBUG_LOGGING) {
              console.log(
                `🔄 [InitialLoad] No background preloading (initialRangesToFetch: ${rangesToFetch})`
              );
            }
          }
        })
        .catch((err) => {
          // Clear initial load flag even if there's an error
          isInitialLoad = false;
          // Silently handle initial page loading errors
        });
    } else {
      // No static data and no API data - clear flag immediately
      isInitialLoad = false;
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

    // Return cleanup function
    return () => {
      // Mark as unmounted
      state.mounted = false;

      // Clear any pending timeouts
      clearTimeouts();

      // Run all cleanup functions
      cleanupFunctions.forEach((fn) => fn());
      cleanupFunctions.length = 0;
    };
  };

  return {
    initialize,
  };
};
