// src/core/composition/features/structure.ts

/**
 * Configuration that includes a component schema
 */
export interface StructureConfig {
  /**
   * Component schema definition
   */
  schema?: any;
  
  [key: string]: any;
}

/**
 * Adds schema definition to component without creating DOM
 * This establishes the blueprint for the component's structure
 * before materializing it with withDom
 * 
 * @param config Configuration containing schema definition
 * @returns Component enhancer with schema definition
 * 
 * @example
 * ```ts
 * // Add structure to a component
 * const component = pipe(
 *   createBase,
 *   withStructure(config),
 *   withIcon(config),
 *   withLabel(config),
 *   withDom()
 * )(config);
 * ```
 */
export const withStructure = (config: StructureConfig) => component => {
  // Use the schema definition from the config
  if (!config.schema) {
    console.warn('No schema definition found in component config');
    return component;
  }
  
  // Return enhanced component with schema definition
  return {
    ...component,
    schema: config.schema
  };
};