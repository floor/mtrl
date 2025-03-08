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
        
        // Focus only on thumbs (accessibility improvement)
        if (component.structure.thumb) {
          component.structure.thumb.tabIndex = 0;
          component.structure.thumb.setAttribute('aria-disabled', 'false');
        }
        
        if (config.range && component.structure.secondThumb) {
          component.structure.secondThumb.tabIndex = 0;
          component.structure.secondThumb.setAttribute('aria-disabled', 'false');
        }
      },
      
      disable() {
        component.element.classList.add(`${component.getClass('slider')}--disabled`);
        component.element.setAttribute('aria-disabled', 'true');
        
        // Disable thumb focusing
        if (component.structure.thumb) {
          component.structure.thumb.tabIndex = -1;
          component.structure.thumb.setAttribute('aria-disabled', 'true');
        }
        
        if (config.range && component.structure.secondThumb) {
          component.structure.secondThumb.tabIndex = -1;
          component.structure.secondThumb.setAttribute('aria-disabled', 'true');
        }
      },
      
      isDisabled() {
        return component.element.classList.contains(`${component.getClass('slider')}--disabled`);
      }
    }
  };
};