// src/core/collection/list-manager/renderer.ts
import { ListManagerConfig, ListManagerElements, VisibleRange } from './types';
import { RecyclingPool } from './utils/recycling';
import { ItemMeasurement } from './item-measurement';
import { calculateItemPositions } from './utils/visibility';

/**
 * Creates a renderer for list items
 * @param config List manager configuration
 * @param elements DOM elements used by the list manager
 * @param itemMeasurement Item measurement utilities
 * @param recyclePool Element recycling pool
 * @returns Renderer functions
 */
export const createRenderer = (
  config: ListManagerConfig,
  elements: ListManagerElements,
  itemMeasurement: ItemMeasurement,
  recyclePool: RecyclingPool
) => {
  // State for renderer
  let renderHook: ((item: any, element: HTMLElement) => void) | null = null;
  const itemElements = new Map<string, HTMLElement>();
  
  /**
   * Create a wrapped renderItem function with hooks and optimizations
   * @param item Item to render
   * @param index Index in the list
   * @returns DOM element
   */
  const createItemElement = (item: any, index: number): HTMLElement => {
    // Check for recycled element first
    const recycled = recyclePool.getRecycledElement(item);
    
    // Create or recycle the element using user-provided function
    const element = config.renderItem(item, index, recycled);
    
    if (!element) {
      console.warn('renderItem returned null or undefined for item', item);
      // Create a placeholder element to prevent errors
      const placeholder = document.createElement('div');
      placeholder.style.height = `${config.itemHeight}px`;
      return placeholder;
    }
    
    // Ensure element has a data-id attribute for selection targeting
    if (item.id && !element.hasAttribute('data-id')) {
      element.setAttribute('data-id', item.id);
    }
    
    // Set type for recycling
    if (item.type) {
      element.dataset.itemType = item.type;
    }
    
    // Apply any post-render hooks if available
    if (renderHook) {
      renderHook(item, element);
    }
    
    return element;
  };
  
  return {
    /**
     * Sets a render hook function that will be called for each rendered item
     * @param hookFn Hook function
     */
    setRenderHook: (hookFn: (item: any, element: HTMLElement) => void): void => {
      renderHook = hookFn;
    },
    
    /**
     * Renders visible items in the viewport
     * @param items All items
     * @param visibleRange Visible range with start and end indices
     * @returns Map of item IDs to rendered elements
     */
    renderVisibleItems: (
      items: any[],
      visibleRange: VisibleRange
    ): Map<string, HTMLElement> => {
      // Check if content exists
      if (!elements.content) {
        console.warn('Cannot render items: content element missing');
        return new Map();
      }
      
      // Save references to existing elements for recycling
      const existingElements = new Map<string, HTMLElement>();
      Array.from(elements.content.children).forEach(child => {
        if (child === elements.topSentinel || child === elements.bottomSentinel) return;
        
        const id = (child as HTMLElement).getAttribute('data-id');
        if (id) {
          existingElements.set(id, child as HTMLElement);
          child.remove(); // Remove but keep reference
        }
      });
      
      // Slice the visible items
      const visibleItems = items.slice(visibleRange.start, visibleRange.end).filter(item => item !== undefined);
      
      // Calculate positions for each visible item
      const positions = calculateItemPositions(items, visibleRange, itemMeasurement);
      
      // Create document fragment for batch DOM updates
      const fragment = document.createDocumentFragment();
      
      // Add sentinel elements back to fragment if they exist
      if (elements.topSentinel) fragment.appendChild(elements.topSentinel);
      
      // Clear the item elements map before adding new elements
      itemElements.clear();
      
      // Render visible items
      positions.forEach(({ index, item, offset }) => {
        let element: HTMLElement;
        
        // Reuse existing element if available
        if (existingElements.has(item.id)) {
          element = existingElements.get(item.id)!;
          existingElements.delete(item.id);
        } else {
          element = createItemElement(item, index);
        }
        
        if (!element) return;
        
        // Position the element absolutely
        element.style.display = '';
        element.style.position = 'absolute';
        element.style.top = `${offset}px`;
        element.style.left = '0';
        element.style.width = '100%';
        
        // Add to fragment
        fragment.appendChild(element);
        
        // Mark for measurement if height not known
        if (!itemMeasurement.getAllHeights().has(item.id)) {
          element.dataset.needsMeasurement = 'true';
        }
        
        // Store the element reference
        itemElements.set(item.id, element);
      });
      
      // Add bottom sentinel after items if it exists
      if (elements.bottomSentinel) fragment.appendChild(elements.bottomSentinel);
      
      // Recycle any remaining elements
      existingElements.forEach(element => {
        recyclePool.recycleElement(element);
      });
      
      // Batch DOM update
      elements.content.innerHTML = '';
      elements.content.appendChild(fragment);
      
      return new Map(itemElements);
    },
    
    /**
     * Gets all currently rendered item elements
     * @returns Map of item IDs to elements
     */
    getItemElements: (): Map<string, HTMLElement> => {
      return new Map(itemElements);
    }
  };
};

export type Renderer = ReturnType<typeof createRenderer>;