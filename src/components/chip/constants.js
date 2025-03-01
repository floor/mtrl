// src/components/chip/constants.js

import { RIPPLE_SCHEMA } from '../../core/build/constants'

/**
 * Available variants for the Chip component
 * @enum {string}
 */
export const CHIP_VARIANTS = {
  /** Standard filled chip with solid background */
  FILLED: 'filled',

  /** Outlined chip with transparent background and border */
  OUTLINED: 'outlined',

  /** Elevated chip with shadow */
  ELEVATED: 'elevated',

  /** Assist chip for suggesting actions */
  ASSIST: 'assist',

  /** Filter chip for filtering content */
  FILTER: 'filter',

  /** Input chip for representing user input */
  INPUT: 'input',

  /** Suggestion chip for presenting options */
  SUGGESTION: 'suggestion'
}

/**
 * Available sizes for the Chip component
 * @enum {string}
 */
export const CHIP_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
}

/**
 * Validation schema for chip configuration
 */
export const CHIP_SCHEMA = {
  variant: {
    type: 'string',
    enum: Object.values(CHIP_VARIANTS),
    required: false
  },
  size: {
    type: 'string',
    enum: Object.values(CHIP_SIZES),
    required: false
  },
  disabled: {
    type: 'boolean',
    required: false
  },
  selected: {
    type: 'boolean',
    required: false
  },
  text: {
    type: 'string',
    required: false
  },
  icon: {
    type: 'string',
    required: false
  },
  leadingIcon: {
    type: 'string',
    required: false
  },
  trailingIcon: {
    type: 'string',
    required: false
  },
  class: {
    type: 'string',
    required: false
  },
  value: {
    type: 'string',
    required: false
  },
  ripple: {
    type: 'boolean',
    required: false,
    default: true
  },
  rippleConfig: {
    type: 'object',
    required: false,
    properties: RIPPLE_SCHEMA
  },
  onTrailingIconClick: {
    type: 'function',
    required: false
  }
}
