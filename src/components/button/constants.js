// src/components/button/constants.js

import { RIPPLE_SCHEMA } from '../../core/build/constants'

export const BUTTON_VARIANTS = {
  FILLED: 'filled',
  TONAL: 'tonal',
  OUTLINED: 'outlined',
  ELEVATED: 'elevated',
  TEXT: 'text'
}

export const BUTTON_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
}

/**
 * Validation schema for button configuration
 */
export const BUTTON_SCHEMA = {
  variant: {
    type: 'string',
    enum: Object.values(BUTTON_VARIANTS),
    required: false
  },
  size: {
    type: 'string',
    enum: Object.values(BUTTON_SIZES),
    required: false
  },
  disabled: {
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
  }
}
