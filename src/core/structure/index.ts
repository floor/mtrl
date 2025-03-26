// src/core/structure/index.ts
/**
 * @module core/structure
 * @description Optimized structure creation system with simplified API
 */

// Export essential types
export type { ComponentLike, ElementDefinition, Schema, StructureResult } from './types';

// Export utility functions
export { isComponent, processClassNames, flattenStructure } from './utils';

// Export core functionality
export { createStructure } from './create';
export { createStructureResult } from './result';
export { processSchema, createComponentInstance } from './processor';

// Default export for backward compatibility and simpler usage
import { createStructure } from './create';
export default createStructure;