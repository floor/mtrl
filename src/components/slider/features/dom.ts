// src/components/slider/features/dom.ts
import { createStructure, flattenStructure } from '../../../core/structure';

/**
 * Creates DOM elements from structure definition using the core createStructure utility
 * 
 * @returns Component enhancer that creates DOM structure
 */
export const withDom = () => component => {
  // Return unmodified component if no structure definition
  if (!component.structureDefinition) {
    console.warn('Cannot create DOM: missing structure definition');
    return component;
  }
  
  try {
    // Use the existing createStructure function to build the DOM
    const structure = createStructure(component.structureDefinition);
    
    // Use the existing flattenStructure function to create a flat reference map
    const components = flattenStructure(structure);
    
    // Return enhanced component with DOM structure
    return {
      ...component,
      element: structure.element, // Root element
      components                  // All component elements
    };
  } catch (error) {
    console.error('Failed to create DOM structure:', error);
    throw new Error(`Failed to create slider DOM: ${error.message}`);
  }
};