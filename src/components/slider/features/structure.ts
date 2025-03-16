// src/components/slider/features/structure.ts
import { SLIDER_COLORS, SLIDER_SIZES } from '../constants';
import { SliderConfig } from '../types';
import createLayout from '../../../core/layout';
import { createElement } from '../../../core/dom/create';

/**
 * Creates the slider DOM structure using layout system
 * @param config Slider configuration
 * @returns Component enhancer with DOM structure
 */
export const withStructure = (config: SliderConfig) => component => {
  // Set default values
  const min = config.min || 0;
  const max = config.max || 100;
  const value = config.value !== undefined ? config.value : min;
  const secondValue = config.secondValue !== undefined ? config.secondValue : null;
  const isRangeSlider = config.range && secondValue !== null;
  const isDisabled = config.disabled === true;
  
  // Format the values
  const formatter = config.valueFormatter || (val => val.toString());
  
  // Get prefixed class names
  const getClass = (className) => component.getClass(className);
  
  // Define slider structure
  const structure = [
    [createElement, 'container', { 
      className: getClass('slider-container') 
    }, [
      // Track with segments
      [createElement, 'track', { 
        className: getClass('slider-track') 
      }, [
        [createElement, 'startTrack', { 
          className: getClass('slider-start-track') 
        }],
        [createElement, 'activeTrack', { 
          className: getClass('slider-active-track') 
        }],
        [createElement, 'remainingTrack', { 
          className: getClass('slider-remaining-track') 
        }]
      ]],
      
      // Ticks container
      [createElement, 'ticksContainer', { 
        className: getClass('slider-ticks-container') 
      }],
      
      // Dots for ends
      [createElement, 'startDot', { 
        className: [
          getClass('slider-dot'),
          getClass('slider-dot--start')
        ]
      }],
      [createElement, 'endDot', { 
        className: [
          getClass('slider-dot'),
          getClass('slider-dot--end')
        ]
      }],
      
      // Main handle
      [createElement, 'handle', { 
        className: getClass('slider-handle'),
        attrs: {
          'role': 'slider',
          'aria-valuemin': String(min),
          'aria-valuemax': String(max),
          'aria-valuenow': String(value),
          'aria-orientation': 'horizontal',
          'tabindex': isDisabled ? '-1' : '0',
          'aria-disabled': isDisabled ? 'true' : 'false'
        },
        style: {
          left: `${((value - min) / (max - min)) * 100}%`
        }
      }],
      
      // Main value bubble
      [createElement, 'valueBubble', { 
        className: getClass('slider-value'),
        text: formatter(value)
      }]
    ]]
  ];
  
  // Add second handle and bubble for range slider
  if (isRangeSlider) {
    const secondHandlePos = ((secondValue - min) / (max - min)) * 100;
    
    // Add second handle to structure
    structure[0][3].push(
      [createElement, 'secondHandle', { 
        className: getClass('slider-handle'),
        attrs: {
          'role': 'slider',
          'aria-valuemin': String(min),
          'aria-valuemax': String(max),
          'aria-valuenow': String(secondValue),
          'aria-orientation': 'horizontal',
          'tabindex': isDisabled ? '-1' : '0',
          'aria-disabled': isDisabled ? 'true' : 'false'
        },
        style: {
          left: `${secondHandlePos}%`
        }
      }]
    );
    
    // Add second bubble to structure
    structure[0][3].push(
      [createElement, 'secondValueBubble', { 
        className: getClass('slider-value'),
        text: formatter(secondValue)
      }]
    );
  }
  
  // Create layout and get structure elements
  const components = createLayout(structure, component.element).component;
  
  // Add component base class and accessibility attributes
  component.element.classList.add(component.getClass('slider'));
  component.element.setAttribute('tabindex', '-1');
  component.element.setAttribute('role', 'none');
  component.element.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
  
  // Position any icon properly
  const iconElement = component.element.querySelector(`.${component.getClass('icon')}`);
  if (iconElement && config.label) {
    iconElement.classList.add(component.getClass('slider-icon'));
    component.element.classList.add(component.getClass('slider--icon'));
  }
  
  // Apply style classes
  applyStyleClasses(component, config, isRangeSlider, isDisabled);
  
  // Return enhanced component with structure
  return {
    ...component,
    structure: components
  };
};

/**
 * Applies style classes based on configuration
 */
function applyStyleClasses(component, config, isRangeSlider, isDisabled) {
  const baseClass = component.getClass('slider');
  
  // Apply size class
  const size = config.size || SLIDER_SIZES.MEDIUM;
  if (size !== SLIDER_SIZES.MEDIUM) {
    component.element.classList.add(`${baseClass}--${size}`);
  }
  
  // Apply color class
  const color = config.color || SLIDER_COLORS.PRIMARY;
  if (color !== SLIDER_COLORS.PRIMARY) {
    component.element.classList.add(`${baseClass}--${color}`);
  }
  
  // Apply discrete class if step is specified
  if (config.step !== undefined && config.step > 0) {
    component.element.classList.add(`${baseClass}--discrete`);
  }
  
  // Apply disabled class if needed
  if (isDisabled) {
    component.element.classList.add(`${baseClass}--disabled`);
  }
  
  // Apply range class if needed
  if (isRangeSlider) {
    component.element.classList.add(`${baseClass}--range`);
  }
}