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
  const { scrollStrategy } = config;
  
  switch (scrollStrategy) {
    case 'intersection':
      return createIntersectionScrollTracker(container, elements, callbacks);
      
    case 'hybrid':
      return createHybridScrollTracker(container, elements, callbacks);
      
    case 'scroll':
    default:
      return createTraditionalScrollTracker(container, callbacks);
  }
}

/**
 * Creates a scroll tracker using traditional scroll events
 */
function createTraditionalScrollTracker(
  container: HTMLElement,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  let scrollHandler: ((e: Event) => void) | null = null;
  let scrollRAF: number | null = null;
  
  return {
    /**
     * Set up scroll tracking
     * @returns Cleanup function
     */
    setup: (): () => void => {
      // Create optimized handler function
      scrollHandler = (e: Event): void => {
        if (scrollRAF) return;
        
        scrollRAF = requestAnimationFrame(() => {
          const scrollTop = (e.target as HTMLElement).scrollTop;
          callbacks.onScroll(scrollTop);
          scrollRAF = null;
        });
      };
      
      // Add listener with passive option for better performance
      container.addEventListener('scroll', scrollHandler, { passive: true });
      
      // Return cleanup function
      return () => {
        if (scrollHandler) {
          container.removeEventListener('scroll', scrollHandler);
          scrollHandler = null;
        }
        
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
  
  return {
    /**
     * Set up intersection observer for scroll tracking
     * @returns Cleanup function
     */
    setup: (): () => void => {
      // Fall back to scroll events if IntersectionObserver not supported
      if (!('IntersectionObserver' in window)) {
        console.warn('IntersectionObserver not supported, falling back to scroll events');
        const tracker = createTraditionalScrollTracker(container, callbacks);
        return tracker.setup();
      }
      
      // Add sentinel elements if not already present
      if (!elements.topSentinel || !elements.bottomSentinel) {
        Object.assign(elements, createSentinels(elements));
      }
      
      // Create intersection observer
      intersectionObserver = new IntersectionObserver((entries) => {
        let needsUpdate = false;
        
        entries.forEach(entry => {
          // Top sentinel handles scrolling up
          if (entry.target === elements.topSentinel && entry.isIntersecting) {
            needsUpdate = true;
          }
          
          // Bottom sentinel handles loading more content
          if (entry.target === elements.bottomSentinel && entry.isIntersecting) {
            callbacks.onLoadMore();
            needsUpdate = true;
          }
        });
        
        // Update visible items if needed
        if (needsUpdate) {
          callbacks.onScroll(container.scrollTop);
        }
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
        requestAnimationFrame(() => {
          callbacks.onScroll(container.scrollTop);
        });
      };
      
      // Use a throttled scroll event for position updates
      throttledScrollHandler = () => {
        if (scrollTimeout !== null) return;
        
        scrollTimeout = window.setTimeout(() => {
          lightScrollHandler();
          scrollTimeout = null;
        }, 100); // Lower frequency for position updates
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
 */
function createHybridScrollTracker(
  container: HTMLElement,
  elements: ListManagerElements,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  const traditionalTracker = createTraditionalScrollTracker(container, callbacks);
  const intersectionTracker = createIntersectionScrollTracker(container, elements, callbacks);
  let cleanupFunctions: (() => void)[] = [];
  
  return {
    /**
     * Set up both scroll tracking mechanisms
     * @returns Cleanup function
     */
    setup: (): () => void => {
      // Use both methods simultaneously
      cleanupFunctions.push(traditionalTracker.setup());
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
      return traditionalTracker.getScrollTop();
    }
  };
}