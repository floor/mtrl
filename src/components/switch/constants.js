// src/components/switch/constants.js

/**
 * Label position options
 */
export const SWITCH_LABEL_POSITION = {
  START: 'start',
  END: 'end'
}

/**
 * Validation schema for switch configuration
 */
export const SWITCH_SCHEMA = {
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
      enum: Object.values(SWITCH_LABEL_POSITION),
      optional: true
    },
    icon: {
      type: 'string',
      optional: true
    },
    ariaLabel: {
      type: 'string',
      optional: true
    },
    class: {
      type: 'string',
      optional: true
    }
  }
}

/**
 * Switch state classes
 */
export const SWITCH_STATES = {
  CHECKED: 'checked',
  DISABLED: 'disabled',
  FOCUSED: 'focused'
}

/**
 * Switch element classes
 */
export const SWITCH_CLASSES = {
  ROOT: 'switch',
  INPUT: 'switch-input',
  TRACK: 'switch-track',
  THUMB: 'thumb',
  THUMB_ICON: 'thumb-icon',
  LABEL: 'switch-label'
}
