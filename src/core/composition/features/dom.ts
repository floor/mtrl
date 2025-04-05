// src/core/composition/features/dom.ts
import createLayout from '../../layout';

/**
 * Creates DOM elements from component schema using the core fLayout utility
 * This is a key feature that bridges the gap between declarative schema and actual DOM
 * 
 * @returns Component enhancer that creates DOM structure from schema
 * 
 * @example
 * ```ts
 * // Materialize component schema into DOM
 * const component = pipe(
 *   createBase,
 *   withLayout(config),
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
    // Use the fLayout function to build the DOM from schema
    const layout = createLayout(component.schema);
    
    // Use the layout's utility functions to get components
    const components = layout.getAll();

    // Return enhanced component with DOM layout
    return {
      ...component,
      element: layout.element, // Root element
      components               // All component elements
    };
  } catch (error) {
    console.error('Failed to create DOM structure:', error);
    throw new Error(`Failed to create component DOM: ${error.message}`);
  }
};