// src/components/textfield/constants.ts

/**
 * Textfield visual variants
 */
export const TEXTFIELD_VARIANTS = {
  FILLED: 'filled',
  OUTLINED: 'outlined'
} as const;

/**
 * Textfield input types
 */
export const TEXTFIELD_TYPES = {
  TEXT: 'text',
  PASSWORD: 'password',
  EMAIL: 'email',
  NUMBER: 'number',
  TEL: 'tel',
  URL: 'url',
  SEARCH: 'search',
  MULTILINE: 'multiline'
} as const;

/**
 * Validation schema for textfield configuration
 */
export const TEXTFIELD_SCHEMA = {
  type: {
    type: 'string',
    enum: Object.values(TEXTFIELD_TYPES),
    required: false
  },
  variant: {
    type: 'string',
    enum: Object.values(TEXTFIELD_VARIANTS),
    required: false
  },
  name: {
    type: 'string',
    required: false
  },
  label: {
    type: 'string',
    required: false
  },
  placeholder: {
    type: 'string',
    required: false
  },
  value: {
    type: 'string',
    required: false
  },
  required: {
    type: 'boolean',
    required: false
  },
  disabled: {
    type: 'boolean',
    required: false
  },
  maxLength: {
    type: 'number',
    required: false
  },
  pattern: {
    type: 'string',
    required: false
  },
  autocomplete: {
    type: 'string',
    required: false
  },
  class: {
    type: 'string',
    required: false
  }
} as const;

/**
 * Textfield state classes
 */
export const TEXTFIELD_STATES = {
  FOCUSED: 'focused',
  FILLED: 'filled',
  DISABLED: 'disabled',
  INVALID: 'invalid'
} as const;

/**
 * Textfield element classes
 */
export const TEXTFIELD_CLASSES = {
  ROOT: 'textfield',
  INPUT: 'textfield-input',
  LABEL: 'textfield-label',
  HELPER: 'textfield-helper',
  COUNTER: 'textfield-counter'
} as const;