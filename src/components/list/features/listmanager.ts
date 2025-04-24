// src/components/list/features/listmanager.ts

import { createListManager } from '../../../core/collection/list-manager';

/**
 * Adds list management capabilities to a component
 * Optimized implementation for better performance
 * 
 * @param config - Configuration options
 * @returns Function that enhances a component with list management
 */
export const withListManager = (config) => component => {
  if (!component.element) {
    console.warn('Cannot initialize list manager: missing element');
    return component;
  }

  // Store user-provided render function
  const userRenderItem = config.renderItem;
  
  // Create a wrapper for renderItem that will be replaced after initialization
  let renderHook = null;
  
  // Create a wrapper renderItem function that can be safely intercepted
  const wrappedRenderItem = (item, index, recycledElement) => {
    // Create or reuse the element using user provided function
    const element = userRenderItem 
      ? userRenderItem(item, index, recycledElement)
      : renderDefaultItem(item, recycledElement);
      
    // Ensure element has a data-id attribute for selection targeting
    if (element && item.id && !element.hasAttribute('data-id')) {
      element.setAttribute('data-id', item.id);
    }
    
    // Apply any post-render hooks if available
    if (renderHook) {
      renderHook(item, element);
    }
    
    return element;
  };
  
  /**
   * Default item renderer when none is provided
   * @param {Object} item - Item to render
   * @param {HTMLElement} recycledElement - Optional element to reuse
   * @returns {HTMLElement} Rendered element
   */
  function renderDefaultItem(item, recycledElement) {
    const element = recycledElement || document.createElement('div');
    element.className = 'mtrl-list-item';
    element.textContent = item.text || item.title || item.headline || item.name || item.id;
    return element;
  }

  // Initialize list manager with our wrapped renderItem
  const listManager = createListManager(
    config.collection,
    component.element,
    {
      transform: config.transform,
      renderItem: wrappedRenderItem,
      itemHeight: config.itemHeight,
      pageSize: config.pageSize,
      renderBufferSize: config.renderBufferSize,
      baseUrl: config.baseUrl,
      staticItems: Array.isArray(config.items) ? config.items : null,
      afterLoad: (data) => {
        component.emit('load', data);
        if (config.afterLoad) config.afterLoad(data);
      }
    }
  );

  // Add the hook setter method - this doesn't access listManager directly
  listManager.setRenderHook = (hookFn) => {
    renderHook = hookFn;
  };

  // Clean up on destruction
  if (component.lifecycle && component.lifecycle.destroy) {
    const originalDestroy = component.lifecycle.destroy;
    component.lifecycle.destroy = () => {
      listManager.destroy();
      originalDestroy();
    };
  }

  // Return component with list manager
  return {
    ...component,
    list: listManager
  };
};

export default withListManager;