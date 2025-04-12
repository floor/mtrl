// src/components/select/index.ts

/**
 * Select Component Module
 * 
 * The Select component provides a dropdown select control,
 * combining a textfield and menu for a complete selection interface.
 * 
 * @module components/select
 * @category Components
 */

// Export main component factory
export { default } from './select';

// Export types and interfaces
export type { 
  SelectConfig, 
  SelectComponent,
  SelectOption,
  SelectEvent,
  SelectChangeEvent
} from './types';

/**
 * Constants for select configuration
 * 
 * @example
 * import { createSelect, SELECT_VARIANTS } from 'mtrl';
 * 
 * const select = createSelect({
 *   variant: SELECT_VARIANTS.OUTLINED,
 *   options: [...]
 * });
 * 
 * @category Components
 */
export { SELECT_VARIANTS } from './types';