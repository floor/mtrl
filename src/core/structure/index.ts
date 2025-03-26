// src/core/structure/index.ts
/**
 * @module core/structure
 * @description Main entry point for structure creation system
 */

// Export types
export { ComponentLike, ElementDefinition, Schema, StructureResult } from './types';
export { ArrayElement } from './array';

// Export utility functions
export { isComponent, processClassNames, flattenStructure } from './utils';

// Export schema processors
export { processArraySchema } from './array';
export { processObjectSchema } from './object';

// Export result creation
export { createStructureResult } from './result';

// Export main creation function
export { createStructure } from './create';

// Default export for backward compatibility
import { createStructure } from './create';
export default createStructure;