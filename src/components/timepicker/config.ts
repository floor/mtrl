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
  minuteStep: TIMEPICKER_DEFAULTS.MINUTE_STEP,
  secondStep: TIMEPICKER_DEFAULTS.SECOND_STEP,
  cancelText: TIMEPICKER_DEFAULTS.CANCEL_TEXT,
  confirmText: TIMEPICKER_DEFAULTS.CONFIRM_TEXT,
  open: TIMEPICKER_DEFAULTS.OPEN,
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

/** Whether an event started inside the picker's dialog. */
const inDialog = (event: Event, prefix: string): boolean =>
  event.target instanceof Element && event.target.closest(`.${prefix}-time-picker__dialog`) !== null;

/**
 * Generates element configuration for the TimePicker container
 * @param {TimePickerConfig} config - TimePicker configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getContainerConfig = (config: ResolvedTimePickerConfig) => {
  // `title` is the headline: passed on, it became the native tooltip over
  // the whole surface (FLO-347). The headline names it through aria-labelledby.
  return createElementConfig({ ...config, title: undefined }, {
    tag: "div",
    // The dialog semantics are the native <dialog>'s, not this host's. FLO-278.
    className: [
      config.class,
      config.open ? `${config.prefix}-time-picker--open` : "",
    ],
    // The root's own events, not the dialog's, which now sits inside the root
    // (FLO-288) and has its own actions.
    forwardEvents: {
      click: (_component, event) => !inDialog(event, config.prefix),
      keydown: (_component, event) => !inDialog(event, config.prefix),
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
