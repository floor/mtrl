// src/components/timePicker/config.ts

import { 
  createComponentConfig,
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { TimePickerConfig } from './types';
import { 
  TIME_PICKER_TYPE, 
  TIME_PICKER_ORIENTATION, 
  TIME_FORMAT,
  DEFAULT_CLOCK_ICON,
  DEFAULT_KEYBOARD_ICON
} from './constants';

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