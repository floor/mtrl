// src/components/extended-fab/constants.ts
import { FAB_VARIANTS, FAB_POSITIONS } from '../fab/constants'

/**
 * Re-export FAB variants for styling
 */
export { FAB_VARIANTS }

/**
 * Re-export FAB positions for fixed positioning
 */
export { FAB_POSITIONS }

/**
 * Extended FAB width behavior options
 */
export const EXTENDED_FAB_WIDTH = {
  /** Fixed width based on content */
  FIXED: 'fixed',
  /** Fluid width that can adapt to container */
  FLUID: 'fluid'
}

/**
 * Extended FAB dimensions
 */
export const EXTENDED_FAB_DIMENSIONS = {
  /** Standard height - 56dp */
  HEIGHT: 56,
  /** Minimum width - 80dp */
  MIN_WIDTH: 80,
  /** Padding - 16dp */
  PADDING: 16,
  /** Icon size - 24dp */
  ICON_SIZE: 24
}
