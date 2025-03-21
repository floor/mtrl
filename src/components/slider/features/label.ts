// src/components/slider/features/label.ts
import { SliderConfig } from '../types';
import { createElement } from '../../../core/dom/create';

/**
 * Enhances structure definition with a label
 * 
 * @param config Slider configuration
 * @returns Component enhancer that adds label to structure
 */
export const withLabel = (config: SliderConfig) => component => {
  // If no label or missing structure definition, return unmodified
  if (!config.label || !component.structureDefinition) {
    return component;
  }

  try {
    // Clone the structure definition
    const structureDefinition = JSON.parse(JSON.stringify(component.structureDefinition));
    
    // Get class name generator
    const getClass = component.getClass;
    
    // Determine label position
    const position = config.labelPosition || 'start';
    
    // Create label element definition
    const labelDef = {
      name: 'label',
      creator: createElement,
      options: {
        tag: 'label',
        className: [
          getClass('slider-label'),
          getClass(`slider-label--${position}`)
        ],
        attrs: {
          'for': config.id // If ID is specified
        },
        text: config.label
      }
    };
    
    // Add label to root element's children
    if (position === 'start') {
      // Create new children object with label first
      const existingChildren = structureDefinition.element.children;
      structureDefinition.element.children = {
        label: labelDef,
        ...existingChildren
      };
    } else {
      // Add label after existing children
      structureDefinition.element.children.label = labelDef;
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