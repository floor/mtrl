// src/components/chips/schema.ts
import { ChipsConfig } from './types';

/**
 * Creates the base chips structure definition
 * 
 * @param component Component for class name generation
 * @param config Chips configuration
 * @returns Structure schema object
 */
export function createChipsSchema(component, config: ChipsConfig) {
  // Get prefixed class names
  const getClass = (className) => component.getClass(className);

  // Set default values
  const scrollable = config.scrollable === true;
  const vertical = config.vertical === true;
  const isMultiSelect = config.multiSelect === true;
  const hasLabel = config.label && config.label.trim().length > 0;
  const labelPosition = config.labelPosition || 'start';
  
  // Return base structure definition formatted for createStructure
  return {
    element: {
      options: {
        className: [
          getClass('chips'),
          scrollable ? getClass('chips--scrollable') : null,
          vertical ? getClass('chips--vertical') : null,
          hasLabel ? getClass('chips--with-label') : null,
          hasLabel && labelPosition === 'end' ? getClass('chips--label-end') : null,
          config.class
        ].filter(Boolean),
        attributes: {
          tabindex: '0',
          role: 'group',
          'aria-multiselectable': isMultiSelect ? 'true' : 'false'
        }
      },
      children: {
        // Label element if provided
        ...(hasLabel ? {
          label: {
            options: {
              tag: 'label',
              className: getClass('chips-label'),
              text: config.label
            }
          }
        } : {}),
        
        // Chips container where chip instances will be inserted
        chipContainer: {
          options: {
            className: getClass('chips-container')
          }
        }
      }
    }
  };
}