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
  
  // Apply initial disabled state if needed
  if (isDisabled && component.structure) {
    setTimeout(() => {
      disableComponent();
    }, 0);
  }
  
  function disableComponent() {
    component.element.classList.add(`${component.getClass('slider')}--disabled`);
    component.element.setAttribute('aria-disabled', 'true');
    
    // Ensure thumbs cannot receive focus when disabled
    if (component.structure.thumb) {
      component.structure.thumb.tabIndex = -1;
      component.structure.thumb.setAttribute('aria-disabled', 'true');
    }
    
    if (config.range && component.structure.secondThumb) {
      component.structure.secondThumb.tabIndex = -1;
      component.structure.secondThumb.setAttribute('aria-disabled', 'true');
    }
  }
  
  function enableComponent() {
    component.element.classList.remove(`${component.getClass('slider')}--disabled`);
    component.element.setAttribute('aria-disabled', 'false');
    
    // Re-enable focus on thumbs
    if (component.structure.thumb) {
      component.structure.thumb.tabIndex = 0;
      component.structure.thumb.setAttribute('aria-disabled', 'false');
    }
    
    if (config.range && component.structure.secondThumb) {
      component.structure.secondThumb.tabIndex = 0;
      component.structure.secondThumb.setAttribute('aria-disabled', 'false');
    }
  }
  
  return {
    ...component,
    disabled: {
      enable() {
        enableComponent();
      },
      
      disable() {
        disableComponent();
      },
      
      isDisabled() {
        return component.element.classList.contains(`${component.getClass('slider')}--disabled`);
      }
    }
  };
};