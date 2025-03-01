// src/components/menu/constants.ts

/**
 * Menu alignment options
 */
export const MENU_ALIGN = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center'
} as const;

/**
 * Menu vertical alignment options
 */
export const MENU_VERTICAL_ALIGN = {
  TOP: 'top',
  BOTTOM: 'bottom',
  MIDDLE: 'middle'
} as const;

/**
 * Menu item types
 */
export const MENU_ITEM_TYPES = {
  ITEM: 'item',
  DIVIDER: 'divider'
} as const;

/**
 * Menu events
 */
export const MENU_EVENTS = {
  SELECT: 'select',
  OPEN: 'open',
  CLOSE: 'close',
  SUBMENU_OPEN: 'submenuOpen',
  SUBMENU_CLOSE: 'submenuClose'
} as const;

/**
 * Menu states
 */
export const MENU_STATES = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden',
  DISABLED: 'disabled'
} as const;

/**
 * Menu element classes
 */
export const MENU_CLASSES = {
  ROOT: 'menu',
  ITEM: 'menu-item',
  ITEM_CONTAINER: 'menu-item-container',
  LIST: 'menu-list',
  DIVIDER: 'menu-divider',
  SUBMENU: 'menu--submenu'
} as const;

/**
 * Menu positioning schema
 * Used for validation in component creation
 */
export const MENU_POSITION_SCHEMA = {
  type: 'object',
  properties: {
    align: {
      type: 'string',
      enum: Object.values(MENU_ALIGN),
      optional: true,
      default: MENU_ALIGN.LEFT
    },
    vAlign: {
      type: 'string',
      enum: Object.values(MENU_VERTICAL_ALIGN),
      optional: true,
      default: MENU_VERTICAL_ALIGN.BOTTOM
    },
    offsetX: {
      type: 'number',
      optional: true,
      default: 0
    },
    offsetY: {
      type: 'number',
      optional: true,
      default: 0
    }
  }
} as const;

/**
 * Validation schema for menu configuration
 */
export const MENU_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      optional: true,
      default: []
    },
    class: {
      type: 'string',
      optional: true
    },
    stayOpenOnSelect: {
      type: 'boolean',
      optional: true,
      default: false
    },
    openingButton: {
      optional: true
    }
  }
} as const;

/**
 * Menu item schema
 */
export const MENU_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      required: true
    },
    text: {
      type: 'string',
      required: true
    },
    type: {
      type: 'string',
      enum: Object.values(MENU_ITEM_TYPES),
      optional: true,
      default: MENU_ITEM_TYPES.ITEM
    },
    disabled: {
      type: 'boolean',
      optional: true,
      default: false
    },
    class: {
      type: 'string',
      optional: true
    },
    items: {
      type: 'array',
      optional: true,
      description: 'Submenu items'
    }
  }
} as const;