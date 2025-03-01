// src/components/checkbox/constants.js

/**
 * Visual variants for checkbox
 */
export const CHECKBOX_VARIANTS = {
  FILLED: 'filled',
  OUTLINED: 'outlined'
}

/**
 * Label position options
 */
export const CHECKBOX_LABEL_POSITION = {
  START: 'start',
  END: 'end'
}

/**
 * Validation schema for checkbox configuration
 */
export const CHECKBOX_SCHEMA = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      optional: true
    },
    checked: {
      type: 'boolean',
      optional: true
    },
    indeterminate: {
      type: 'boolean',
      optional: true
    },
    required: {
      type: 'boolean',
      optional: true
    },
    disabled: {
      type: 'boolean',
      optional: true
    },
    value: {
      type: 'string',
      optional: true
    },
    label: {
      type: 'string',
      optional: true
    },
    labelPosition: {
      type: 'string',
      enum: Object.values(CHECKBOX_LABEL_POSITION),
      optional: true
    },
    variant: {
      type: 'string',
      enum: Object.values(CHECKBOX_VARIANTS),
      optional: true
    },
    class: {
      type: 'string',
      optional: true
    }
  }
}

/**
 * Checkbox state classes
 */
export const CHECKBOX_STATES = {
  CHECKED: 'checked',
  INDETERMINATE: 'indeterminate',
  DISABLED: 'disabled',
  FOCUSED: 'focused'
}

/**
 * Checkbox element classes
 */
export const CHECKBOX_CLASSES = {
  ROOT: 'checkbox',
  INPUT: 'checkbox-input',
  ICON: 'checkbox-icon',
  LABEL: 'checkbox-label'
}
