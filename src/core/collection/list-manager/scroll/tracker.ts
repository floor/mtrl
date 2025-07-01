// src/core/collection/list-manager/scroll-tracker.ts
import { ListManagerElements, ListManagerConfig } from "../types";
import { createSentinels } from "../dom/elements";

/**
 * Common interface for scroll tracking strategies
 */
export interface ScrollTracker {
  setup(): () => void;
  getScrollTop(): number;
  getScrollVelocity?(): number;
  getMetrics?(): ScrollMetrics;
}

/**
 * Scroll performance metrics
 */
interface ScrollMetrics {
  eventCount: number;
  processedCount: number;
  averageProcessTime: number;
  maxVelocity: number;
  throttleHits: number;
  rafHits: number;
}

/**
 * Scroll velocity tracker for adaptive performance
 */
class ScrollVelocityTracker {
  private positions: Array<{ timestamp: number; position: number }> = [];
  private maxHistory = 5;
  private currentVelocity = 0;

  update(position: number): number {
    const timestamp = performance.now();
    this.positions.push({ timestamp, position });

    // Keep only recent positions
    if (this.positions.length > this.maxHistory) {
      this.positions.shift();
    }

    // Calculate velocity if we have enough data points
    if (this.positions.length >= 2) {
      const first = this.positions[0];
      const last = this.positions[this.positions.length - 1];
      const timeDiff = last.timestamp - first.timestamp;
      const positionDiff = last.position - first.position;

      this.currentVelocity = timeDiff > 0 ? positionDiff / timeDiff : 0;
    }

    return this.currentVelocity;
  }

  getVelocity(): number {
    return this.currentVelocity;
  }

  reset(): void {
    this.positions = [];
    this.currentVelocity = 0;
  }
}

/**
 * Advanced scroll manager with adaptive performance optimization
 */
class AdvancedScrollManager {
  private container: HTMLElement;
  private callbacks: {
    onScroll: (scrollTop: number) => void;
    onLoadMore: () => void;
  };
  private config: ListManagerConfig;

  // Performance tracking
  private metrics: ScrollMetrics = {
    eventCount: 0,
    processedCount: 0,
    averageProcessTime: 0,
    maxVelocity: 0,
    throttleHits: 0,
    rafHits: 0,
  };

  // Scroll state
  private rafId: number | null = null;
  private lastScrollTop = 0;
  private lastProcessTime = 0;
  private isRunning = false;

  // Velocity and adaptive throttling
  private velocityTracker = new ScrollVelocityTracker();
  private baseThrottleMs: number;
  private adaptiveThrottleMs: number;

  // Scroll threshold for filtering micro-scrolls
  private scrollThreshold = 1; // More sensitive threshold

  constructor(
    container: HTMLElement,
    config: ListManagerConfig,
    callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
  ) {
    this.container = container;
    this.config = config;
    this.callbacks = callbacks;
    this.baseThrottleMs = config.throttleMs || 16;
    this.adaptiveThrottleMs = this.baseThrottleMs;
  }

  /**
   * Get current scroll jump state from timeout manager if available
   * This detects when scroll events occur during active scroll jumps
   */
  private getCurrentScrollJumpState(): any {
    try {
      // Access through the container's attached manager if available
      const listManager = (this.container as any).__listManager;
      if (listManager && listManager.timeoutManager) {
        return listManager.timeoutManager.getState();
      }
    } catch (error) {
      // Silently fail if no timeout manager is available
    }
    return null;
  }

  /**
   * Adaptive throttle calculation based on scroll velocity
   * Higher velocity = lower throttle for smoother scrolling
   * Lower velocity = higher throttle for better performance
   */
  private calculateAdaptiveThrottle(velocity: number): number {
    const absVelocity = Math.abs(velocity);

    // For high-speed scrolling (> 2 pixels/ms), use minimal throttling
    if (absVelocity > 2) {
      return Math.max(8, this.baseThrottleMs / 2);
    }

    // For medium-speed scrolling (0.5-2 pixels/ms), use base throttling
    if (absVelocity > 0.5) {
      return this.baseThrottleMs;
    }

    // For slow scrolling (< 0.5 pixels/ms), use higher throttling for efficiency
    return Math.min(32, this.baseThrottleMs * 1.5);
  }

  /**
   * Optimized scroll handler with intelligent processing
   */
  private handleScroll = (e: Event): void => {
    this.metrics.eventCount++;

    let currentScrollTop = (e.target as HTMLElement).scrollTop;
    const timestamp = performance.now();

    // 🚨 INTERRUPTION DETECTION: Check if scroll event occurs during scroll jump
    const currentScrollJumpState = this.getCurrentScrollJumpState();
    if (
      currentScrollJumpState &&
      currentScrollJumpState.isScrollJumpInProgress
    ) {
      console.warn(
        "🚨 [SCROLL INTERRUPT] Scroll event during active scroll jump!",
        {
          currentScrollTop,
          previousScrollTop: this.lastScrollTop,
          scrollDelta: currentScrollTop - this.lastScrollTop,
          timestamp,
          scrollJumpState: currentScrollJumpState,
          eventTarget: e.target,
        }
      );
    }

    // 🔍 SCROLL SOURCE DETECTION
    const scrollDelta = Math.abs(currentScrollTop - this.lastScrollTop);
    const timeDelta = timestamp - this.lastProcessTime;
    const scrollSpeed = timeDelta > 0 ? scrollDelta / timeDelta : 0;

    // Detect scroll source based on patterns
    let scrollSource = "unknown";
    if (scrollDelta > 1000 && timeDelta < 50) {
      scrollSource = "scrollbar_drag"; // Large instant movement
    } else if (scrollDelta < 300 && timeDelta < 100) {
      scrollSource = "mouse_wheel"; // Small incremental movement
    } else if (scrollDelta > 500) {
      scrollSource = "scrollbar_click"; // Medium jump (clicking scroll track)
    } else {
      scrollSource = "programmatic"; // Programmatic or other
    }

    // Log significant scroll changes with source detection
    if (scrollDelta > 500) {
      // Only log very large movements
      console.log(
        `📊 [SCROLL] Large movement: ${
          this.lastScrollTop
        } → ${currentScrollTop} (Δ${scrollDelta.toFixed(0)}) [${scrollSource}]`
      );
    }

    // Boundary check for negative scroll values
    if (currentScrollTop < 0) {
      currentScrollTop = 0;
      this.container.scrollTop = 0;
    }

    // Skip processing if scroll amount is too small
    if (
      Math.abs(currentScrollTop - this.lastScrollTop) < this.scrollThreshold
    ) {
      return;
    }

    // Update velocity and adaptive throttling
    const velocity = this.velocityTracker.update(currentScrollTop);
    this.adaptiveThrottleMs = this.calculateAdaptiveThrottle(velocity);

    // Track max velocity for metrics
    if (Math.abs(velocity) > this.metrics.maxVelocity) {
      this.metrics.maxVelocity = Math.abs(velocity);
    }

    const now = performance.now();
    const timeSinceLastProcess = now - this.lastProcessTime;

    // Smart throttling based on velocity and time
    if (timeSinceLastProcess < this.adaptiveThrottleMs) {
      this.metrics.throttleHits++;

      // Only use RAF if we're not already waiting and it's high-velocity scrolling
      if (!this.isRunning && Math.abs(velocity) > 1) {
        this.scheduleRAFUpdate(currentScrollTop, now);
      }
      return;
    }

    // Process immediately for low-latency updates
    this.processScrollUpdate(currentScrollTop, now);
  };

  /**
   * Schedule update using requestAnimationFrame for smooth high-velocity scrolling
   */
  private scheduleRAFUpdate(scrollTop: number, timestamp: number): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.metrics.rafHits++;

    this.rafId = requestAnimationFrame(() => {
      // Use the current scroll position, not the captured one, for accuracy
      const currentScrollTop = this.container.scrollTop;
      this.processScrollUpdate(currentScrollTop, performance.now());
      this.isRunning = false;
      this.rafId = null;
    });
  }

  /**
   * Process scroll update with performance tracking
   */
  private processScrollUpdate(scrollTop: number, timestamp: number): void {
    const processStartTime = performance.now();

    this.lastScrollTop = scrollTop;
    this.lastProcessTime = timestamp;
    this.metrics.processedCount++;

    // Execute callback
    this.callbacks.onScroll(scrollTop);

    // Update metrics
    const processTime = performance.now() - processStartTime;
    this.metrics.averageProcessTime =
      (this.metrics.averageProcessTime * (this.metrics.processedCount - 1) +
        processTime) /
      this.metrics.processedCount;

    // Warn about slow processing in development
    if (process.env.NODE_ENV === "development" && processTime > 8) {
      console.warn(
        `[AdvancedScrollManager] Slow scroll processing: ${processTime.toFixed(
          2
        )}ms`
      );
    }
  }

  /**
   * Set up scroll tracking with advanced optimizations
   */
  setup(): () => void {
    // Use passive listeners for better performance
    this.container.addEventListener("scroll", this.handleScroll, {
      passive: true,
      capture: false,
    });

    return () => {
      this.container.removeEventListener("scroll", this.handleScroll);

      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }

      this.velocityTracker.reset();
      this.isRunning = false;
    };
  }

  /**
   * Get current scroll position
   */
  getScrollTop(): number {
    return this.container.scrollTop;
  }

  /**
   * Get current scroll velocity
   */
  getScrollVelocity(): number {
    return this.velocityTracker.getVelocity();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): ScrollMetrics {
    return { ...this.metrics };
  }
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
  const { scrollStrategy = "scroll" } = config;

  switch (scrollStrategy) {
    case "intersection":
      return createOptimizedIntersectionScrollTracker(
        container,
        elements,
        callbacks
      );

    case "hybrid":
      return createOptimizedHybridScrollTracker(container, elements, callbacks);

    case "scroll":
    default:
      return createOptimizedTraditionalScrollTracker(
        container,
        config,
        callbacks
      );
  }
}

/**
 * Creates an optimized scroll tracker using traditional scroll events with advanced performance optimizations
 */
function createOptimizedTraditionalScrollTracker(
  container: HTMLElement,
  config: ListManagerConfig,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  const scrollManager = new AdvancedScrollManager(container, config, callbacks);

  return {
    setup: () => scrollManager.setup(),
    getScrollTop: () => scrollManager.getScrollTop(),
    getScrollVelocity: () => scrollManager.getScrollVelocity(),
    getMetrics: () => scrollManager.getMetrics(),
  };
}

/**
 * Creates an optimized intersection observer-based scroll tracker with adaptive performance
 */
function createOptimizedIntersectionScrollTracker(
  container: HTMLElement,
  elements: ListManagerElements,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  let intersectionObserver: IntersectionObserver | null = null;
  let velocityTracker = new ScrollVelocityTracker();
  let scrollManager: AdvancedScrollManager | null = null;
  let lastIntersectionTime = 0;
  let observerMargin = "400px";

  // Performance metrics
  const metrics: ScrollMetrics = {
    eventCount: 0,
    processedCount: 0,
    averageProcessTime: 0,
    maxVelocity: 0,
    throttleHits: 0,
    rafHits: 0,
  };

  /**
   * Adaptive margin calculation based on scroll velocity
   */
  const calculateAdaptiveMargin = (velocity: number): string => {
    const absVelocity = Math.abs(velocity);

    // For high-speed scrolling, increase the margin for better prefetching
    if (absVelocity > 3) {
      return "800px";
    }

    // For medium-speed scrolling, use standard margin
    if (absVelocity > 1) {
      return "600px";
    }

    // For slow scrolling, use smaller margin for efficiency
    return "300px";
  };

  return {
    setup: (): (() => void) => {
      // Fallback for browsers without IntersectionObserver
      if (!("IntersectionObserver" in window)) {
        console.warn(
          "IntersectionObserver not supported, falling back to optimized scroll tracker"
        );
        const config: ListManagerConfig = {
          renderItem: () => document.createElement("div"),
          throttleMs: 16,
        };
        const fallbackTracker = createOptimizedTraditionalScrollTracker(
          container,
          config,
          callbacks
        );
        return fallbackTracker.setup();
      }

      // Ensure sentinel elements exist
      if (!elements.topSentinel || !elements.bottomSentinel) {
        Object.assign(elements, createSentinels(elements));
      }

      // Create enhanced intersection observer
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const processStartTime = performance.now();
          metrics.eventCount++;

          let needsUpdate = false;
          let shouldLoadMore = false;

          entries.forEach((entry) => {
            if (entry.target === elements.topSentinel && entry.isIntersecting) {
              needsUpdate = true;
            }

            if (
              entry.target === elements.bottomSentinel &&
              entry.isIntersecting
            ) {
              shouldLoadMore = true;
              needsUpdate = true;
            }
          });

          // Execute callbacks if needed
          if (needsUpdate) {
            callbacks.onScroll(container.scrollTop);
          }

          if (shouldLoadMore) {
            // Debounced load more with velocity awareness
            const now = Date.now();
            if (now - lastIntersectionTime > 150) {
              callbacks.onLoadMore();
              lastIntersectionTime = now;
            }
          }

          // Update metrics
          const processTime = performance.now() - processStartTime;
          metrics.processedCount++;
          metrics.averageProcessTime =
            (metrics.averageProcessTime * (metrics.processedCount - 1) +
              processTime) /
            metrics.processedCount;
        },
        {
          root: container,
          rootMargin: observerMargin,
          threshold: 0,
        }
      );

      // Start observing sentinels
      if (elements.topSentinel) {
        intersectionObserver.observe(elements.topSentinel);
      }
      if (elements.bottomSentinel) {
        intersectionObserver.observe(elements.bottomSentinel);
      }

      // Create auxiliary scroll manager for velocity tracking and fine position updates
      const config: ListManagerConfig = {
        renderItem: () => document.createElement("div"),
        throttleMs: 32, // Lower frequency for intersection mode
      };

      scrollManager = new AdvancedScrollManager(container, config, {
        onScroll: (scrollTop) => {
          // Update velocity tracking
          const velocity = velocityTracker.update(scrollTop);

          // Track max velocity
          if (Math.abs(velocity) > metrics.maxVelocity) {
            metrics.maxVelocity = Math.abs(velocity);
          }

          // Dynamically adjust intersection observer margin based on velocity
          const newMargin = calculateAdaptiveMargin(velocity);
          if (newMargin !== observerMargin && intersectionObserver) {
            observerMargin = newMargin;

            // Recreate observer with new margin
            intersectionObserver.disconnect();
            // Recreate with same callback function
            intersectionObserver = new IntersectionObserver(
              (entries) => {
                const processStartTime = performance.now();
                metrics.eventCount++;

                let needsUpdate = false;
                let shouldLoadMore = false;

                entries.forEach((entry) => {
                  if (
                    entry.target === elements.topSentinel &&
                    entry.isIntersecting
                  ) {
                    needsUpdate = true;
                  }

                  if (
                    entry.target === elements.bottomSentinel &&
                    entry.isIntersecting
                  ) {
                    shouldLoadMore = true;
                    needsUpdate = true;
                  }
                });

                if (needsUpdate) {
                  callbacks.onScroll(container.scrollTop);
                }

                if (shouldLoadMore) {
                  const now = Date.now();
                  if (now - lastIntersectionTime > 150) {
                    callbacks.onLoadMore();
                    lastIntersectionTime = now;
                  }
                }

                const processTime = performance.now() - processStartTime;
                metrics.processedCount++;
                metrics.averageProcessTime =
                  (metrics.averageProcessTime * (metrics.processedCount - 1) +
                    processTime) /
                  metrics.processedCount;
              },
              {
                root: container,
                rootMargin: observerMargin,
                threshold: 0,
              }
            );

            // Restart observation
            if (elements.topSentinel) {
              intersectionObserver.observe(elements.topSentinel);
            }
            if (elements.bottomSentinel) {
              intersectionObserver.observe(elements.bottomSentinel);
            }
          }

          // Light position updates only
          callbacks.onScroll(scrollTop);
        },
        onLoadMore: () => {}, // Handled by intersection observer
      });

      const scrollCleanup = scrollManager.setup();

      return () => {
        if (intersectionObserver) {
          intersectionObserver.disconnect();
          intersectionObserver = null;
        }

        if (scrollManager) {
          scrollCleanup();
          scrollManager = null;
        }

        velocityTracker.reset();
      };
    },

    getScrollTop: (): number => {
      return container.scrollTop;
    },

    getScrollVelocity: (): number => {
      return velocityTracker.getVelocity();
    },

    getMetrics: (): ScrollMetrics => {
      const scrollMetrics = scrollManager?.getMetrics() || {
        eventCount: 0,
        processedCount: 0,
        averageProcessTime: 0,
        maxVelocity: 0,
        throttleHits: 0,
        rafHits: 0,
      };

      return {
        eventCount: metrics.eventCount + scrollMetrics.eventCount,
        processedCount: metrics.processedCount + scrollMetrics.processedCount,
        averageProcessTime:
          (metrics.averageProcessTime + scrollMetrics.averageProcessTime) / 2,
        maxVelocity: Math.max(metrics.maxVelocity, scrollMetrics.maxVelocity),
        throttleHits: metrics.throttleHits + scrollMetrics.throttleHits,
        rafHits: metrics.rafHits + scrollMetrics.rafHits,
      };
    },
  };
}

/**
 * Creates an optimized hybrid scroll tracker combining advanced scroll and intersection observers
 * This approach uses the best of both worlds with enhanced performance optimizations
 */
function createOptimizedHybridScrollTracker(
  container: HTMLElement,
  elements: ListManagerElements,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  // Configure optimized scroll tracker for smooth updates
  const scrollConfig: ListManagerConfig = {
    throttleMs: 24, // Balanced for hybrid mode
    renderItem: () => document.createElement("div"),
  };

  const scrollTracker = createOptimizedTraditionalScrollTracker(
    container,
    scrollConfig,
    {
      // Primary scroll updates with velocity awareness
      onScroll: callbacks.onScroll,
      // Load more handled by intersection observer
      onLoadMore: () => {},
    }
  );

  // Configure optimized intersection observer for load-more detection
  const intersectionTracker = createOptimizedIntersectionScrollTracker(
    container,
    elements,
    {
      // Smart position updates based on major changes
      onScroll: (scrollTop) => {
        const currentScrollTop = container.scrollTop;
        const scrollVelocity = scrollTracker.getScrollVelocity?.() || 0;

        // Adaptive threshold based on velocity
        const threshold = Math.abs(scrollVelocity) > 2 ? 30 : 60;

        if (Math.abs(currentScrollTop - scrollTop) > threshold) {
          callbacks.onScroll(currentScrollTop);
        }
      },
      // Primary load more detection
      onLoadMore: callbacks.onLoadMore,
    }
  );

  let cleanupFunctions: (() => void)[] = [];

  return {
    setup: (): (() => void) => {
      // Initialize both tracking mechanisms
      cleanupFunctions.push(scrollTracker.setup());
      cleanupFunctions.push(intersectionTracker.setup());

      return () => {
        cleanupFunctions.forEach((cleanup) => cleanup());
        cleanupFunctions = [];
      };
    },

    getScrollTop: (): number => {
      return scrollTracker.getScrollTop();
    },

    getScrollVelocity: (): number => {
      return scrollTracker.getScrollVelocity?.() || 0;
    },

    getMetrics: (): ScrollMetrics => {
      const scrollMetrics = scrollTracker.getMetrics?.() || {
        eventCount: 0,
        processedCount: 0,
        averageProcessTime: 0,
        maxVelocity: 0,
        throttleHits: 0,
        rafHits: 0,
      };

      const intersectionMetrics = intersectionTracker.getMetrics?.() || {
        eventCount: 0,
        processedCount: 0,
        averageProcessTime: 0,
        maxVelocity: 0,
        throttleHits: 0,
        rafHits: 0,
      };

      return {
        eventCount: scrollMetrics.eventCount + intersectionMetrics.eventCount,
        processedCount:
          scrollMetrics.processedCount + intersectionMetrics.processedCount,
        averageProcessTime:
          (scrollMetrics.averageProcessTime +
            intersectionMetrics.averageProcessTime) /
          2,
        maxVelocity: Math.max(
          scrollMetrics.maxVelocity,
          intersectionMetrics.maxVelocity
        ),
        throttleHits:
          scrollMetrics.throttleHits + intersectionMetrics.throttleHits,
        rafHits: scrollMetrics.rafHits + intersectionMetrics.rafHits,
      };
    },
  };
}
