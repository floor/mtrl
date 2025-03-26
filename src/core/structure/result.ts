// src/core/structure/result.ts
/**
 * @module core/structure
 * @description Structure result creation and management
 */

import { StructureResult } from './types';
import { isComponent, flattenStructure } from './utils';

/**
 * Creates a result object with the structure and utility functions
 * 
 * @param structure - The raw structure object
 * @returns Result object with structure and utility functions
 */
export function createStructureResult(structure: Record<string, any>): StructureResult {
  return {
    // Raw structure object
    structure,
    
    // Root element reference for convenience
    element: structure.element,
    
    // Flattened component map for easier access
    component: flattenStructure(structure),

    /**
     * Gets a component by name
     * 
     * @param name - Component name
     * @returns Component if found, null otherwise
     */
    get: (name: string): any => {
      return structure[name] || null;
    },
    
    /**
     * Gets all components in a flattened map
     * 
     * @returns Object with all components
     */
    getAll: (): Record<string, any> => {
      return flattenStructure(structure);
    },
    
    /**
     * Destroys the structure, cleaning up all components
     */
    destroy: (): void => {
      // Clean up the root element if it exists
      if (structure.element) {
        // If element is a component with a destroy method, call it
        if (isComponent(structure.element) && typeof structure.element.destroy === 'function') {
          structure.element.destroy();
        } 
        // Otherwise, if it's a DOM element or component, remove it from the DOM
        else if (isComponent(structure.element) && structure.element.element.parentNode) {
          structure.element.element.parentNode.removeChild(structure.element.element);
        }
        else if (structure.element instanceof HTMLElement && structure.element.parentNode) {
          structure.element.parentNode.removeChild(structure.element);
        }
      }
      
      // Clean up all other components in the structure
      Object.keys(structure).forEach(key => {
        if (key === 'element') {
          return; // Already handled element
        }
        
        const item = structure[key];
        
        // Handle component objects
        if (isComponent(item) && typeof item.destroy === 'function') {
          item.destroy();
        }
        // Handle DOM elements
        else if (item instanceof HTMLElement && item.parentNode) {
          item.parentNode.removeChild(item);
        }
      });
    }
  };
}