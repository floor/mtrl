// src/core/composition/features/label.ts
import { createElement } from '../../dom/create';

/**
 * Configuration for label feature
 */
export interface LabelConfig {
  /**
   * Label text content
   */
  label?: string;
  
  /**
   * Position of the label ('start', 'end', 'top', or 'bottom')
   */
  labelPosition?: 'start' | 'end' | 'top' | 'bottom';
  
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Component name for class generation
   */
  componentName?: string;
  
  /**
   * ID for the input element this label is associated with
   */
  id?: string;
  
  /**
   * Whether the labeled element is required
   */
  required?: boolean;
  
  [key: string]: any;
}

/**
 * Enhances structure definition with a label element
 * Unlike the traditional withLabel, this modifies the structure definition
 * without creating actual DOM elements.
 * 
 * @param config Configuration containing label information
 * @returns Component enhancer that adds label to structure definition
 * 
 * @example
 * ```ts
 * // Add label to a structure definition
 * const component = pipe(
 *   createBase,
 *   withStructure(config),
 *   withLabel(config)
 * )(config);
 * ```
 */
export const withLabel = (config: LabelConfig) => component => {
  // If no label or missing structure definition, return unmodified

  if (!config.label || !component.structureDefinition) {
    return component;
  }
  
  try {
    // Get class name generator
    const getClass = (className) => {
      if (typeof component.getClass === 'function') {
        return component.getClass(className);
      }
      const prefix = config.prefix || 'mtrl';
      return `${prefix}-${className}`;
    };
    
    // Get component details
    const prefix = config.prefix || component.config?.prefix || 'mtrl';
    const componentName = config.componentName || component.componentName || 'component';
    
    // Clone the structure definition
    const structureDefinition = JSON.parse(JSON.stringify(component.structureDefinition));
    
    // Determine position (default to 'start')
    const position = config.labelPosition || 'start';
    
    // Create the label element definition
    let labelContent = config.label;
    let labelChildren = null;
    
    // Add required indicator if specified
    if (config.required) {
      // For structure definition we need to define a child element
      labelChildren = {
        requiredIndicator: {
          name: 'requiredIndicator',
          creator: createElement,
          options: {
            tag: 'span',
            className: `${prefix}-${componentName}-label-required`,
            text: '*',
            attrs: {
              'aria-hidden': 'true'
            }
          }
        }
      };
      
      // Clear the content since we'll use children instead
      labelContent = config.label;
    }
    
    // Create label element definition
    const labelDef = {
      name: 'label',
      creator: createElement,
      options: {
        tag: 'label',
        className: [
          `${prefix}-${componentName}-label`,
          `${prefix}-${componentName}-label--${position}`
        ],
        attrs: {
          'for': config.id // Optional connection to input by ID
        },
        text: labelContent
      }
    };
    
    // Add children if we have them
    if (labelChildren) {
      labelDef.children = labelChildren;
    }
    
    // Add label to root element's children
    if (position === 'end' || position === 'bottom') {
      // Add at end of root element
      structureDefinition.element.children.label = labelDef;
    } else {
      // Add at beginning of root element (start/top)
      const existingChildren = { ...structureDefinition.element.children };
      structureDefinition.element.children = {
        label: labelDef,
        ...existingChildren
      };
    }
    
    // Return component with updated structure definition
    return {
      ...component,
      structureDefinition
    };
  } catch (error) {
    console.warn('Error enhancing structure with label:', error);
    return component;
  }
};