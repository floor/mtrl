// src/components/snackbar/constants.ts

/**
 * Where the snackbar sits along the bottom edge
 * @category Components
 */
export const SNACKBAR_POSITIONS = {
  /** Centred (default) */
  CENTER: 'center',
  /** Against the leading edge */
  START: 'start',
  /** Against the trailing edge */
  END: 'end'
} as const;

/**
 * Duration presets (Compose Material 3 `SnackbarDuration`)
 * @category Components
 */
export const SNACKBAR_DURATIONS = {
  /** 4 seconds, the default without an action */
  SHORT: 'short',
  /** 10 seconds */
  LONG: 'long',
  /** Stays until acted on or dismissed, the default with an action */
  INDEFINITE: 'indefinite'
} as const;

/**
 * Milliseconds behind the presets; 0 means no auto-dismiss
 * @category Components
 */
export const SNACKBAR_DURATION_MS = {
  short: 4000,
  long: 10000,
  indefinite: 0
} as const;

/**
 * Snackbar visibility states
 * @category Components
 */
export const SNACKBAR_STATES = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden'
} as const;

/**
 * Snackbar queue behaviors
 *
 * Controls how a newly shown snackbar interacts with the one currently on
 * screen and any still waiting in the queue.
 * @category Components
 */
export const SNACKBAR_QUEUE_BEHAVIORS = {
  /** Wait in line: shown one at a time, in order (default) */
  QUEUE: 'queue',
  /** Replace: dismiss the current snackbar, drop any pending ones, and show
   *  this snackbar right away (last wins) */
  REPLACE: 'replace'
} as const;

/**
 * Snackbar event types
 * @category Components
 */
export const SNACKBAR_EVENTS = {
  /** The snackbar is on screen */
  OPEN: 'open',
  /** The snackbar is leaving; the event carries the reason */
  CLOSE: 'close',
  /** The action button was clicked */
  ACTION: 'action',
  /** Fired with `close`; the queue listens to it */
  DISMISS: 'dismiss'
} as const;

/**
 * Why a snackbar closed
 * @category Components
 */
export const SNACKBAR_CLOSE_REASONS = {
  /** The duration ran out */
  TIMEOUT: 'timeout',
  /** The action was clicked */
  ACTION: 'action',
  /** The close icon was clicked */
  CLOSE_BUTTON: 'close-button',
  /** Escape was pressed while focus was inside */
  ESCAPE: 'escape',
  /** `hide()` was called */
  API: 'api',
  /** The queue replaced or cleared it */
  QUEUE: 'queue'
} as const;

/**
 * Default configuration values for snackbar
 * @category Components
 */
export const SNACKBAR_DEFAULTS = {
  /** Default display position */
  POSITION: SNACKBAR_POSITIONS.CENTER,
  /** Default queue behavior */
  QUEUE_BEHAVIOR: SNACKBAR_QUEUE_BEHAVIORS.QUEUE,
  /** Delay in milliseconds between a dismissed snackbar and the next one */
  QUEUE_GAP: 200,
  /** Accessible name of the close icon */
  CLOSE_LABEL: 'Dismiss',
  /** The longest of the exit transitions, after which the element is
   *  removed whether or not `transitionend` came */
  ANIMATION_DURATION: 425,
  /** An action wider than this moves below the text
   *  (`design_snackbar_action_inline_max_width`) */
  ACTION_INLINE_MAX_WIDTH: 128
} as const;

/**
 * CSS class names used by the snackbar component, without the prefix
 * @category Components
 */
export const SNACKBAR_CLASSES = {
  ROOT: 'snackbar',
  CENTER: 'snackbar--center',
  START: 'snackbar--start',
  END: 'snackbar--end',
  VISIBLE: 'snackbar--visible',
  /** An action is present */
  WITH_ACTION: 'snackbar--with-action',
  /** A close icon is present */
  DISMISSIBLE: 'snackbar--dismissible',
  /** The action is too wide to sit beside the text */
  ACTION_BELOW: 'snackbar--action-below',
  TEXT: 'snackbar-text',
  ACTION: 'snackbar-action',
  CLOSE: 'snackbar-close'
} as const;

/**
 * The close icon (Material Symbols "close")
 * @category Components
 */
export const SNACKBAR_CLOSE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="24" height="24" fill="currentColor" aria-hidden="true">' +
  '<path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>';
