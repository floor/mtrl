// src/components/menu/utils.ts

/**
 * Menu alignment constants for internal use
 * @internal
 */
export const MENU_ALIGNMENT = {
  LEFT: 'left',
  RIGHT: 'right',
  CENTER: 'center'
};

/**
 * Menu vertical alignment constants for internal use
 * @internal
 */
export const MENU_VERTICAL_ALIGNMENT = {
  TOP: 'top',
  BOTTOM: 'bottom',
  MIDDLE: 'middle'
};

/**
 * Menu item types for internal use
 * @internal
 */
export const MENU_ITEM_TYPE = {
  ITEM: 'item',
  DIVIDER: 'divider'
};

/**
 * Menu events for internal use
 * @internal
 */
export const MENU_EVENT = {
  SELECT: 'select',
  OPEN: 'open',
  CLOSE: 'close',
  SUBMENU_OPEN: 'submenuOpen',
  SUBMENU_CLOSE: 'submenuClose'
};

/**
 * Menu CSS classes for internal use
 * @internal
 */
export const MENU_CLASSES = {
  ROOT: 'menu',
  ITEM: 'menu-item',
  ITEM_CONTAINER: 'menu-item-container',
  LIST: 'menu-list',
  DIVIDER: 'menu-divider',
  SUBMENU: 'menu--submenu',
  VISIBLE: 'menu--visible',
  DISABLED: 'menu--disabled'
};

/**
 * Gets a class name for menu elements
 * @param {string} element - Element name from MENU_CLASSES
 * @returns {string} The class name
 * @internal
 */
export const getMenuClass = (element: keyof typeof MENU_CLASSES): string => {
  return MENU_CLASSES[element];
};