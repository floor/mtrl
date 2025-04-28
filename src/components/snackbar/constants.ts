// src/components/snackbar/constants.ts

/**
 * Snackbar visual variants
 * @category Components
 */
export const SNACKBAR_VARIANTS = {
  /** Basic snackbar with just text */
  BASIC: 'basic',
  /** Snackbar with an action button */
  ACTION: 'action'
} as const;

/**
 * Snackbar display positions
 * @category Components
 */
export const SNACKBAR_POSITIONS = {
  /** Centered position (default) */
  CENTER: 'center',
  /** Start-aligned position */
  START: 'start',
  /** End-aligned position */
  END: 'end'
} as const;

/**
 * Snackbar visibility states
 * @category Components
 */
export const SNACKBAR_STATES = {
  /** Snackbar is visible */
  VISIBLE: 'visible',
  /** Snackbar is hidden */
  HIDDEN: 'hidden'
} as const;

/**
 * Snackbar event types
 * @category Components
 */
export const SNACKBAR_EVENTS = {
  /** Fired when snackbar opens */
  OPEN: 'open',
  /** Fired when snackbar closes */
  CLOSE: 'close',
  /** Fired when action button is clicked */
  ACTION: 'action',
  /** Fired when auto-dismiss timer completes */
  DISMISS: 'dismiss'
} as const;

/**
 * Default configuration values for snackbar
 * @category Components
 */
export const SNACKBAR_DEFAULTS = {
  /** Default visual variant */
  VARIANT: SNACKBAR_VARIANTS.BASIC,
  /** Default display position */
  POSITION: SNACKBAR_POSITIONS.CENTER,
  /** Default display duration in milliseconds (4 seconds) */
  DURATION: 4000,
  /** Default z-index for snackbars */
  Z_INDEX: 1000,
  /** Default animation duration in milliseconds */
  ANIMATION_DURATION: 300
} as const;

/**
 * CSS class names used by the snackbar component
 * @category Components
 */
export const SNACKBAR_CLASSES = {
  /** Root element class */
  ROOT: 'snackbar',
  /** Basic variant class */
  BASIC: 'snackbar--basic',
  /** Action variant class */
  ACTION: 'snackbar--action',
  /** Center position class */
  CENTER: 'snackbar--center',
  /** Start position class */
  START: 'snackbar--start',
  /** End position class */
  END: 'snackbar--end',
  /** Visible state class */
  VISIBLE: 'snackbar--visible',
  /** Hidden state class */
  HIDDEN: 'snackbar--hidden',
  /** Message text class */
  MESSAGE: 'snackbar__message',
  /** Action button class */
  ACTION_BUTTON: 'snackbar__action'
} as const;