// src/components/list/features/renderer.ts

import { LIST_CLASSES, LIST_EVENTS } from '../constants';
import type {
  ListConfig,
  ListFeatureHost,
  ListItem,
  ListRenderer,
  ScrollPosition,
} from '../types';

import { setHTML } from "../../../core/dom/html";
/**
 * Adds item rendering capabilities to a component
 * Renders static data directly without virtual scrolling or complex management
 * 
 * @param config - Configuration options
 * @returns Function that enhances a component with item rendering capabilities
 */
export const withRenderer =
  (config: ListConfig<ListItem>) =>
  <C extends ListFeatureHost>(component: C): C & { list: ListRenderer } => {
  // There used to be a `if (!component.element)` guard here that warned and
  // returned the component untouched. withElement runs before this in the only
  // pipe that calls it, so it could not fire -- and had it fired it would have
  // handed back a component with no `list`, which withSelection and withAPI
  // both read. The host type requires the element instead.
  const items = config.items || [];
  const userRenderItem = config.renderItem;
  
  // Create container for list items
  const listContainer = document.createElement('div');
  listContainer.className = 'mtrl-list-content';
  listContainer.setAttribute('role', 'list');
  
  component.element.appendChild(listContainer);

  /**
   * Default item renderer when none is provided
   */
  function renderDefaultItem(item: ListItem): HTMLElement {
    const element = document.createElement('div');
    element.className = LIST_CLASSES.ITEM;
    element.setAttribute('role', 'listitem');
    
    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'mtrl-list-item-content';
    
    const text = document.createElement('div');
    text.className = 'mtrl-list-item-text';
    text.textContent = String(
      item.text || item.title || item.headline || item.name || item.id || item
    );
    
    content.appendChild(text);
    element.appendChild(content);
    
    return element;
  }

  /**
   * Renders all items directly
   */
  const renderAllItems = () => {
    // Clear existing content
    listContainer.replaceChildren();
    
    if (!items || items.length === 0) {
      setHTML(listContainer, '<div class="mtrl-list-empty">No items</div>');
      return;
    }
    
    // Create document fragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    
    items.forEach((item: ListItem, index: number) => {
      if (item == null) return;
      
      // Create the item element
      const element = userRenderItem 
        ? userRenderItem(item, index)
        : renderDefaultItem(item);
      
      if (!element) return;
      
      // Ensure element has proper classes and attributes
      if (!element.classList.contains(LIST_CLASSES.ITEM)) {
        element.classList.add(LIST_CLASSES.ITEM);
      }
      
      if (!element.hasAttribute('role')) {
        element.setAttribute('role', 'listitem');
      }
      
      // Add data-id for selection targeting (use index as fallback)
      const itemId = String(item?.id || index);
      if (!element.hasAttribute('data-id')) {
        element.setAttribute('data-id', itemId);
      }
      
      fragment.appendChild(element);
    });
    
    listContainer.appendChild(fragment);
    
    // Emit load event for consistency
    component.emit?.(LIST_EVENTS.LOAD, {
      items,
      loading: false,
      hasNext: false,
      hasPrev: false,
      component
    });
  };

  /**
   * Scroll to a specific item by ID
   */
  const scrollToItem = (
    itemId: string | number,
    position: ScrollPosition = 'start',
    animate = false
  ): void => {
    const element = listContainer.querySelector(`[data-id="${itemId}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: animate ? 'smooth' : 'auto', 
        block: position === 'center' ? 'center' : position === 'end' ? 'end' : 'start'
      });
    }
  };

  /**
   * Scroll to a specific index
   */
  const scrollToIndex = (
    index: number,
    position: ScrollPosition = 'start',
    animate = false
  ): void => {
    if (index < 0 || index >= items.length) return;
    
    const element = listContainer.children[index];
    if (element) {
      element.scrollIntoView({ 
        behavior: animate ? 'smooth' : 'auto', 
        block: position === 'center' ? 'center' : position === 'end' ? 'end' : 'start'
      });
    }
  };

  // Initial render
  renderAllItems();

  // Clean up on destruction
  if (component.lifecycle?.destroy) {
    const originalDestroy = component.lifecycle.destroy;
    component.lifecycle.destroy = () => {
      listContainer.replaceChildren();
      originalDestroy();
    };
  }

      // Return component with list renderer API
  return {
    ...component,
    list: {
      // Core methods
      getItems: () => items,
      getAllItems: () => items,
      getVisibleItems: () => items, // All items are "visible" in rendered lists
      refresh: renderAllItems,
      
      // Scrolling methods
      scrollToItem,
      scrollToIndex,
      
      // Compatibility methods (no-ops for rendered lists)
      loadNext: () => Promise.resolve({ hasNext: false, items: [] }),
      loadPage: () => Promise.resolve({ hasNext: false, items: [] }),
      loadPrevious: () => Promise.resolve({ hasPrev: false, items: [] }),
      scrollNext: () => Promise.resolve({ hasNext: false, items: [] }),
      scrollPrevious: () => Promise.resolve({ hasPrev: false, items: [] }),
      scrollToItemById: (
        itemId: string | number,
        position?: ScrollPosition,
        animate?: boolean
      ) => {
        scrollToItem(itemId, position, animate);
        return Promise.resolve();
      },
      onCollectionChange: () => () => {}, // No-op unsubscribe
      onPageChange: () => () => {}, // No-op unsubscribe
      getCurrentPage: () => 1,
      getPageSize: () => items.length,
      getCollection: () => null,
      isApiMode: () => false,
      isLoading: () => false,
      hasNextPage: () => false,
    }
  };
};

export default withRenderer;