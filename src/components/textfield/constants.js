// src/components/textfield/constants.js

export const TEXTFIELD_VARIANTS = {
  FILLED: 'filled',
  OUTLINED: 'outlined'
}

export const TEXTFIELD_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
}

export const TEXTFIELD_TYPES = {
  TEXT: 'text',
  PASSWORD: 'password',
  EMAIL: 'email',
  NUMBER: 'number',
  TEL: 'tel',
  URL: 'url',
  SEARCH: 'search',
  MULTILINE: 'multiline'
}

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
  size: {
    type: 'string',
    enum: Object.values(TEXTFIELD_SIZES),
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
}
