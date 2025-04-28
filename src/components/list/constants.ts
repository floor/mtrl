// src/components/list/constants.ts

/**
 * Default list item configuration
 */
export const LIST_DEFAULTS = {
  /** Default collection name for API-connected lists */
  COLLECTION: 'items',
  /** Default API base URL */
  BASE_URL: 'http://localhost:4000/api',
  /** Default number of items per page */
  PAGE_SIZE: 20,
  /** Default number of extra items to render above/below viewport */
  RENDER_BUFFER_SIZE: 5,
  /** Default item height in pixels */
  ITEM_HEIGHT: 48
} as const;

/**
 * List types for rendering and behavior
 */
export const LIST_TYPES = {
  /** Standard list with no selection */
  DEFAULT: 'default',
  /** List with single-select behavior */
  SINGLE_SELECT: 'single-select',
  /** List with multi-select behavior */
  MULTI_SELECT: 'multi-select'
} as const;

/**
 * List selection modes
 */
export const LIST_SELECTION_MODES = {
  /** No selection allowed */
  NONE: 'none',
  /** Only one item can be selected at a time */
  SINGLE: 'single',
  /** Multiple items can be selected */
  MULTIPLE: 'multiple'
} as const;

/**
 * List events
 */
export const LIST_EVENTS = {
  /** Fired when an item is selected */
  SELECT: 'select',
  /** Fired when items are loaded */
  LOAD: 'load',
  /** Fired when the list is scrolled */
  SCROLL: 'scroll'
} as const;

/**
 * Scroll position options for scrollToItem method
 */
export const LIST_SCROLL_POSITIONS = {
  /** Align item at the top of viewport */
  START: 'start',
  /** Center item in the viewport */
  CENTER: 'center',
  /** Align item at the bottom of viewport */
  END: 'end'
} as const;

/**
 * CSS classes used in the list component
 */
export const LIST_CLASSES = {
  /** Container element */
  CONTAINER: 'list-container',
  /** List element */
  LIST: 'list',
  /** List item */
  ITEM: 'list-item',
  /** Selected list item */
  SELECTED: 'list-item--selected',
  /** Loading indicator */
  LOADING: 'list--loading',
  /** Empty state */
  EMPTY: 'list--empty'
} as const;