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
    
    // Ensure handles cannot receive focus when disabled
    if (component.structure.handle) {
      component.structure.handle.tabIndex = -1;
      component.structure.handle.setAttribute('aria-disabled', 'true');
    }
    
    if (config.range && component.structure.secondHandle) {
      component.structure.secondHandle.tabIndex = -1;
      component.structure.secondHandle.setAttribute('aria-disabled', 'true');
    }
  }
  
  function enableComponent() {
    component.element.classList.remove(`${component.getClass('slider')}--disabled`);
    component.element.setAttribute('aria-disabled', 'false');
    
    // Re-enable focus on handles
    if (component.structure.handle) {
      component.structure.handle.tabIndex = 0;
      component.structure.handle.setAttribute('aria-disabled', 'false');
    }
    
    if (config.range && component.structure.secondHandle) {
      component.structure.secondHandle.tabIndex = 0;
      component.structure.secondHandle.setAttribute('aria-disabled', 'false');
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