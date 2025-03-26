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
    structure,
    element: structure.element,
    component: flattenStructure(structure),
    
    get(name: string) {
      return structure[name] || null;
    },
    
    getAll() {
      return flattenStructure(structure);
    },
    
    destroy() {
      // Destroy root element
      const root = structure.element;
      if (root) {
        if (typeof root.destroy === 'function') {
          root.destroy();
        } else if (root.element && root.element.parentNode) {
          root.element.parentNode.removeChild(root.element);
        } else if (root.parentNode) {
          root.parentNode.removeChild(root);
        }
      }
      
      // Destroy other components
      for (const key in structure) {
        if (key === 'element') continue;
        
        const item = structure[key];
        if (item && typeof item.destroy === 'function') {
          item.destroy();
        }
      }
    }
  };
}