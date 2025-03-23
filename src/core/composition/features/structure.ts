// src/core/composition/features/structure.ts

/**
 * Adds structure definition to component without creating DOM
 * Now uses the structure from the baseConfig
 * 
 * @param configuration
 * @returns Component enhancer with structure definition
 */
export const withStructure = (config: SliderConfig) => component => {
  // Use the structure definition from the config
  if (!config.structureDefinition) {
    console.warn('No structure definition found in slider config');
    return component;
  }
  
  // Return enhanced component with structure definition
  return {
    ...component,
    structureDefinition: config.structureDefinition
  };
};