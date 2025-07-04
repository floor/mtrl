import { ListManagerConfig, ListManagerElements, VisibleRange } from "../types";
import { placeholderRenderHook } from "../data/generator";

/**
 * Rendering manager dependencies
 */
export interface RenderingDependencies {
  config: ListManagerConfig;
  elements: ListManagerElements;
}

/**
 * Performance metrics for monitoring
 */
export interface RenderingMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  elementsCreated: number;
  elementsRecycled: number;
}

/**
 * Creates an optimized rendering manager with advanced DOM and CSS performance optimizations
 * @param deps Dependencies from the main list manager
 * @returns Optimized rendering management functions
 */
export const createRenderingManager = (deps: RenderingDependencies) => {
  const { config, elements } = deps;

  // Performance tracking
  const metrics: RenderingMetrics = {
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    elementsCreated: 0,
    elementsRecycled: 0,
  };

  // Element pool for recycling
  const elementPool: HTMLElement[] = [];
  const maxPoolSize = 50;

  // CSS class cache for avoiding repeated class operations
  let cssClassCache = new WeakMap<HTMLElement, Set<string>>();

  /**
   * Get or create an element with optimal reuse
   * @param item Item data
   * @param index Item index
   * @returns HTMLElement ready for use
   */
  const getOrCreateElement = (item: any, index: number): HTMLElement | null => {
    // Try to reuse from pool first
    const recycledElement = elementPool.pop();

    if (recycledElement) {
      // Clear previous state efficiently
      recycledElement.style.cssText = "";
      recycledElement.className = "mtrl-list-item"; // Reset to base class

      // Clear custom properties
      recycledElement.style.removeProperty("--item-offset");

      // Restore base transform
      recycledElement.style.transform = `translateY(var(--item-offset)) translateZ(0)`;

      // Apply itemHeight if configured
      if (config.itemHeight) {
        recycledElement.style.height = `${config.itemHeight}px`;
      }

      // Update with new content using recycled element
      const newElement = config.renderItem(item, index, recycledElement);
      if (newElement) {
        metrics.elementsRecycled++;
        return newElement;
      }
    }

    // Create new element if no recycled element available
    const newElement = config.renderItem(item, index);
    if (newElement) {
      metrics.elementsCreated++;
    }

    return newElement;
  };

  /**
   * Optimize CSS class operations
   * @param element Target element
   * @param classes Classes to ensure are present
   */
  const optimizeClassList = (element: HTMLElement, classes: string[]): void => {
    let cachedClasses = cssClassCache.get(element);

    if (!cachedClasses) {
      cachedClasses = new Set(element.classList);
      cssClassCache.set(element, cachedClasses);
    }

    // Only add classes that aren't already present
    const classesToAdd: string[] = [];
    for (const className of classes) {
      if (!cachedClasses.has(className)) {
        classesToAdd.push(className);
        cachedClasses.add(className);
      }
    }

    if (classesToAdd.length > 0) {
      element.classList.add(...classesToAdd);
    }
  };

  /**
   * Apply APZ-friendly positioning using CSS custom properties
   * This prevents Firefox scroll-linked effects warnings by using CSS custom properties
   * instead of direct transform manipulation during scroll events
   * @param element Element to position
   * @param offset Y offset in pixels
   */
  const applyOptimizedPositioning = (
    element: HTMLElement,
    offset: number
  ): void => {
    // Use CSS custom properties for APZ-friendly positioning
    // This allows Firefox's async scrolling to work properly
    element.style.setProperty("--item-offset", `${offset}px`);

    // Ensure the element has the base transform applied
    if (!element.style.transform) {
      element.style.transform = `translateY(var(--item-offset)) translateZ(0)`;
    }

    // Use absolute positioning but without changing top/left frequently
    if (!element.style.position) {
      element.style.position = "absolute";
    }

    // Apply itemHeight as CSS height if configured
    if (config.itemHeight && !element.style.height) {
      element.style.height = `${config.itemHeight}px`;
    }
  };

  /**
   * Batch create elements using optimized DOM operations
   * @param positions Array of item positions
   * @returns DocumentFragment with all elements
   */
  const batchCreateElements = (
    positions: Array<{ index: number; item: any; offset: number }>
  ): DocumentFragment => {
    const fragment = document.createDocumentFragment();
    const tempContainer = document.createElement("div");

    // For very large batches, use innerHTML for better performance
    if (positions.length > 20) {
      const htmlStrings: string[] = [];

      positions.forEach(({ index, item, offset }) => {
        if (!item) return;

        // Create a simplified HTML structure for fast insertion
        const itemId = item.id || `item-${index}`;
        const isPlaceholder = item._isPlaceholder
          ? " mtrl-item-placeholder"
          : "";

        const itemHeight = config.itemHeight
          ? `height: ${config.itemHeight}px; `
          : "";
        htmlStrings.push(`
          <div class="mtrl-list-item${isPlaceholder}" 
               data-id="${itemId}" 
               data-index="${index}"
               style="--item-offset: ${offset}px; transform: translateY(var(--item-offset)) translateZ(0); position: absolute; left: 0; right: 0; width: 100%; ${itemHeight}will-change: transform;">
            <!-- Content will be populated by post-processing -->
          </div>
        `);
      });

      tempContainer.innerHTML = htmlStrings.join("");

      // Post-process elements with actual content
      const elements = tempContainer.children;
      positions.forEach(({ index, item, offset }, posIndex) => {
        if (!item || posIndex >= elements.length) return;

        const element = elements[posIndex] as HTMLElement;

        // Use the user's render function to populate content
        const userElement = config.renderItem(item, index);
        if (userElement && userElement.innerHTML) {
          element.innerHTML = userElement.innerHTML;
        }

        // Apply placeholder hook if needed
        placeholderRenderHook(item, element);
      });

      // Move all elements to fragment
      while (tempContainer.firstElementChild) {
        fragment.appendChild(tempContainer.firstElementChild);
      }
    } else {
      // For smaller batches, use the standard approach but optimized
      positions.forEach(({ index, item, offset }) => {
        if (!item) return;

        // Get or create element efficiently
        const element = getOrCreateElement(item, index);
        if (!element) return;

        // Optimize CSS classes
        const requiredClasses = ["mtrl-list-item"];
        if (item._isPlaceholder) {
          requiredClasses.push("mtrl-item-placeholder");
        }
        optimizeClassList(element, requiredClasses);

        // Apply render hook for styling
        placeholderRenderHook(item, element);

        // Set data attributes efficiently
        if (item.id && element.getAttribute("data-id") !== item.id) {
          element.setAttribute("data-id", item.id);
        }

        // Apply optimized positioning
        applyOptimizedPositioning(element, offset);

        fragment.appendChild(element);
      });
    }

    return fragment;
  };

  /**
   * Recycle elements that are no longer visible
   * @param elementsToRecycle Elements to add to the recycling pool
   */
  const recycleElements = (elementsToRecycle: HTMLElement[]): void => {
    elementsToRecycle.forEach((element) => {
      if (elementPool.length < maxPoolSize) {
        // Prepare element for reuse using custom properties
        element.style.setProperty("--item-offset", "-9999px"); // Move out of view
        element.style.visibility = "hidden"; // Hide but keep in layout
        elementPool.push(element);
      } else {
        // Remove if pool is full
        element.remove();
      }
    });
  };

  /**
   * Calculate item positions with virtual offset support for page jumping
   * @param items All items in the local state
   * @param visibleRange Visible range with start and end indices
   * @param virtualOffset Virtual offset for positioning items (used when jumping to pages)
   * @returns Array of positions with index, item, and offset
   */
  const calculateItemPositionsWithVirtualOffset = (
    items: any[],
    visibleRange: VisibleRange,
    virtualOffset: number = 0
  ): Array<{ index: number; item: any; offset: number }> => {
    const positions: Array<{ index: number; item: any; offset: number }> = [];
    const itemHeight = config.itemHeight || 84;

    // Use more efficient calculation
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      if (items[i]) {
        const item = items[i];
        const itemId = parseInt(item.id);
        const naturalOffset = (itemId - 1) * itemHeight;

        positions.push({
          index: i,
          item: item,
          offset: naturalOffset,
        });
      }
    }

    return positions;
  };

  /**
   * Optimized render function with performance monitoring
   * @param positions Array of item positions with virtual offsets
   */
  const renderItemsWithVirtualPositions = (
    positions: Array<{ index: number; item: any; offset: number }>
  ): void => {
    const renderStartTime = performance.now();

    if (!elements.content) {
      console.warn("Cannot render items: content element missing");
      return;
    }

    // Get existing items for recycling
    const existingItems = Array.from(elements.content.children).filter(
      (child) =>
        child !== elements.topSentinel &&
        child !== elements.bottomSentinel &&
        (child as HTMLElement).classList.contains("mtrl-list-item")
    ) as HTMLElement[];

    // Batch remove existing items and prepare for recycling
    existingItems.forEach((item) => item.remove());
    recycleElements(existingItems);

    // Batch create new elements
    const fragment = batchCreateElements(positions);

    // Single DOM operation to add all elements
    elements.content.appendChild(fragment);

    // Re-add sentinel elements efficiently
    if (elements.topSentinel && !elements.topSentinel.parentNode) {
      elements.content.insertBefore(
        elements.topSentinel,
        elements.content.firstChild
      );
    }
    if (elements.bottomSentinel && !elements.bottomSentinel.parentNode) {
      elements.content.appendChild(elements.bottomSentinel);
    }

    // Update performance metrics
    const renderTime = performance.now() - renderStartTime;
    metrics.renderCount++;
    metrics.lastRenderTime = renderTime;
    metrics.averageRenderTime =
      (metrics.averageRenderTime * (metrics.renderCount - 1) + renderTime) /
      metrics.renderCount;

    // Log performance in development
    if (process.env.NODE_ENV === "development" && renderTime > 16) {
      console.warn(
        `[OptimizedRenderer] Slow render detected: ${renderTime.toFixed(
          2
        )}ms for ${positions.length} items`
      );
    }
  };

  /**
   * Get current performance metrics
   * @returns Current rendering performance data
   */
  const getMetrics = (): RenderingMetrics => ({ ...metrics });

  /**
   * Clear element pool and reset metrics
   */
  const cleanup = (): void => {
    elementPool.length = 0;
    cssClassCache = new WeakMap();
    Object.assign(metrics, {
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      elementsCreated: 0,
      elementsRecycled: 0,
    });
  };

  return {
    calculateItemPositionsWithVirtualOffset,
    renderItemsWithVirtualPositions,
    getMetrics,
    cleanup,
  };
};
