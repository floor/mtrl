// src/core/collection/list-manager/scroll-tracker.ts
import { ListManagerElements, ScrollStrategy, ListManagerConfig } from './types';
import { createSentinels, updateSentinelPositions } from './dom-elements';

/**
 * Common interface for scroll tracking strategies
 */
export interface ScrollTracker {
  setup(): () => void;
  getScrollTop(): number;
}

/**
 * Factory to create the appropriate scroll tracker based on strategy
 * @param container Container element
 * @param elements DOM elements
 * @param config List manager configuration
 * @param callbacks Callbacks for scroll events
 * @returns ScrollTracker implementation
 */
export function createScrollTracker(
  container: HTMLElement,
  elements: ListManagerElements,
  config: ListManagerConfig,
  callbacks: {
    onScroll: (scrollTop: number) => void;
    onLoadMore: () => void;
  }
): ScrollTracker {
  const { scrollStrategy = 'scroll' } = config;
  
  switch (scrollStrategy) {
    case 'intersection':
      return createIntersectionScrollTracker(container, elements, callbacks);
      
    case 'hybrid':
      return createHybridScrollTracker(container, elements, callbacks);
      
    case 'scroll':
    default:
      return createTraditionalScrollTracker(container, config, callbacks);
  }
}

/**
 * Creates a scroll tracker using traditional scroll events
 */
function createTraditionalScrollTracker(
  container: HTMLElement,
  config: ListManagerConfig,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  let scrollRAF: number | null = null;
  let lastScrollTop = 0;
  const scrollThreshold = 5; // Only process changes larger than this
  const throttleMs = config.throttleMs || 16; // Default to 16ms (~60fps)
  
  // Calculate how often we need to process scroll events
  // based on the configured throttle value
  let lastProcessTime = 0;
  
  return {
    /**
     * Set up scroll tracking
     * @returns Cleanup function
     */
    setup: (): () => void => {
      // Create optimized handler function
      const scrollHandler = (e: Event): void => {
        const currentScrollTop = (e.target as HTMLElement).scrollTop;
        
        // Skip processing if scroll amount is too small
        if (Math.abs(currentScrollTop - lastScrollTop) < scrollThreshold) {
          return;
        }
        
        // Apply throttling based on time
        const now = Date.now();
        if (now - lastProcessTime < throttleMs) {
          // If we're already waiting for a frame, don't schedule another one
          if (scrollRAF) return;
          
          // Schedule processing on next frame
          scrollRAF = requestAnimationFrame(() => {
            lastScrollTop = currentScrollTop;
            lastProcessTime = Date.now();
            callbacks.onScroll(currentScrollTop);
            scrollRAF = null;
          });
          
          return;
        }
        
        // Process immediately if enough time has passed
        lastScrollTop = currentScrollTop;
        lastProcessTime = now;
        callbacks.onScroll(currentScrollTop);
      };
      
      // Add listener with passive option for better performance
      container.addEventListener('scroll', scrollHandler, { passive: true });
      
      // Return cleanup function
      return () => {
        container.removeEventListener('scroll', scrollHandler);
        
        if (scrollRAF) {
          cancelAnimationFrame(scrollRAF);
          scrollRAF = null;
        }
      };
    },
    
    /**
     * Gets current scroll position
     */
    getScrollTop: (): number => {
      return container.scrollTop;
    }
  };
}

/**
 * Creates a scroll tracker using IntersectionObserver
 */
function createIntersectionScrollTracker(
  container: HTMLElement,
  elements: ListManagerElements,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  let intersectionObserver: IntersectionObserver | null = null;
  let throttledScrollHandler: ((e: Event) => void) | null = null;
  let scrollTimeout: number | null = null;
  let isIntersecting = false;
  
  return {
    /**
     * Set up intersection observer for scroll tracking
     * @returns Cleanup function
     */
    setup: (): () => void => {
      // Fall back to scroll events if IntersectionObserver not supported
      if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported, falling back to scroll events');
        // Create a minimal config with the required renderItem property
        const minimalConfig: ListManagerConfig = {
          renderItem: () => document.createElement('div')
        };
        const tracker = createTraditionalScrollTracker(container, minimalConfig, callbacks);
        return tracker.setup();
      }
      
      // Add sentinel elements if not already present
      if (!elements.topSentinel || !elements.bottomSentinel) {
        Object.assign(elements, createSentinels(elements));
      }
      
      // Create intersection observer
      intersectionObserver = new IntersectionObserver((entries) => {
        // Early exit if we're already handling an intersection
        if (isIntersecting) return;
        
        isIntersecting = true;
        
        let needsUpdate = false;
        let bottomVisible = false;
        
        entries.forEach(entry => {
          // Top sentinel handles scrolling up
          if (entry.target === elements.topSentinel && entry.isIntersecting) {
            needsUpdate = true;
          }
          
          // Bottom sentinel handles loading more content
          if (entry.target === elements.bottomSentinel && entry.isIntersecting) {
            bottomVisible = true;
            needsUpdate = true;
          }
        });
        
        // Load more content if bottom is visible
        if (bottomVisible) {
          // Debounce load more operations
          if (scrollTimeout !== null) {
            clearTimeout(scrollTimeout);
          }
          
          scrollTimeout = window.setTimeout(() => {
            callbacks.onLoadMore();
            scrollTimeout = null;
          }, 100);
        }
        
        // Update visible items if needed
        if (needsUpdate) {
          callbacks.onScroll(container.scrollTop);
        }
        
        // Reset flag after a short delay
        setTimeout(() => {
          isIntersecting = false;
        }, 100);
      }, { 
        root: container,
        // Use a large margin to trigger earlier
        rootMargin: '400px 0px 400px 0px',
        threshold: 0
      });
      
      // Start observing
      if (elements.topSentinel) {
        intersectionObserver.observe(elements.topSentinel);
      }
      
      if (elements.bottomSentinel) {
        intersectionObserver.observe(elements.bottomSentinel);
      }
      
      // We still need minimal scroll handling for position updates
      // but much less frequent than full scroll handler
      const lightScrollHandler = () => {
        // Only update if we're not already handling an intersection
        if (!isIntersecting) {
          callbacks.onScroll(container.scrollTop);
        }
      };
      
      // Use a throttled scroll event for position updates
      let lastTime = 0;
      throttledScrollHandler = (e: Event) => {
        const now = Date.now();
        if (now - lastTime < 200) return; // 5fps for background updates
        
        lastTime = now;
        lightScrollHandler();
      };
      
      container.addEventListener('scroll', throttledScrollHandler, { passive: true });
      
      // Return cleanup function
      return () => {
        if (intersectionObserver) {
          intersectionObserver.disconnect();
          intersectionObserver = null;
        }
        
        if (throttledScrollHandler) {
          container.removeEventListener('scroll', throttledScrollHandler);
          throttledScrollHandler = null;
        }
        
        if (scrollTimeout !== null) {
          clearTimeout(scrollTimeout);
          scrollTimeout = null;
        }
      };
    },
    
    /**
     * Gets current scroll position
     */
    getScrollTop: (): number => {
      return container.scrollTop;
    }
  };
}

/**
 * Creates a hybrid scroll tracker using both traditional and intersection approaches
 * This approach is optimized to use the best of both worlds:
 * - Intersection observer for detecting when to load more and large scroll changes
 * - Regular scroll events (at low frequency) for smooth position updates
 */
function createHybridScrollTracker(
  container: HTMLElement,
  elements: ListManagerElements,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  // Configure a highly optimized scroll tracker for regular updates
  const scrollConfig: ListManagerConfig = {
    throttleMs: 32, // ~30fps for regular scroll updates
    renderItem: () => document.createElement('div') // Required field
  };
  
  const scrollTracker = createTraditionalScrollTracker(container, scrollConfig, {
    // Smooth scroll updates from the traditional tracker
    onScroll: callbacks.onScroll,
    // Never trigger load more from scroll events in hybrid mode
    onLoadMore: () => {}
  });
  
  // Configure intersection observer for load-more detection only
  const intersectionTracker = createIntersectionScrollTracker(container, elements, {
    // Minimal scroll updates from intersection events
    onScroll: (scrollTop) => {
      // Only update on major position changes
      const currentScrollTop = container.scrollTop;
      if (Math.abs(currentScrollTop - scrollTop) > 50) {
        callbacks.onScroll(currentScrollTop);
      }
    },
    // Always use intersection observer for load more
    onLoadMore: callbacks.onLoadMore
  });
  
  let cleanupFunctions: (() => void)[] = [];
  
  return {
    /**
     * Set up both scroll tracking mechanisms
     * @returns Cleanup function
     */
    setup: (): () => void => {
      // Use both methods simultaneously
      cleanupFunctions.push(scrollTracker.setup());
      cleanupFunctions.push(intersectionTracker.setup());
      
      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
        cleanupFunctions = [];
      };
    },
    
    /**
     * Gets current scroll position
     */
    getScrollTop: (): number => {
      return scrollTracker.getScrollTop();
    }
  };
}