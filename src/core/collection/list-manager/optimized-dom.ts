/**
 * Optimized DOM Manager
 * Caches DOM references, uses document fragments, and implements element recycling
 */

export interface OptimizedDOMManager {
  batchUpdate: (operations: DOMOperation[]) => void;
  recycleElement: (element: HTMLElement) => void;
  getRecycledElement: (type: string) => HTMLElement | null;
  clearCache: () => void;
  destroy: () => void;
}

export interface DOMOperation {
  type: "create" | "update" | "remove" | "move";
  element?: HTMLElement;
  properties?: Record<string, any>;
  position?: number;
  parent?: HTMLElement;
}

/**
 * Create an optimized DOM manager
 */
export const createOptimizedDOMManager = (): OptimizedDOMManager => {
  // Element recycling pool organized by type
  const recyclePool = new Map<string, HTMLElement[]>();
  const activeElements = new Set<HTMLElement>();

  // Document fragment for batch operations
  let fragment: DocumentFragment | null = null;

  // RAF scheduling for DOM updates
  let rafId: number | null = null;
  let pendingOperations: DOMOperation[] = [];

  /**
   * Batch DOM operations for better performance
   */
  const batchUpdate = (operations: DOMOperation[]): void => {
    pendingOperations.push(...operations);

    if (rafId) return; // Already scheduled

    rafId = requestAnimationFrame(() => {
      processBatchOperations();
      rafId = null;
      pendingOperations = [];
    });
  };

  /**
   * Process batched DOM operations
   */
  const processBatchOperations = (): void => {
    if (pendingOperations.length === 0) return;

    // Create document fragment for batch append
    fragment = document.createDocumentFragment();

    // Group operations by type for efficiency
    const creates = pendingOperations.filter((op) => op.type === "create");
    const updates = pendingOperations.filter((op) => op.type === "update");
    const removes = pendingOperations.filter((op) => op.type === "remove");
    const moves = pendingOperations.filter((op) => op.type === "move");

    // Process removes first to free up DOM nodes
    removes.forEach(processRemoveOperation);

    // Process creates and updates
    creates.forEach(processCreateOperation);
    updates.forEach(processUpdateOperation);
    moves.forEach(processMoveOperation);

    // Clean up fragment reference
    fragment = null;
  };

  /**
   * Process create operation
   */
  const processCreateOperation = (operation: DOMOperation): void => {
    const { element, parent, position } = operation;
    if (!element || !parent) return;

    activeElements.add(element);

    if (fragment && position === undefined) {
      // Add to fragment for batch append
      fragment.appendChild(element);
    } else {
      // Direct append/insert
      if (typeof position === "number") {
        const children = parent.children;
        if (position >= children.length) {
          parent.appendChild(element);
        } else {
          parent.insertBefore(element, children[position]);
        }
      } else {
        parent.appendChild(element);
      }
    }
  };

  /**
   * Process update operation
   */
  const processUpdateOperation = (operation: DOMOperation): void => {
    const { element, properties } = operation;
    if (!element || !properties) return;

    // Batch style updates
    if (properties.style) {
      Object.assign(element.style, properties.style);
    }

    // Batch attribute updates
    if (properties.attributes) {
      Object.entries(properties.attributes).forEach(([key, value]) => {
        element.setAttribute(key, String(value));
      });
    }

    // Update other properties
    Object.entries(properties).forEach(([key, value]) => {
      if (key !== "style" && key !== "attributes") {
        (element as any)[key] = value;
      }
    });
  };

  /**
   * Process remove operation
   */
  const processRemoveOperation = (operation: DOMOperation): void => {
    const { element } = operation;
    if (!element) return;

    activeElements.delete(element);

    // Try to recycle element
    const type = element.dataset.itemType || "default";
    recycleElement(element);

    // Remove from DOM
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  };

  /**
   * Process move operation
   */
  const processMoveOperation = (operation: DOMOperation): void => {
    const { element, parent, position } = operation;
    if (!element || !parent) return;

    if (typeof position === "number") {
      const children = parent.children;
      if (position >= children.length) {
        parent.appendChild(element);
      } else {
        parent.insertBefore(element, children[position]);
      }
    }
  };

  /**
   * Recycle DOM element for reuse
   */
  const recycleElement = (element: HTMLElement): void => {
    const type = element.dataset.itemType || "default";

    if (!recyclePool.has(type)) {
      recyclePool.set(type, []);
    }

    const pool = recyclePool.get(type)!;

    // Limit pool size to prevent memory bloat
    if (pool.length < 50) {
      // Clean element for reuse
      element.innerHTML = "";
      element.className = "mtrl-list-item";
      element.style.cssText = "";

      // Remove data attributes except type
      Object.keys(element.dataset).forEach((key) => {
        if (key !== "itemType") {
          delete element.dataset[key];
        }
      });

      pool.push(element);
    }
  };

  /**
   * Get recycled element from pool
   */
  const getRecycledElement = (type: string): HTMLElement | null => {
    const pool = recyclePool.get(type);
    return pool && pool.length > 0 ? pool.pop()! : null;
  };

  /**
   * Clear all caches
   */
  const clearCache = (): void => {
    recyclePool.clear();
    activeElements.clear();

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    pendingOperations = [];
  };

  /**
   * Destroy and cleanup
   */
  const destroy = (): void => {
    clearCache();
    fragment = null;
  };

  return {
    batchUpdate,
    recycleElement,
    getRecycledElement,
    clearCache,
    destroy,
  };
};
