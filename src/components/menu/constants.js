// src/components/menu/constants.js

/**
 * Menu alignment options
 * @enum {string}
 */
export const MENU_ALIGN = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center'
}

/**
 * Menu vertical alignment options
 * @enum {string}
 */
export const MENU_VERTICAL_ALIGN = {
  TOP: 'top',
  BOTTOM: 'bottom',
  MIDDLE: 'middle'
}

/**
 * Menu item types
 * @enum {string}
 */
export const MENU_ITEM_TYPES = {
  ITEM: 'item',
  DIVIDER: 'divider'
}

/**
 * Menu events
 * @enum {string}
 */
export const MENU_EVENTS = {
  SELECT: 'select',
  OPEN: 'open',
  CLOSE: 'close',
  SUBMENU_OPEN: 'submenuOpen',
  SUBMENU_CLOSE: 'submenuClose'
}
