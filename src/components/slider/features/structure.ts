// src/components/slider/features/structure.ts
import { SLIDER_COLORS, SLIDER_SIZES } from '../constants';
import { SliderConfig } from '../types';
import { createStructure, flattenStructure } from '../../../core/structure';
import { ElementComponent } from '../../../core/compose/component';
import { createSliderStructure } from '../structure';

/**
 * Creates the slider DOM structure using structure system
 * @param config Slider configuration
 * @returns Component enhancer with DOM components
 */
export const withStructure = (config: SliderConfig) => 
  <C extends ElementComponent>(component: C): C & { components: Record<string, HTMLElement> } => {
  
  // Create structure definition
  const structureDefinition = createSliderStructure(component, config);
  
  try {
    // Create structure and get nodes
    const structure = createStructure(structureDefinition, component.element);
    
    // Flatten structure for easier access to components
    const components = flattenStructure(structure);
    
    // Add component base class and accessibility attributes
    component.element.classList.add(component.getClass('slider'));
    component.element.setAttribute('tabindex', '-1');
    component.element.setAttribute('role', 'none');
    component.element.setAttribute('aria-disabled', config.disabled ? 'true' : 'false');
    
    // Apply style classes
    applyStyleClasses(component, config);
    
    // Return enhanced component with components
    return {
      ...component,
      components
    };
  } catch (error) {
    console.error('Failed to create slider structure:', error);
    throw new Error(`Failed to create slider: ${error.message}`);
  }
};

/**
 * Applies style classes based on configuration
 */
function applyStyleClasses(component, config) {
  const baseClass = component.getClass('slider');
  const isRangeSlider = config.range && config.secondValue !== undefined;
  
  // Apply size class
  if (config.size && config.size !== SLIDER_SIZES.MEDIUM) {
    component.element.classList.add(`${baseClass}--${config.size}`);
  }
  
  // Apply color class
  if (config.color && config.color !== SLIDER_COLORS.PRIMARY) {
    component.element.classList.add(`${baseClass}--${config.color}`);
  }
  
  // Apply discrete class if step is specified
  if (config.step !== undefined && config.step > 0) {
    component.element.classList.add(`${baseClass}--discrete`);
  }
  
  // Apply disabled class if needed
  if (config.disabled) {
    component.element.classList.add(`${baseClass}--disabled`);
  }
  
  // Apply range class if needed
  if (isRangeSlider) {
    component.element.classList.add(`${baseClass}--range`);
  }
}