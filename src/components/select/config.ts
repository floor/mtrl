// src/components/select/config.ts

import { createComponentConfig } from "../../core/config/component";
import { SelectConfig, BaseComponent, ApiOptions } from "./types";
import { SELECT_DEFAULTS } from "./constants";
import { MENU } from "../menu/inner";

/**
 * Default configuration for the Select component
 */
export const defaultConfig: SelectConfig = {
  options: [],
  variant: SELECT_DEFAULTS.VARIANT,
  placement: SELECT_DEFAULTS.PLACEMENT,
};

/**
 * Creates the base configuration for Select component
 * @param {SelectConfig} config - User provided configuration
 * @returns {SelectConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (
  config: SelectConfig = { options: [] },
): SelectConfig =>
  createComponentConfig(defaultConfig, config, "select") as SelectConfig;

/**
 * Creates API configuration for the Select component
 * @param {BaseComponent} comp - Component with select features
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: BaseComponent): ApiOptions => ({
  select: {
    getValue: comp.select?.getValue || (() => null),
    setValue: comp.select?.setValue || (() => comp),
    clear: comp.select?.clear || (() => comp),
    getText: comp.select?.getText || (() => ""),
    getSelectedOption: comp.select?.getSelectedOption || (() => null),
    getOptions: comp.select?.getOptions || (() => []),
    setOptions: comp.select?.setOptions || (() => comp),
    open: comp.select?.open || (() => comp),
    close: comp.select?.close || (() => comp),
    isOpen: comp.select?.isOpen || (() => false),
  },
  events: {
    on: comp.on || (() => comp),
    off: comp.off || (() => comp),
  },
  disabled: {
    enable: () => {
      if (comp.textField?.enable) {
        comp.textField.enable();
      }
      return comp;
    },
    disable: () => {
      if (comp.textField?.disable) {
        comp.textField.disable();
      }
      return comp;
    },
  },
  lifecycle: {
    destroy: () => {
      if (comp.textField?.destroy) {
        comp.textField.destroy();
      }
      if (comp[MENU]?.destroy) {
        comp[MENU].destroy();
      }
      if (comp.lifecycle?.destroy) {
        comp.lifecycle.destroy();
      }
    },
  },
});

export default defaultConfig;
