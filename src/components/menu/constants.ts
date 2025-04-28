// src/components/menu/constants.ts

/**
 * Menu position options for alignment relative to opener element
 */
export const MENU_POSITION = {
  /** Places menu below the opener, aligned to left edge */
  BOTTOM_START: 'bottom-start',
  /** Places menu below the opener, centered */
  BOTTOM: 'bottom',
  /** Places menu below the opener, aligned to right edge */
  BOTTOM_END: 'bottom-end',
  /** Places menu above the opener, aligned to left edge */
  TOP_START: 'top-start',
  /** Places menu above the opener, centered */
  TOP: 'top',
  /** Places menu above the opener, aligned to right edge */
  TOP_END: 'top-end',
  /** Places menu to the right of the opener, aligned to top edge */
  RIGHT_START: 'right-start',
  /** Places menu to the right of the opener, centered */
  RIGHT: 'right',
  /** Places menu to the right of the opener, aligned to bottom edge */
  RIGHT_END: 'right-end',
  /** Places menu to the left of the opener, aligned to top edge */
  LEFT_START: 'left-start',
  /** Places menu to the left of the opener, centered */
  LEFT: 'left',
  /** Places menu to the left of the opener, aligned to bottom edge */
  LEFT_END: 'left-end'
} as const;

/**
 * Default configuration values for menus
 */
export const MENU_DEFAULTS = {
  /** Default menu position */
  POSITION: MENU_POSITION.BOTTOM_START,
  /** Default offset from the opener (in pixels) */
  OFFSET: 0,
  /** Close menu when an item is selected */
  CLOSE_ON_SELECT: true,
  /** Close menu when clicking outside */
  CLOSE_ON_CLICK_OUTSIDE: true,
  /** Close menu when escape key is pressed */
  CLOSE_ON_ESCAPE: true,
  /** Open submenus on hover */
  OPEN_SUBMENU_ON_HOVER: true,
  /** Automatically flip menu position to stay in viewport */
  AUTO_FLIP: true
} as const;

/**
 * Interaction types for menu opening/closing
 */
export const MENU_INTERACTION_TYPES = {
  /** Interaction via mouse or touch */
  MOUSE: 'mouse',
  /** Interaction via keyboard */
  KEYBOARD: 'keyboard'
} as const;

/**
 * Menu item types
 */
export const MENU_ITEM_TYPES = {
  /** Standard interactive menu item */
  ITEM: 'item',
  /** Non-interactive dividing line */
  DIVIDER: 'divider'
} as const;

/**
 * Menu event names
 */
export const MENU_EVENTS = {
  /** Fired when the menu is opened */
  OPEN: 'open',
  /** Fired when the menu is closed */
  CLOSE: 'close',
  /** Fired when a menu item is selected */
  SELECT: 'select'
} as const;

/**
 * CSS classes for menu elements
 */
export const MENU_CLASSES = {
  /** Menu container */
  CONTAINER: 'menu',
  /** Visible menu */
  VISIBLE: 'menu--visible',
  /** Menu inner container */
  INNER: 'menu__inner',
  /** Individual menu item */
  ITEM: 'menu__item',
  /** Disabled menu item */
  ITEM_DISABLED: 'menu__item--disabled',
  /** Selected menu item */
  ITEM_SELECTED: 'menu__item--selected',
  /** Menu item with submenu */
  ITEM_HAS_SUBMENU: 'menu__item--has-submenu',
  /** Divider */
  DIVIDER: 'menu__divider',
  /** Item icon */
  ITEM_ICON: 'menu__item-icon',
  /** Item text */
  ITEM_TEXT: 'menu__item-text',
  /** Item keyboard shortcut */
  ITEM_SHORTCUT: 'menu__item-shortcut',
  /** Submenu indicator */
  SUBMENU_INDICATOR: 'menu__submenu-indicator'
} as const;