// src/core/structure/result.ts
/**
 * @module core/structure
 * @description Simplified structure result creation and management
 */

import { StructureResult } from './types';
import { isComponent, flattenStructure } from './utils';

/**
 * Creates a result object with the structure and utility functions
 * Simplified API for better usability and reduced overhead
 * 
 * @param structure - The raw structure object
 * @returns Result object with structure and utility functions
 */
export function createStructureResult(structure: Record<string, any>): StructureResult {
  // Pre-compute flattened structure for better performance
  const flattenedComponents = flattenStructure(structure);
  
  // Create the result object with structure correctly exposed
  const result: StructureResult = {
    // Raw structure object
    structure,
    
    // Root element reference for convenience
    element: structure.element,
    
    // Flattened component map
    component: flattenedComponents,

    /**
     * Gets a component by name
     * 
     * @param name - Component name
     * @returns Component if found, null otherwise
     */
    get(name: string): any {
      return structure[name] ?? null;
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
     * Destroys the structure, cleaning up all components
     */
    destroy(): void {
      // Handle root element
      const root = structure.element;
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
      for (const key in structure) {
        if (key === 'element') continue;
        
        const item = structure[key];
        if (isComponent(item) && typeof item.destroy === 'function') {
          item.destroy();
        }
      }
    }
  };
  
  return result;
}