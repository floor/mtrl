// src/components/datepicker/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { 
  DatePickerConfig, 
  DEFAULT_DATE_FORMAT 
} from './types';

/**
 * Default configuration for the DatePicker component
 */
export const defaultConfig: DatePickerConfig = {
  variant: 'docked',
  initialView: 'day',
  selectionMode: 'single',
  dateFormat: DEFAULT_DATE_FORMAT,
  animate: true
};

/**
 * Creates the base configuration for DatePicker component
 * @param {DatePickerConfig} config - User provided configuration
 * @returns {DatePickerConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: DatePickerConfig = {}): DatePickerConfig => {
  const baseConfig = createComponentConfig(defaultConfig, config, 'datepicker') as DatePickerConfig;
  
  // Set closeOnSelect default based on variant
  if (baseConfig.closeOnSelect === undefined) {
    baseConfig.closeOnSelect = baseConfig.variant !== 'docked';
  }
  
  return baseConfig;
};

/**
 * Generates element configuration for the DatePicker container
 * @param {DatePickerConfig} config - DatePicker configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getContainerConfig = (config: DatePickerConfig) => {
  return createElementConfig(config, {
    tag: 'div',
    attrs: {
      role: 'application',
      'aria-label': 'Date Picker',
      tabindex: '-1'
    },
    className: [
      `${config.prefix}-datepicker-container`,
      config.class
    ],
    forwardEvents: {
      keydown: true,
      click: true
    },
    interactive: true
  });
};

/**
 * Generates element configuration for the input field
 * @param {DatePickerConfig} config - DatePicker configuration
 * @returns {Object} Element configuration object for input field
 */
export const getInputConfig = (config: DatePickerConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {
    type: 'text',
    placeholder: config.placeholder || config.dateFormat,
    autocomplete: 'off',
    readonly: true
  };
  
  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attrs.disabled = true;
  }
  
  return createElementConfig(config, {
    tag: 'input',
    attrs,
    className: `${config.prefix}-datepicker-input`,
    forwardEvents: {
      focus: true,
      blur: true,
      click: true
    },
    interactive: true
  });
};

/**
 * Generates element configuration for the calendar container
 * @param {DatePickerConfig} config - DatePicker configuration
 * @returns {Object} Element configuration object for calendar container
 */
export const getCalendarConfig = (config: DatePickerConfig) => {
  return createElementConfig(config, {
    tag: 'div',
    attrs: {
      role: 'dialog',
      'aria-modal': config.variant !== 'docked' ? 'true' : 'false'
    },
    className: [
      `${config.prefix}-datepicker-calendar`,
      `${config.prefix}-datepicker-${config.variant}`,
      config.selectionMode === 'range' ? 
        `${config.prefix}-datepicker-range` : ''
    ],
    forwardEvents: {
      keydown: true,
      click: true
    }
  });
};

/**
 * Creates API configuration for the DatePicker component
 * @param {Object} comp - Component with features like disabled and lifecycle
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp: any) => ({
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable()
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  },
  events: {
    on: comp.on,
    off: comp.off,
    emit: comp.emit
  }
});

export default defaultConfig;