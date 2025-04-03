// src/components/checkbox/index.ts

/**
 * Checkbox Component Module
 * 
 * A Material Design 3 checkbox implementation with support
 * for different variants, indeterminate state, and label positioning.
 * 
 * @module components/checkbox
 * @category Components
 */

// Main factory function with both new and legacy naming
export { default, default as fCheckbox, default as createCheckbox } from './checkbox';

// TypeScript types and interfaces
export type { 
  CheckboxConfig, 
  CheckboxComponent, 
  CheckboxVariant, 
  CheckboxLabelPosition
} from './types';

/**
 * Constants for checkbox configuration
 * 
 * Use these constants instead of string literals for better
 * code completion, type safety, and to follow best practices.
 * 
 * @example
 * import { fCheckbox, CHECKBOX_VARIANTS } from 'mtrl';
 * 
 * const checkbox = fCheckbox({
 *   variant: CHECKBOX_VARIANTS.OUTLINED,
 *   label: 'Accept terms'
 * });
 * 
 * @category Components
 */
export { 
  CHECKBOX_VARIANTS,
  CHECKBOX_LABEL_POSITION,
  CHECKBOX_STATES,
  CHECKBOX_CLASSES
} from './types';