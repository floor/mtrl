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

// Main factory function
export { default } from './checkbox';

// TypeScript types and interfaces
export type { 
  CheckboxConfig, 
  CheckboxComponent, 
  CheckboxEvents,
  CheckboxChangePayload,
  CheckboxLabelPosition
} from './types';

/**
 * Constants for checkbox configuration
 * 
 * Use these constants instead of string literals for better
 * code completion, type safety, and to follow best practices.
 * 
 * @example
 * import { createCheckbox } from 'mtrl';
 * 
 * const checkbox = createCheckbox({
 *   label: 'Accept terms',
 *   error: !accepted
 * });
 * 
 * @category Components
 */
export { 
  CHECKBOX_LABEL_POSITION,
  CHECKBOX_STATES,
  CHECKBOX_CLASSES
} from './constants';
