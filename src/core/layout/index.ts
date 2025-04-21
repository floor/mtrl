// src/core/layout/index.ts
/**
 * @module core/layout
 * @description Layout creation system with simplified API
 */

// Export essential types
export type { 
  ComponentLike, 
  ElementDefinition, 
  Schema, 
  LayoutResult,
  LayoutOptions,
  LayoutConfig,
  LayoutItemConfig
} from './types';

// Export utility functions
export { isComponent, processClassNames, flattenLayout } from './utils';

// Export core functionality
export { createLayout } from './create';
export { createLayoutResult } from './result';
export { processSchema, createComponentInstance, isJsxSchema } from './processor';

// Export configuration utilities
export { 
  applyLayoutClasses, 
  applyLayoutItemClasses, 
  getLayoutType,
  cleanupLayoutClasses
} from './config';

// Export JSX support
export { h, Fragment, createJsxLayout } from './jsx';

// Default export for backward compatibility and simpler usage
import { createLayout } from './create';
export default createLayout;