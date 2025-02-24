// src/components/menu/constants.js

/**
 * Menu alignment options
 */
export const MENU_ALIGN = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center'
}

/**
 * Menu vertical alignment options
 */
export const MENU_VERTICAL_ALIGN = {
  TOP: 'top',
  BOTTOM: 'bottom',
  MIDDLE: 'middle'
}

/**
 * Menu item types
 */
export const MENU_ITEM_TYPES = {
  ITEM: 'item',
  DIVIDER: 'divider'
}

/**
 * Validation schema for menu configuration
 */
export const MENU_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', optional: true },
          text: { type: 'string', optional: true },
          type: {
            type: 'string',
            enum: Object.values(MENU_ITEM_TYPES),
            optional: true
          },
          disabled: { type: 'boolean', optional: true },
          items: { type: 'array', optional: true }
        }
      },
      optional: true
    },
    class: { type: 'string', optional: true },
    target: { type: 'object', optional: true }
  }
}
