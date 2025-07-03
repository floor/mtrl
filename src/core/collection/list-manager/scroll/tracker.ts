// src/core/collection/list-manager/scroll-tracker.ts
import { ListManagerElements, ListManagerConfig } from "../types";
import { createSentinels } from "../dom/elements";
import { devLog } from "./utils";

/**
 * Common interface for scroll tracking strategies
 */
export interface ScrollTracker {
  setup(): () => void;
  getScrollTop(): number;
  getScrollVelocity?(): number;
}

/**
 * Scroll performance metrics
 */
interface ScrollMetrics {
  eventCount: number;
  throttleHits: number;
}

/**
 * Scroll velocity tracker for adaptive performance
 */
class VelocityTracker {
  private positions: Array<{ time: number; pos: number }> = [];
  private velocity = 0;

  update(pos: number): number {
    const time = Date.now();
    this.positions.push({ time, pos });

    if (this.positions.length > 3) this.positions.shift();

    if (this.positions.length >= 2) {
      const first = this.positions[0];
      const last = this.positions[this.positions.length - 1];
      const timeDiff = last.time - first.time;
      this.velocity = timeDiff > 0 ? (last.pos - first.pos) / timeDiff : 0;
    }

    return this.velocity;
  }

  getVelocity(): number {
    return this.velocity;
  }

  reset(): void {
    this.positions = [];
    this.velocity = 0;
  }
}

/**
 * Advanced scroll manager with adaptive performance optimization
 */
class ScrollManager {
  private container: HTMLElement;
  private callbacks: {
    onScroll: (scrollTop: number) => void;
    onLoadMore: () => void;
  };
  private throttleMs: number;
  private velocityTracker = new VelocityTracker();
  private lastScrollTop = 0;
  private lastProcessTime = 0;
  private lastScrollTime = performance.now();
  private speedLogTimeout: number | null = null;
  private metrics: ScrollMetrics = { eventCount: 0, throttleHits: 0 };

  constructor(
    container: HTMLElement,
    config: ListManagerConfig,
    callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.throttleMs = config.throttleMs || 16;
  }

  private logScrollSpeed = (
    scrollTop: number,
    timeDelta: number,
    scrollDistance: number
  ): void => {
    const speed = scrollDistance / Math.max(timeDelta, 1);

    // Clear existing timeout
    if (this.speedLogTimeout) {
      clearTimeout(this.speedLogTimeout);
    }

    // Debounced speed logging (200ms)
    this.speedLogTimeout = setTimeout(() => {
      console.log(
        `📊 [SCROLL-SPEED] ${speed.toFixed(
          1
        )}px/ms | Distance: ${scrollDistance}px | Time: ${timeDelta.toFixed(
          1
        )}ms | Position: ${scrollTop}px`
      );
      this.speedLogTimeout = null;
    }, 200) as unknown as number;
  };

  private handleScroll = (e: Event): void => {
    this.metrics.eventCount++;

    const scrollTop = Math.max(0, (e.target as HTMLElement).scrollTop);
    const currentTime = performance.now();
    const now = Date.now();
    const timeDiff = now - this.lastProcessTime;

    if (Math.abs(scrollTop - this.lastScrollTop) < 1) return;

    if (timeDiff < this.throttleMs) {
      this.metrics.throttleHits++;
      return;
    }

    this.velocityTracker.update(scrollTop);

    // Debug: Track scroll events (calculate diff before updating lastScrollTop)
    const scrollDiff = Math.abs(scrollTop - this.lastScrollTop);
    const timeDelta = currentTime - this.lastScrollTime;
    console.log(`🔄 [SCROLL] Event: ${scrollTop}px (diff: ${scrollDiff}px)`);

    // Log scroll speed with debounce
    if (scrollDiff > 0) {
      this.logScrollSpeed(scrollTop, timeDelta, scrollDiff);
    }

    this.lastScrollTop = scrollTop;
    this.lastScrollTime = currentTime;
    this.lastProcessTime = now;
    this.callbacks.onScroll(scrollTop);
  };

  setup(): () => void {
    this.container.addEventListener("scroll", this.handleScroll, {
      passive: true,
    });
    return () => {
      this.container.removeEventListener("scroll", this.handleScroll);
      if (this.speedLogTimeout) {
        clearTimeout(this.speedLogTimeout);
        this.speedLogTimeout = null;
      }
      this.velocityTracker.reset();
    };
  }

  getScrollTop(): number {
    return this.container.scrollTop;
  }

  getScrollVelocity(): number {
    return this.velocityTracker.getVelocity();
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
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  const strategy = config.scrollStrategy || "scroll";

  switch (strategy) {
    case "intersection":
      return createIntersectionTracker(container, elements, callbacks);
    case "scroll":
    default:
      return createTraditionalTracker(container, config, callbacks);
  }
}

/**
 * Creates an optimized scroll tracker using traditional scroll events with advanced performance optimizations
 */
function createTraditionalTracker(
  container: HTMLElement,
  config: ListManagerConfig,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  const manager = new ScrollManager(container, config, callbacks);
  return {
    setup: () => manager.setup(),
    getScrollTop: () => manager.getScrollTop(),
    getScrollVelocity: () => manager.getScrollVelocity(),
  };
}

/**
 * Creates an optimized intersection observer-based scroll tracker with adaptive performance
 */
function createIntersectionTracker(
  container: HTMLElement,
  elements: ListManagerElements,
  callbacks: { onScroll: (scrollTop: number) => void; onLoadMore: () => void }
): ScrollTracker {
  let observer: IntersectionObserver | null = null;

  return {
    setup: (): (() => void) => {
      if (!("IntersectionObserver" in window)) {
        devLog("IntersectionObserver not supported, falling back");
        const fallback = createTraditionalTracker(
          container,
          { throttleMs: 16, renderItem: () => document.createElement("div") },
          callbacks
        );
        return fallback.setup();
      }

      if (!elements.topSentinel || !elements.bottomSentinel) {
        Object.assign(elements, createSentinels(elements));
      }

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              if (
                entry.target === elements.topSentinel ||
                entry.target === elements.bottomSentinel
              ) {
                callbacks.onScroll(container.scrollTop);
                if (entry.target === elements.bottomSentinel) {
                  callbacks.onLoadMore();
                }
              }
            }
          }
        },
        { root: container, rootMargin: "400px", threshold: 0 }
      );

      if (elements.topSentinel) observer.observe(elements.topSentinel);
      if (elements.bottomSentinel) observer.observe(elements.bottomSentinel);

      return () => {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      };
    },

    getScrollTop: () => container.scrollTop,
  };
}
