import { LIST_CLASSES, LIST_EVENTS } from '../constants';

/**
 * Adds static list capabilities to a component
 * Simple, direct rendering for static data without virtual scrolling complexity
 * 
 * @param config - Configuration options
 * @returns Function that enhances a component with static list capabilities
 */
export const withStaticItems = (config) => component => {
  if (!component.element) {
    console.warn('Cannot initialize static list: missing element');
    return component;
  }

  const items = config.items || [];
  const userRenderItem = config.renderItem;
  
  // Create container for list items
  const listContainer = document.createElement('div');
  listContainer.className = 'mtrl-list-content';
  listContainer.style.position = 'relative';
  listContainer.style.width = '100%';
  
  component.element.appendChild(listContainer);

  /**
   * Renders all static items directly
   */
  const renderAllItems = () => {
    // Clear existing content
    listContainer.innerHTML = '';
    
    // Create document fragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    
    items.forEach((item, index) => {
      if (!item) return;
      
      // Create the item element
      const element = userRenderItem 
        ? userRenderItem(item, index)
        : renderDefaultItem(item);
      
      if (!element) return;
      
      // Ensure element has proper classes and attributes
      if (!element.classList.contains(LIST_CLASSES.ITEM)) {
        element.classList.add(LIST_CLASSES.ITEM);
      }
      
      // Add data-id for selection targeting
      if (item.id && !element.hasAttribute('data-id')) {
        element.setAttribute('data-id', item.id);
      }
      
      // Note: Selection handling is done by the withSelection feature
      // so we don't add click handlers here to avoid conflicts
      
      fragment.appendChild(element);
    });
    
    listContainer.appendChild(fragment);
    
    console.log(`📋 Rendered ${items.length} static items directly`);
  };

  /**
   * Default item renderer when none is provided
   */
  function renderDefaultItem(item) {
    const element = document.createElement('div');
    element.className = LIST_CLASSES.ITEM;
    
    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'mtrl-list-item-content';
    
    const text = document.createElement('div');
    text.className = 'mtrl-list-item-text';
    text.textContent = item.text || item.title || item.headline || item.name || item.id;
    
    content.appendChild(text);
    element.appendChild(content);
    
    return element;
  }

  // Note: All selection functionality is handled by the withSelection feature

  // Initial render
  renderAllItems();

  // Clean up on destruction
  if (component.lifecycle && component.lifecycle.destroy) {
    const originalDestroy = component.lifecycle.destroy;
    component.lifecycle.destroy = () => {
      listContainer.innerHTML = '';
      originalDestroy();
    };
  }

  // Return component with static list API
  return {
    ...component,
    list: {
      // Simple API for static lists
      getItems: () => items,
      getAllItems: () => items, // For selection feature compatibility
      getVisibleItems: () => items, // All items are "visible" in static lists
      refresh: renderAllItems,
      
      // Render hook support (no-op for static lists since selection is handled differently)
      setRenderHook: (hookFn) => {
        console.log("📋 Static list doesn't need render hooks - selection handled directly");
      },
      
      // Placeholder methods for API compatibility
      loadNext: () => Promise.resolve({ hasNext: false, items: [] }),
      loadPage: () => Promise.resolve({ hasNext: false, items: [] }),
      scrollToItem: (item) => {
        const element = listContainer.querySelector(`[data-id="${item.id}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      },
      scrollToIndex: (index) => {
        const element = listContainer.children[index];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      },
      isLoading: () => false,
      hasNextPage: () => false,
      isApiMode: () => false,
    }
  };
};

export default withStaticItems; 