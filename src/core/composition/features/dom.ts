// src/core/composition/features/dom.ts
import createStructure from '../../structure';

/**
 * Creates DOM elements from structure definition using the core createStructure utility
 * This is a key feature that bridges the gap between declarative structure and actual DOM
 * 
 * @returns Component enhancer that creates DOM structure
 */
export const withDom = () => component => {
  // Return unmodified component if no structure definition
  if (!component.structureDefinition) {
    return component;
  }
  
  try {
    // Use the existing createStructure function to build the DOM
    const structure = createStructure(component.structureDefinition);
    
    // Use the existing flattenStructure function to create a flat reference map
    const components = structure.getAll();

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