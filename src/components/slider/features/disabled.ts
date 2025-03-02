// src/components/slider/features/disabled.ts
import { SliderConfig } from '../types';

/**
 * Add disabled state functionality to component
 * @param config Slider configuration
 * @returns Component enhancer with disabled functionality
 */
export const withDisabled = (config: SliderConfig) => component => {
  // Initial disabled state
  const isDisabled = config.disabled === true;
  
  return {
    ...component,
    disabled: {
      enable() {
        component.element.classList.remove(`${component.getClass('slider')}--disabled`);
        component.element.setAttribute('aria-disabled', 'false');
        component.element.tabIndex = 0;
        component.structure.thumb.tabIndex = 0;
        
        if (config.range && component.structure.secondThumb) {
          component.structure.secondThumb.tabIndex = 0;
        }
      },
      
      disable() {
        component.element.classList.add(`${component.getClass('slider')}--disabled`);
        component.element.setAttribute('aria-disabled', 'true');
        component.element.tabIndex = -1;
        component.structure.thumb.tabIndex = -1;
        
        if (config.range && component.structure.secondThumb) {
          component.structure.secondThumb.tabIndex = -1;
        }
      },
      
      isDisabled() {
        return component.element.classList.contains(`${component.getClass('slider')}--disabled`);
      }
    }
  };
};