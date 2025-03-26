// src/core/structure/index.ts
/**
 * @module core/structure
 * @description Main entry point for structure creation system
 */

// Export types
export { ComponentLike, ElementDefinition, Schema, StructureResult } from './types';

// Export utility functions
export { isComponentLike, processClassNames, flattenStructure } from './utils';

// Export result creation
export { createStructureResult } from './result';

// Export main creation function
export { createStructure } from './create';

// Default export for backward compatibility
import { createStructure } from './create';
export default createStructure