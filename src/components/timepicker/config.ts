// src/components/timepicker/config.ts

import { 
  createComponentConfig,
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { TimePickerConfig } from './types';
import { 
  TIME_PICKER_TYPE, 
  TIME_PICKER_ORIENTATION, 
  TIME_FORMAT
} from './types';

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

/**
 * Z-index values for different parts of the time picker.
 */
export const Z_INDEX = {
  MODAL: 1050,
  DIALOG: 1051,
};

/**
 * Default clock icon for time picker.
 * Simple clock SVG.
 */
export const DEFAULT_CLOCK_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <polyline points="12 6 12 12 16 14"></polyline>
</svg>
`

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
 * Default configuration for the TimePicker component
 */
export const defaultConfig: TimePickerConfig = {
  type: TIME_PICKER_TYPE.DIAL,
  format: TIME_FORMAT.AMPM,
  orientation: TIME_PICKER_ORIENTATION.VERTICAL,
  showSeconds: false,
  closeOnSelect: true,
  minuteStep: 1,
  secondStep: 1,
  cancelText: 'Cancel',
  confirmText: 'OK',
  isOpen: false,
  clockIcon: DEFAULT_CLOCK_ICON,
  keyboardIcon: DEFAULT_KEYBOARD_ICON
};

/**
 * Creates the base configuration for TimePicker component
 * @param {TimePickerConfig} config - User provided configuration
 * @returns {TimePickerConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: TimePickerConfig = {}): TimePickerConfig => 
  createComponentConfig(defaultConfig, config, 'time-picker') as TimePickerConfig;

/**
 * Generates element configuration for the TimePicker container
 * @param {TimePickerConfig} config - TimePicker configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getContainerConfig = (config: TimePickerConfig) => {
  return createElementConfig(config, {
    tag: 'div',
    attrs: {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': `${config.prefix}-time-picker-title`
    },
    className: [
      config.class,
      config.isOpen ? `${config.prefix}-time-picker--open` : ''
    ],
    forwardEvents: {
      click: true,
      keydown: true
    },
    interactive: true
  });
};

/**
 * Generates element configuration for the TimePicker modal
 * @param {TimePickerConfig} config - TimePicker configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getModalConfig = (config: TimePickerConfig) => {
  return createElementConfig(config, {
    tag: 'div',
    attrs: {
      role: 'presentation'
    },
    className: `${config.prefix}-time-picker-modal`,
    forwardEvents: {
      click: (component, event) => {
        // Only close if clicking directly on the modal backdrop
        if (event.target === component.element) {
          return true;
        }
        return false;
      }
    },
    interactive: true
  });
};

/**
 * Generates element configuration for the TimePicker dialog
 * @param {TimePickerConfig} config - TimePicker configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getDialogConfig = (config: TimePickerConfig) => {
  return createElementConfig(config, {
    tag: 'div',
    className: [
      `${config.prefix}-time-picker-dialog`,
      `${config.prefix}-time-picker-dialog--${config.type}`,
      `${config.prefix}-time-picker-dialog--${config.orientation}`,
      `${config.prefix}-time-picker-dialog--${config.format}`
    ],
    forwardEvents: {
      click: true
    },
    interactive: true
  });
};

/**
 * Creates API configuration for the TimePicker component
 * @param {Object} comp - Component with events and lifecycle features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp: any) => ({
  events: {
    on: (event: string, handler: Function) => comp.on(event, handler),
    off: (event: string, handler: Function) => comp.off(event, handler),
    emit: (event: string, data?: any) => comp.emit(event, data),
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});

export default defaultConfig;