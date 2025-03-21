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
  <C extends Pick<ElementComponent, 'getClass'>>(baseComponent: C): C & { 
    element: HTMLElement;
    components: Record<string, HTMLElement>; 
  } => {
  
  try {
    // Create structure definition (including root element)
    const structureDefinition = createSliderStructure(baseComponent, config);
    
    // Create structure with no parent (it creates its own root)
    const structure = createStructure(structureDefinition);
    
    // Flatten structure for easier access to components
    const components = flattenStructure(structure);
    
    // Create component with the root element from our structure
    const component = {
      ...baseComponent,
      element: components.element,
      components
    };
    
    // Apply style classes
    applyStyleClasses(component, config);
    
    return component;
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