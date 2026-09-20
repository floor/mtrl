// src/components/timepicker/config.ts

import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import type { EventCallback } from "../../core/state/emitter";
import type { EventComponent } from "../../core/compose/features/events";
import type { LifecycleComponent } from "../../core/compose/features/lifecycle";
import { TimePickerConfig, ResolvedTimePickerConfig } from "./types";
import {
  TIME_PICKER_TYPE,
  TIME_PICKER_ORIENTATION,
  TIME_FORMAT,
} from "./types";
import { TIMEPICKER_DEFAULTS, TIMEPICKER_ICONS } from "./constants";

/**
 * Default configuration for the TimePicker component
 */
export const defaultConfig: TimePickerConfig = {
  type: TIME_PICKER_TYPE.DIAL,
  format: TIME_FORMAT.AMPM,
  orientation: TIME_PICKER_ORIENTATION.VERTICAL,
  showSeconds: TIMEPICKER_DEFAULTS.SHOW_SECONDS,
  closeOnSelect: TIMEPICKER_DEFAULTS.CLOSE_ON_SELECT,
  minuteStep: TIMEPICKER_DEFAULTS.MINUTE_STEP,
  secondStep: TIMEPICKER_DEFAULTS.SECOND_STEP,
  cancelText: TIMEPICKER_DEFAULTS.CANCEL_TEXT,
  confirmText: TIMEPICKER_DEFAULTS.CONFIRM_TEXT,
  isOpen: TIMEPICKER_DEFAULTS.IS_OPEN,
  clockIcon: TIMEPICKER_ICONS.CLOCK,
  keyboardIcon: TIMEPICKER_ICONS.KEYBOARD,
};

/**
 * Creates the base configuration for TimePicker component
 * @param {TimePickerConfig} config - User provided configuration
 * @returns {ResolvedTimePickerConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (
  config: TimePickerConfig = {}
): ResolvedTimePickerConfig =>
  // The assertion states what merging `defaultConfig` guarantees: every field
  // named in ResolvedTimePickerConfig has a default, so all of them are set by
  // the time this returns. The compiler cannot see that through the generic
  // merge, and the previous `as TimePickerConfig` threw the guarantee away —
  // which is why fifty reads downstream had to cope with `undefined`.
  createComponentConfig(
    defaultConfig,
    config,
    "time-picker"
  ) as ResolvedTimePickerConfig;

/**
 * Generates element configuration for the TimePicker container
 * @param {TimePickerConfig} config - TimePicker configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getContainerConfig = (config: ResolvedTimePickerConfig) => {
  return createElementConfig(config, {
    tag: "div",
    attributes: {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": `${config.prefix}-time-picker-title`,
    },
    className: [
      config.class,
      config.isOpen ? `${config.prefix}-time-picker--open` : "",
    ],
    forwardEvents: {
      click: true,
      keydown: true,
    },
    interactive: true,
  });
};

/**
 * Generates element configuration for the TimePicker modal
 * @param {TimePickerConfig} config - TimePicker configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getModalConfig = (config: ResolvedTimePickerConfig) => {
  return createElementConfig(config, {
    tag: "div",
    attributes: {
      role: "presentation",
    },
    className: `${config.prefix}-time-picker-modal`,
    forwardEvents: {
      click: (component, event) => {
        // Only close if clicking directly on the modal backdrop
        if (event.target === component.element) {
          return true;
        }
        return false;
      },
    },
    interactive: true,
  });
};

/**
 * Generates element configuration for the TimePicker dialog
 * @param {TimePickerConfig} config - TimePicker configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getDialogConfig = (config: ResolvedTimePickerConfig) => {
  return createElementConfig(config, {
    tag: "div",
    className: [
      `${config.prefix}-time-picker-dialog`,
      `${config.prefix}-time-picker-dialog--${config.type}`,
      `${config.prefix}-time-picker-dialog--${config.orientation}`,
      `${config.prefix}-time-picker-dialog--${config.format}`,
    ],
    forwardEvents: {
      click: true,
    },
    interactive: true,
  });
};

/**
 * Creates API configuration for the TimePicker component
 * @param {Object} comp - Component with events and lifecycle features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp: EventComponent & LifecycleComponent) => ({
  events: {
    on: (event: string, handler: EventCallback) => comp.on(event, handler),
    off: (event: string, handler: EventCallback) => comp.off(event, handler),
    emit: (event: string, data?: unknown) => comp.emit(event, data),
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy(),
  },
});

export default defaultConfig;
