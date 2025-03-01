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
 * Validation schema for snackbar configuration
 */
export const SNACKBAR_SCHEMA = {
  variant: {
    type: 'string',
    enum: Object.values(SNACKBAR_VARIANTS),
    required: false
  },
  position: {
    type: 'string',
    enum: Object.values(SNACKBAR_POSITIONS),
    required: false
  },
  message: {
    type: 'string',
    required: true
  },
  action: {
    type: 'string',
    required: false
  },
  duration: {
    type: 'number',
    required: false
  },
  class: {
    type: 'string',
    required: false
  }
} as const;

/**
 * Snackbar state classes
 */
export const SNACKBAR_STATES = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden'
} as const;