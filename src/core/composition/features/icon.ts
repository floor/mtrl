// src/core/composition/features/icon.ts
import { createElement } from '../../dom/create';

/**
 * Configuration for icon feature
 */
export interface IconConfig {
  /**
   * Icon HTML content
   */
  icon?: string;
  
  /**
   * Position of the icon ('start' or 'end')
   */
  iconPosition?: 'start' | 'end';
  
  /**
   * Size variant for the icon
   */
  iconSize?: string;
  
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Component name for class generation
   */
  componentName?: string;
  
  [key: string]: any;
}

/**
 * Enhances structure definition with an icon element
 * Unlike the traditional withIcon, this modifies the structure definition
 * without creating actual DOM elements.
 * 
 * @param config Configuration containing icon information
 * @returns Component enhancer that adds icon to structure definition
 * 
 * @example
 * ```ts
 * // Add icon to a structure definition
 * const component = pipe(
 *   createBase,
 *   withStructure(config),
 *   withIcon(config)
 * )(config);
 * ```
 */
export const withIcon = (config: IconConfig) => component => {
  // If no icon or missing structure definition, return unmodified
  if (!config.icon || !component.structureDefinition) {
    return component;
  }
  
  try {
    // Get component details for class names
    const prefix = config.prefix || component.config?.prefix || 'mtrl';
    const componentName = config.componentName || component.componentName || 'component';
    
    // Clone the structure definition
    const structureDefinition = JSON.parse(JSON.stringify(component.structureDefinition));
    
    // Determine icon position
    const position = config.iconPosition || 'start';
    
    // Add the --icon modifier class to the main element
    const elementClasses = structureDefinition.element.options.className || [];
    const iconModifierClass = `${prefix}-${componentName}--icon`;
    
    if (Array.isArray(elementClasses)) {
      if (!elementClasses.includes(iconModifierClass)) {
        elementClasses.push(iconModifierClass);
      }
    } else if (typeof elementClasses === 'string') {
      if (!elementClasses.includes(iconModifierClass)) {
        structureDefinition.element.options.className = `${elementClasses} ${iconModifierClass}`.trim();
      }
    } else {
      structureDefinition.element.options.className = [iconModifierClass];
    }
    
    // Create icon element definition with component-specific class
    const iconDef = {
      name: 'icon',
      creator: createElement,
      options: {
        tag: 'span',
        className: [
          `${prefix}-${componentName}-icon`,
          `${prefix}-${componentName}-icon--${position}`
        ],
        html: config.icon
      }
    };
    
    // Add size class if specified
    if (config.iconSize) {
      const classes = iconDef.options.className;
      if (Array.isArray(classes)) {
        classes.push(`${prefix}-${componentName}-icon--${config.iconSize}`);
      }
    }
    
    // Add icon directly to the main element's children
    if (position === 'start') {
      // Create new children object with icon first
      const existingChildren = { ...structureDefinition.element.children };
      structureDefinition.element.children = {
        icon: iconDef,
        ...existingChildren
      };
    } else {
      // Add icon after existing children
      structureDefinition.element.children.icon = iconDef;
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