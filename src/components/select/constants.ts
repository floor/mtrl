// src/components/select/constants.ts

/**
 * Select variants
 */
export const SELECT_VARIANTS = {
  /** Filled select field with solid background */
  FILLED: 'filled',
  /** Outlined select field with border */
  OUTLINED: 'outlined'
} as const;

/**
 * Select menu placement options
 */
export const SELECT_PLACEMENT = {
  /** Menu appears below the select field, aligned to the left edge */
  BOTTOM_START: 'bottom-start',
  /** Menu appears below the select field, centered */
  BOTTOM: 'bottom',
  /** Menu appears below the select field, aligned to the right edge */
  BOTTOM_END: 'bottom-end',
  /** Menu appears above the select field, aligned to the left edge */
  TOP_START: 'top-start',
  /** Menu appears above the select field, centered */
  TOP: 'top',
  /** Menu appears above the select field, aligned to the right edge */
  TOP_END: 'top-end'
} as const;

/**
 * Select interaction types
 */
export const SELECT_INTERACTION = {
  /** Interaction via mouse or touch */
  MOUSE: 'mouse',
  /** Interaction via keyboard */
  KEYBOARD: 'keyboard'
} as const;

/**
 * Select event names
 */
export const SELECT_EVENTS = {
  /** Fired when selected option changes */
  CHANGE: 'change',
  /** Fired when options menu opens */
  OPEN: 'open',
  /** Fired when options menu closes */
  CLOSE: 'close'
} as const;

/**
 * Default icons for select
 */
export const SELECT_ICONS = {
  /** Dropdown arrow icon */
  DROPDOWN: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M7 10l5 5 5-5z"/></svg>',
  /** Checkmark icon for selected item */
  CHECKMARK: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
} as const;

/**
 * Default configuration values
 */
export const SELECT_DEFAULTS = {
  /** Default variant */
  VARIANT: SELECT_VARIANTS.FILLED,
  /** Default menu placement */
  PLACEMENT: SELECT_PLACEMENT.BOTTOM_START,
  /** Default label */
  LABEL: 'Select',
  /** Default value */
  VALUE: '',
  /** Whether the select is required by default */
  REQUIRED: false,
  /** Whether the select is disabled by default */
  DISABLED: false,
  /** Default supporting text */
  SUPPORTING_TEXT: '',
  /** Whether in error state by default */
  ERROR: false
} as const;

/**
 * CSS classes for select elements
 */
export const SELECT_CLASSES = {
  /** Container element */
  CONTAINER: 'select',
  /** Textfield element */
  TEXTFIELD: 'select__textfield',
  /** Dropdown icon */
  DROPDOWN_ICON: 'select__dropdown-icon',
  /** Menu container */
  MENU: 'select__menu',
  /** Menu item */
  MENU_ITEM: 'select__menu-item',
  /** Selected menu item */
  MENU_ITEM_SELECTED: 'select__menu-item--selected',
  /** Disabled menu item */
  MENU_ITEM_DISABLED: 'select__menu-item--disabled',
  /** Menu item checkmark */
  MENU_ITEM_CHECKMARK: 'select__menu-item-checkmark',
  /** Menu item icon */
  MENU_ITEM_ICON: 'select__menu-item-icon',
  /** Menu item text */
  MENU_ITEM_TEXT: 'select__menu-item-text',
  /** Filled variant */
  FILLED: 'select--filled',
  /** Outlined variant */
  OUTLINED: 'select--outlined',
  /** Open state */
  OPEN: 'select--open',
  /** Disabled state */
  DISABLED: 'select--disabled',
  /** Required state */
  REQUIRED: 'select--required',
  /** Error state */
  ERROR: 'select--error'
} as const;