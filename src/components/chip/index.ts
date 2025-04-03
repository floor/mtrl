// src/components/chip/index.ts
/**
 * Chip Component Module
 * 
 * Exports Chip and ChipSet components following Material Design 3 guidelines.
 * Chips allow users to input information, make selections, filter content, 
 * or trigger actions.
 * 
 * @module components/chip
 * @category Components
 */

// Export chip with both new and legacy naming
export { default, default as fChip, default as createChip } from './chip'

// Export chip-set with legacy naming (to be refactored later)
export { default as createChipSet } from './chip-set'

// Export types
export type { 
  ChipConfig, 
  ChipComponent,
  ChipVariant
} from './types'
export type { 
  ChipSetConfig, 
  ChipSetComponent 
} from './chip-set'

/**
 * Constants for chip configuration
 * Use these to ensure type safety and auto-completion when configuring chips
 * 
 * @example
 * import { fChip, CHIP_VARIANTS } from 'mtrl';
 * 
 * const filterChip = fChip({
 *   text: 'Category',
 *   variant: CHIP_VARIANTS.FILTER
 * });
 * 
 * @category Components
 */
export { CHIP_VARIANTS } from './constants'