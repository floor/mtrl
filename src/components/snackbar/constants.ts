// src/components/snackbar/constants.ts

/**
 * Snackbar visual variants
 */
export const SNACKBAR_VARIANTS = {
  BASIC: 'basic',
  ACTION: 'action' // With action button
} as const;

/**
 * Snackbar display positions
 */
export const SNACKBAR_POSITIONS = {
  CENTER: 'center',
  START: 'start',
  END: 'end'
} as const;

/**
 * Snackbar state classes
 */
export const SNACKBAR_STATES = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden'
} as const;