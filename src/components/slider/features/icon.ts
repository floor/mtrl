// src/components/slider/features/icon.ts
import { SliderConfig } from '../types';
import { createElement } from '../../../core/dom/create';

/**
 * Enhances structure definition with an icon
 * 
 * @param config Slider configuration
 * @returns Component enhancer that adds icon to structure
 */
export const withIcon = (config: SliderConfig) => component => {
  // If no icon or missing structure definition, return unmodified
  if (!config.icon || !component.structureDefinition) {
    return component;
  }

  try {
    // Clone the structure definition
    const structureDefinition = JSON.parse(JSON.stringify(component.structureDefinition));
    
    // Get class name generator
    const getClass = component.getClass;
    
    // Determine icon position
    const position = config.iconPosition || 'start';
    
    // Create icon element definition
    const iconDef = {
      name: 'icon',
      creator: createElement,
      options: {
        tag: 'span',
        className: [
          getClass('slider-icon'),
          getClass(`slider-icon--${position}`)
        ],
        html: config.icon
      }
    };
    

    // Add icon class to element

    structureDefinition.element.options.className.push(getClass('slider--icon'),)

    // Add icon to container children
    const containerChildren = structureDefinition.element.children;
    
    if (position === 'start') {
      // Create new children object with icon first
      const existingChildren = { ...containerChildren };
      structureDefinition.element.children = {
        icon: iconDef,
        ...existingChildren
      };
    } else {
      // Add icon after existing children
      containerChildren.icon = iconDef;
    }
    
    // Return component with updated structure definition
    return {
      ...component,
      structureDefinition
    };
  } catch (error) {
    console.warn('Error enhancing structure with icon:', error);
    return component;
  }
};