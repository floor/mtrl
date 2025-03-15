// src/components/timepicker/constants.ts

import { 
  TIME_PICKER_TYPE, 
  TIME_PICKER_ORIENTATION, 
  TIME_FORMAT,
  TIME_PERIOD
} from './types';

/**
 * Default clock icon for time picker.
 * Simple clock SVG.
 */
export const DEFAULT_CLOCK_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <polyline points="12 6 12 12 16 14"></polyline>
</svg>
`;

/**
 * Default keyboard icon for time picker.
 * Simple keyboard SVG.
 */
export const DEFAULT_KEYBOARD_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
</svg>
`;

/**
 * Element selectors for time picker components.
 * Used for DOM manipulation and event delegation.
 */
export const SELECTORS = {
  CONTAINER: '.mtrl-time-picker',
  MODAL: '.mtrl-time-picker-modal',
  DIALOG: '.mtrl-time-picker-dialog',
  TITLE: '.mtrl-time-picker-title',
  CONTENT: '.mtrl-time-picker-content',
  DIAL: '.mtrl-time-picker-dial',
  DIAL_CANVAS: '.mtrl-time-picker-dial-canvas',
  DIAL_FACE: '.mtrl-time-picker-dial-face',
  DIAL_HAND: '.mtrl-time-picker-dial-hand',
  DIAL_CENTER: '.mtrl-time-picker-dial-center',
  DIAL_NUMBERS: '.mtrl-time-picker-dial-numbers',
  DIAL_NUMBER: '.mtrl-time-picker-dial-number',
  INPUT_CONTAINER: '.mtrl-time-picker-input-container',
  HOURS_INPUT: '.mtrl-time-picker-hours',
  MINUTES_INPUT: '.mtrl-time-picker-minutes',
  SECONDS_INPUT: '.mtrl-time-picker-seconds',
  SEPARATOR: '.mtrl-time-picker-separator',
  PERIOD_CONTAINER: '.mtrl-time-picker-period',
  PERIOD_AM: '.mtrl-time-picker-period-am',
  PERIOD_PM: '.mtrl-time-picker-period-pm',
  ACTIONS: '.mtrl-time-picker-actions',
  TOGGLE_TYPE_BUTTON: '.mtrl-time-picker-toggle-type',
  CANCEL_BUTTON: '.mtrl-time-picker-cancel',
  CONFIRM_BUTTON: '.mtrl-time-picker-confirm',
};

export const DIAL_CONSTANTS = {
  DIAMETER: 256,
  INNER_RADIUS: 65,
  OUTER_RADIUS: 110,
  NUMBER_SIZE: 40,
  CENTER_SIZE: 8,
  HAND_SIZE: 36,
  TRACK_WIDTH: 2,
};


/**
 * Z-index values for different parts of the time picker.
 */
export const Z_INDEX = {
  MODAL: 1050,
  DIALOG: 1051,
};

/**
 * Time constants used in the time picker.
 */
export const TIME_CONSTANTS = {
  HOURS_12: Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i)),
  HOURS_24: Array.from({ length: 24 }, (_, i) => i),
  MINUTES: Array.from({ length: 60 }, (_, i) => i),
  SECONDS: Array.from({ length: 60 }, (_, i) => i),
};

/**
 * Custom events fired by the time picker.
 */
export const EVENTS = {
  CHANGE: 'change',
  OPEN: 'open',
  CLOSE: 'close',
  CONFIRM: 'confirm',
  CANCEL: 'cancel',
};

/**
 * Animation timing for the time picker.
 */
export const ANIMATION = {
  OPEN_DURATION: 300,
  CLOSE_DURATION: 200,
  DIAL_SELECT_DURATION: 150,
};

/**
 * Size constants for the time input fields.
 */
export const INPUT_CONSTANTS = {
  FIELD_WIDTH: 96,
  FIELD_HEIGHT: 72,
  PERIOD_WIDTH: 52,
  PERIOD_HEIGHT: 72,
};

/**
 * Time picker type exports for convenience.
 */
export { 
  TIME_PICKER_TYPE, 
  TIME_PICKER_ORIENTATION, 
  TIME_FORMAT,
  TIME_PERIOD
};