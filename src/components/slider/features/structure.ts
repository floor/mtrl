// src/components/slider/features/structure.ts
import { createSliderDefinition } from '../structure';
import { SliderConfig } from '../types';

/**
 * Adds structure definition to component without creating DOM
 * 
 * @param config Slider configuration
 * @returns Component enhancer with structure definition
 */
export const withStructure = (config: SliderConfig) => component => {
  // Create the structure definition
  const structureDefinition = createSliderDefinition(component, config);
  
  // Return enhanced component with structure definition
  return {
    ...component,
    structureDefinition
  };
};