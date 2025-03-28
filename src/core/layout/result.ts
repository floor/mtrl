// src/core/layout/result.ts
/**
 * @module core/layout
 * @description Simplified layout result creation and management
 */

import { LayoutResult } from './types';
import { isComponent, flattenLayout } from './utils';

/**
 * Creates a result object with the layout and utility functions
 * Simplified API for better usability and reduced overhead
 * 
 * @param layout - The raw layout object
 * @returns Result object with layout and utility functions
 */
export function createLayoutResult(layout: Record<string, any>): LayoutResult {
  // Pre-compute flattened layout for better performance
  const flattenedComponents = flattenLayout(layout);
  
  // Create the result object with layout correctly exposed
  const result: LayoutResult = {
    // Raw layout object
    layout,
    
    // Root element reference for convenience
    element: layout.element,
    
    // Flattened component map
    component: flattenedComponents,

    /**
     * Gets a component by name
     * 
     * @param name - Component name
     * @returns Component if found, null otherwise
     */
    get(name: string): any {
      return layout[name] ?? null;
    },
    
    /**
     * Gets all components in a flattened map
     * 
     * @returns Object with all components
     */
    getAll(): Record<string, any> {
      return flattenedComponents;
    },
    
    /**
     * Destroys the layout, cleaning up all components
     */
    destroy(): void {
      // Handle root element
      const root = layout.element;
      if (root) {
        // Component with destroy method
        if (isComponent(root) && typeof root.destroy === 'function') {
          root.destroy();
        } 
        // Component without destroy method
        else if (isComponent(root) && root.element?.parentNode) {
          root.element.parentNode.removeChild(root.element);
        }
        // Direct DOM element
        else if (root instanceof HTMLElement && root.parentNode) {
          root.parentNode.removeChild(root);
        }
      }
      
      // Clean up other components that have a destroy method
      for (const key in layout) {
        if (key === 'element') continue;
        
        const item = layout[key];
        if (isComponent(item) && typeof item.destroy === 'function') {
          item.destroy();
        }
      }
    }
  };
  
  return result;
}