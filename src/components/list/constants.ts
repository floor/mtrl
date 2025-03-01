// src/components/list/constants.ts

/**
 * List types/variants
 */
export const LIST_TYPES = {
  DEFAULT: 'default', // Standard list
  SINGLE_SELECT: 'single', // Single selection list
  MULTI_SELECT: 'multi', // Multiple selection list
  RADIO: 'radio' // Radio button list
} as const;

/**
 * List layout variants
 */
export const LIST_LAYOUTS = {
  HORIZONTAL: 'horizontal', // Default horizontal layout
  VERTICAL: 'vertical' // Items with more content stacked vertically
} as const;

/**
 * List item layouts
 */
export const LIST_ITEM_LAYOUTS = {
  HORIZONTAL: 'horizontal', // Default horizontal layout
  VERTICAL: 'vertical' // Stacked layout with vertical alignment
} as const;

/**
 * List element class names
 */
export const LIST_CLASSES = {
  ROOT: 'list',
  GROUP: 'list-group',
  GROUP_TITLE: 'list-group-title',
  DIVIDER: 'list-divider',
  SECTION: 'list-section',
  SECTION_TITLE: 'list-section-title',
  ITEM: 'list-item',
  ITEM_CONTENT: 'list-item-content',
  ITEM_LEADING: 'list-item-leading',
  ITEM_TEXT: 'list-item-text',
  ITEM_OVERLINE: 'list-item-overline',
  ITEM_HEADLINE: 'list-item-headline',
  ITEM_SUPPORTING: 'list-item-supporting',
  ITEM_META: 'list-item-meta',
  ITEM_TRAILING: 'list-item-trailing'
} as const;

/**
 * List validation schema
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
} as const;

/**
 * List item states
 */
export const LIST_ITEM_STATES = {
  SELECTED: 'selected',
  DISABLED: 'disabled',
  FOCUSED: 'focused',
  HOVERED: 'hovered'
} as const;