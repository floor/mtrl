// src/components/list/constants.js

/**
 * List types/variants
 */
export const LIST_TYPES = {
  DEFAULT: 'default', // Standard list
  SINGLE_SELECT: 'single', // Single selection list
  MULTI_SELECT: 'multi', // Multiple selection list
  RADIO: 'radio' // Radio button list
}

/**
 * List layout variants
 */
export const LIST_LAYOUTS = {
  HORIZONTAL: 'horizontal', // Default horizontal layout
  VERTICAL: 'vertical' // Items with more content stacked vertically
}

/**
 * List element class names
 */
export const LIST_CLASSES = {
  ROOT: 'list',
  GROUP: 'list-group',
  GROUP_TITLE: 'list-group-title',
  DIVIDER: 'list-divider',
  SECTION: 'list-section',
  SECTION_TITLE: 'list-section-title'
}

/**
 * List configuration schema
 */
export const LIST_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: Object.values(LIST_TYPES),
      default: LIST_TYPES.DEFAULT
    },
    layout: {
      type: 'string',
      enum: Object.values(LIST_LAYOUTS),
      default: LIST_LAYOUTS.HORIZONTAL
    },
    items: {
      type: 'array',
      items: {
        type: 'object'
      },
      default: []
    },
    groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true },
          title: { type: 'string' },
          items: { type: 'array' }
        }
      },
      optional: true
    },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', required: true },
          title: { type: 'string', required: true },
          items: { type: 'array', required: true }
        }
      },
      optional: true
    },
    disabled: {
      type: 'boolean',
      default: false
    },
    class: {
      type: 'string',
      optional: true
    }
  }
}
