// src/core/composition/features/dom.ts
import createStructure from '../../structure';

/**
 * Creates DOM elements from component schema using the core createStructure utility
 * This is a key feature that bridges the gap between declarative schema and actual DOM
 * 
 * @returns Component enhancer that creates DOM structure from schema
 * 
 * @example
 * ```ts
 * // Materialize component schema into DOM
 * const component = pipe(
 *   createBase,
 *   withStructure(config),
 *   withIcon(config),
 *   withLabel(config),
 *   withDom()
 * )(config);
 * ```
 */
export const withDom = () => component => {
  // Return unmodified component if no schema
  if (!component.schema) {
    return component;
  }
  
  try {
    // Use the createStructure function to build the DOM from schema
    const structure = createStructure(component.schema);
    
    // Use the structure's utility functions to get components
    const components = structure.getAll();

    // Return enhanced component with DOM structure
    return {
      ...component,
      element: structure.element, // Root element
      components                  // All component elements
    };
  } catch (error) {
    console.error('Failed to create DOM structure:', error);
    throw new Error(`Failed to create component DOM: ${error.message}`);
  }
};