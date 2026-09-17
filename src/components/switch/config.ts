// src/components/switch/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { SwitchConfig, BaseComponent, ApiOptions } from "./types";
import { SWITCH_DEFAULTS } from "./constants";

/**
 * Default configuration for the Switch component
 */
export const defaultConfig: SwitchConfig = {
  prefix: "mtrl",
  componentName: "switch",
  // Read from the published constant, so the documented default and the
  // rendered one cannot disagree again.
  labelPosition: SWITCH_DEFAULTS.LABEL_POSITION,
};

/**
 * Creates the base configuration for Switch component
 * @param {SwitchConfig} config - User provided configuration
 * @returns {SwitchConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SwitchConfig = {}): SwitchConfig =>
  createComponentConfig(defaultConfig, config, "switch") as SwitchConfig;

/**
 * Generates element configuration for the Switch component
 * @param {SwitchConfig} config - Switch configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: SwitchConfig) =>
  createElementConfig(config, {
    tag: "div",
    className: config.class,
    interactive: true,
  });

/**
 * Creates API configuration for the Switch component
 * @param {BaseComponent} comp - Component with disabled, lifecycle, and checkable features
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: BaseComponent): ApiOptions => ({
  disabled: {
    enable: comp.disabled?.enable,
    disable: comp.disabled?.disable,
  },
  lifecycle: {
    destroy: comp.lifecycle?.destroy,
  },
  checkable: {
    check: comp.checkable?.check,
    uncheck: comp.checkable?.uncheck,
    toggle: comp.checkable?.toggle,
    isChecked: comp.checkable?.isChecked,
  },
});

export default defaultConfig;
