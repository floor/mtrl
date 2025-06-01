// src/components/slider/structure.ts
import { SliderConfig } from './types';

/**
 * Creates the base slider structure definition
 * When using canvas mode, only handle and value bubble are DOM elements
 * 
 * @param component Component for class name generation
 * @param config Slider configuration
 * @returns Structure schema object
 */
export function createSliderSchema(component, config: SliderConfig) {
  // Get prefixed class names
  const getClass = (className) => component.getClass(className);

  // Set default values
  const min = config.min || 0;
  const max = config.max || 100;
  const value = config.value !== undefined ? config.value : min;
  const isDisabled = config.disabled === true;
  const formatter = config.valueFormatter || (val => val.toString());
  
  // Calculate initial position
  const valuePercent = ((value - min) / (max - min)) * 100;
  
  // Return base structure definition formatted for createLayout
  return {
    element: {
      options: {
        className: [getClass('slider'), config.class].filter(Boolean),
        attributes: {
          tabindex: '-1',
          role: 'none',
          'aria-disabled': isDisabled ? 'true' : 'false'
        }
      },
      children: {
        // Container with all slider elements
        container: {
          options: {
            className: getClass('slider-container'),
            style: {
              position: 'relative' // For canvas absolute positioning
            }
          },
          children: {
            // Canvas will be inserted directly into container
            // No need for track or ticks elements
            
            // Main handle (kept as DOM for accessibility)
            handle: {
              options: {
                className: getClass('slider-handle'),
                attributes: {
                  role: 'slider',
                  'aria-valuemin': String(min),
                  'aria-valuemax': String(max),
                  'aria-valuenow': String(value),
                  'aria-orientation': 'horizontal',
                  tabindex: isDisabled ? '-1' : '0',
                  'aria-disabled': isDisabled ? 'true' : 'false',
                  'data-value': String(value),
                  'data-handle-index': '0'
                },
                style: {
                  left: `${valuePercent}%`
                }
              }
            }, 
            
            // Main value bubble (kept as DOM for text rendering)
            valueBubble: {
              options: {
                className: getClass('slider-value'),
                attributes: {
                  'aria-hidden': 'true',
                  'data-handle-index': '0'
                },
                text: formatter(value),
                style: {
                  left: `${valuePercent}%`
                }
              }
            }
          }
        }
      }
    }
  };
}