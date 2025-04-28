// src/components/timepicker/constants.ts

/**
 * Time picker display types
 * @category Components
 */
export const TIMEPICKER_TYPES = {
  /** Clock dial-based time picker */
  DIAL: 'dial',
  /** Text input-based time picker */
  INPUT: 'input'
} as const;

/**
 * Time picker orientations
 * @category Components
 */
export const TIMEPICKER_ORIENTATIONS = {
  /** Vertical layout (default on mobile) */
  VERTICAL: 'vertical',
  /** Horizontal layout */
  HORIZONTAL: 'horizontal'
} as const;

/**
 * Time formats
 * @category Components
 */
export const TIMEPICKER_FORMATS = {
  /** 12-hour format with AM/PM */
  AMPM: '12h',
  /** 24-hour format */
  MILITARY: '24h'
} as const;

/**
 * Time periods for 12-hour format
 * @category Components
 */
export const TIMEPICKER_PERIODS = {
  /** Morning */
  AM: 'AM',
  /** Afternoon/Evening */
  PM: 'PM'
} as const;

/**
 * Time picker event types
 * @category Components
 */
export const TIMEPICKER_EVENTS = {
  /** Fired when time value changes */
  CHANGE: 'change',
  /** Fired when time picker opens */
  OPEN: 'open',
  /** Fired when time picker closes */
  CLOSE: 'close',
  /** Fired when time is confirmed */
  CONFIRM: 'confirm',
  /** Fired when time picker is canceled */
  CANCEL: 'cancel'
} as const;

/**
 * Visual constants for the clock dial
 * @category Components
 */
export const TIMEPICKER_DIAL = {
  /** Diameter of the clock dial in pixels */
  DIAMETER: 256,
  /** Inner radius for hour numbers (for 24h format) */
  INNER_RADIUS: 65,
  /** Outer radius for hour/minute numbers */
  OUTER_RADIUS: 110,
  /** Size of the number elements */
  NUMBER_SIZE: 40,
  /** Size of the center dot */
  CENTER_SIZE: 8,
  /** Size of the clock hand */
  HAND_SIZE: 36,
  /** Width of the track elements */
  TRACK_WIDTH: 2
} as const;

/**
 * Time constants used for generating clock numbers and validation
 * @category Components
 */
export const TIMEPICKER_VALUES = {
  /** Hours for 12-hour format (1-12) */
  HOURS_12: Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)),
  /** Hours for 24-hour format (0-23) */
  HOURS_24: Array.from({ length: 24 }, (_, i) => i),
  /** Minutes (0-59) */
  MINUTES: Array.from({ length: 60 }, (_, i) => i),
  /** Seconds (0-59) */
  SECONDS: Array.from({ length: 60 }, (_, i) => i)
} as const;

/**
 * Z-index values for different parts of the time picker
 * @category Components
 */
export const TIMEPICKER_Z_INDEX = {
  /** Z-index for the modal backdrop */
  MODAL: 1050,
  /** Z-index for the dialog element */
  DIALOG: 1051
} as const;

/**
 * Element class selectors for time picker components
 * @category Components
 */
export const TIMEPICKER_SELECTORS = {
  /** Main container selector */
  CONTAINER: '.mtrl-time-picker',
  /** Modal backdrop selector */
  MODAL: '.mtrl-time-picker-modal',
  /** Dialog container selector */
  DIALOG: '.mtrl-time-picker-dialog',
  /** Title element selector */
  TITLE: '.mtrl-time-picker-title',
  /** Content container selector */
  CONTENT: '.mtrl-time-picker-content',
  /** Clock dial container selector */
  DIAL: '.mtrl-time-picker-dial',
  /** Clock dial canvas selector */
  DIAL_CANVAS: '.mtrl-time-picker-dial-canvas',
  /** Clock dial face selector */
  DIAL_FACE: '.mtrl-time-picker-dial-face',
  /** Clock hand selector */
  DIAL_HAND: '.mtrl-time-picker-dial-hand',
  /** Clock center dot selector */
  DIAL_CENTER: '.mtrl-time-picker-dial-center',
  /** Clock numbers container selector */
  DIAL_NUMBERS: '.mtrl-time-picker-dial-numbers',
  /** Individual number element selector */
  DIAL_NUMBER: '.mtrl-time-picker-dial-number',
  /** Input container selector */
  INPUT_CONTAINER: '.mtrl-time-picker-input-container',
  /** Hours input selector */
  HOURS_INPUT: '.mtrl-time-picker-hours',
  /** Minutes input selector */
  MINUTES_INPUT: '.mtrl-time-picker-minutes',
  /** Seconds input selector */
  SECONDS_INPUT: '.mtrl-time-picker-seconds',
  /** Time separator selector */
  SEPARATOR: '.mtrl-time-picker-separator',
  /** AM/PM selector container */
  PERIOD_CONTAINER: '.mtrl-time-picker-period',
  /** AM button selector */
  PERIOD_AM: '.mtrl-time-picker-period-am',
  /** PM button selector */
  PERIOD_PM: '.mtrl-time-picker-period-pm',
  /** Actions container selector */
  ACTIONS: '.mtrl-time-picker-actions',
  /** Toggle type button selector */
  TOGGLE_TYPE_BUTTON: '.mtrl-time-picker-toggle-type',
  /** Cancel button selector */
  CANCEL_BUTTON: '.mtrl-time-picker-cancel',
  /** Confirm button selector */
  CONFIRM_BUTTON: '.mtrl-time-picker-confirm'
} as const;

/**
 * Default icons for the time picker
 * @category Components
 */
export const TIMEPICKER_ICONS = {
  /** Default clock icon */
  CLOCK: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>`,
  
  /** Default keyboard icon */
  KEYBOARD: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
    <line x1="6" y1="8" x2="6" y2="8"></line>
    <line x1="10" y1="8" x2="10" y2="8"></line>
    <line x1="14" y1="8" x2="14" y2="8"></line>
    <line x1="18" y1="8" x2="18" y2="8"></line>
    <line x1="6" y1="12" x2="6" y2="12"></line>
    <line x1="10" y1="12" x2="10" y2="12"></line>
    <line x1="14" y1="12" x2="14" y2="12"></line>
    <line x1="18" y1="12" x2="18" y2="12"></line>
    <line x1="6" y1="16" x2="18" y2="16"></line>
  </svg>`
} as const;

/**
 * Default configuration values for the time picker
 * @category Components
 */
export const TIMEPICKER_DEFAULTS = {
  /** Default picker type */
  TYPE: TIMEPICKER_TYPES.DIAL,
  /** Default time format */
  FORMAT: TIMEPICKER_FORMATS.AMPM,
  /** Default orientation */
  ORIENTATION: TIMEPICKER_ORIENTATIONS.VERTICAL,
  /** Whether to show seconds selector */
  SHOW_SECONDS: false,
  /** Whether to close picker when time is selected */
  CLOSE_ON_SELECT: true,
  /** Step interval for minute selection */
  MINUTE_STEP: 1,
  /** Step interval for second selection */
  SECOND_STEP: 1,
  /** Default cancel button text */
  CANCEL_TEXT: 'Cancel',
  /** Default confirm button text */
  CONFIRM_TEXT: 'OK',
  /** Whether picker is initially open */
  IS_OPEN: false,
  /** Default clock icon */
  CLOCK_ICON: TIMEPICKER_ICONS.CLOCK,
  /** Default keyboard icon */
  KEYBOARD_ICON: TIMEPICKER_ICONS.KEYBOARD
} as const;

/**
 * CSS class names used by the time picker component
 * @category Components
 */
export const TIMEPICKER_CLASSES = {
  /** Root element class */
  ROOT: 'time-picker',
  /** Open state class */
  OPEN: 'time-picker--open',
  /** Modal backdrop class */
  MODAL: 'time-picker-modal',
  /** Dialog container class */
  DIALOG: 'time-picker-dialog',
  /** Dialog with dial type class */
  DIALOG_DIAL: 'time-picker-dialog--dial',
  /** Dialog with input type class */
  DIALOG_INPUT: 'time-picker-dialog--input',
  /** Dialog with vertical orientation class */
  DIALOG_VERTICAL: 'time-picker-dialog--vertical',
  /** Dialog with horizontal orientation class */
  DIALOG_HORIZONTAL: 'time-picker-dialog--horizontal',
  /** Dialog with 12-hour format class */
  DIALOG_12H: 'time-picker-dialog--12h',
  /** Dialog with 24-hour format class */
  DIALOG_24H: 'time-picker-dialog--24h',
  /** Title element class */
  TITLE: 'time-picker-title',
  /** Content container class */
  CONTENT: 'time-picker-content',
  /** Dial container class */
  DIAL: 'time-picker-dial',
  /** Dial canvas class */
  DIAL_CANVAS: 'time-picker-dial-canvas',
  /** Dial face class */
  DIAL_FACE: 'time-picker-dial-face',
  /** Dial hand class */
  DIAL_HAND: 'time-picker-dial-hand',
  /** Dial center dot class */
  DIAL_CENTER: 'time-picker-dial-center',
  /** Dial numbers container class */
  DIAL_NUMBERS: 'time-picker-dial-numbers',
  /** Individual dial number class */
  DIAL_NUMBER: 'time-picker-dial-number',
  /** Active dial number class */
  DIAL_NUMBER_ACTIVE: 'time-picker-dial-number--active',
  /** Input container class */
  INPUT_CONTAINER: 'time-picker-input-container',
  /** Hours input class */
  HOURS_INPUT: 'time-picker-hours',
  /** Minutes input class */
  MINUTES_INPUT: 'time-picker-minutes',
  /** Seconds input class */
  SECONDS_INPUT: 'time-picker-seconds',
  /** Time separator class */
  SEPARATOR: 'time-picker-separator',
  /** Period container class */
  PERIOD_CONTAINER: 'time-picker-period',
  /** AM button class */
  PERIOD_AM: 'time-picker-period-am',
  /** PM button class */
  PERIOD_PM: 'time-picker-period-pm',
  /** Active period button class */
  PERIOD_ACTIVE: 'time-picker-period--active',
  /** Actions container class */
  ACTIONS: 'time-picker-actions',
  /** Toggle type button class */
  TOGGLE_TYPE: 'time-picker-toggle-type',
  /** Cancel button class */
  CANCEL: 'time-picker-cancel',
  /** Confirm button class */
  CONFIRM: 'time-picker-confirm'
} as const;