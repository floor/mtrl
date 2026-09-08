// src/components/split-button/config.ts
import {
  createComponentConfig,
  createElementConfig,
  BaseComponentConfig,
} from "../../core/config/component";
import { SplitButtonConfig } from "./types";
import { SPLIT_BUTTON_DEFAULTS } from "./constants";

/**
 * Default configuration
 */
export const defaultConfig: Partial<SplitButtonConfig> = {
  variant: SPLIT_BUTTON_DEFAULTS.VARIANT,
  size: SPLIT_BUTTON_DEFAULTS.SIZE,
  disabled: false,
  trailingLabel: SPLIT_BUTTON_DEFAULTS.TRAILING_LABEL,
};

/**
 * Creates the base configuration with the defaults applied
 * @param {SplitButtonConfig} config - User provided configuration
 * @returns {SplitButtonConfig} Complete configuration
 */
export const createBaseConfig = (config: SplitButtonConfig = {}): SplitButtonConfig =>
  createComponentConfig(
    defaultConfig as BaseComponentConfig,
    config as BaseComponentConfig,
    "split-button"
  ) as SplitButtonConfig;

/**
 * Element configuration. The two buttons are a group, so a screen reader
 * announces them together and the group can carry a name of its own.
 * @param {SplitButtonConfig} config - Configuration
 * @returns {Object} Element configuration for withElement
 */
export const getElementConfig = (config: SplitButtonConfig) => {
  const attributes: Record<string, string> = { role: "group" };
  if (config.groupLabel) attributes["aria-label"] = config.groupLabel;

  return createElementConfig(config as BaseComponentConfig, {
    tag: "div",
    attributes,
  });
};

export default defaultConfig;
