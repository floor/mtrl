// src/components/tooltip/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { TooltipConfig } from "./types";
import { TOOLTIP_DEFAULTS } from "./constants";

/**
 * Default configuration for the Tooltip component
 */
export const defaultConfig: TooltipConfig = {
  position: TOOLTIP_DEFAULTS.POSITION,
  variant: TOOLTIP_DEFAULTS.VARIANT,
  visible: TOOLTIP_DEFAULTS.VISIBLE,
  showDelay: TOOLTIP_DEFAULTS.SHOW_DELAY,
  hideDelay: TOOLTIP_DEFAULTS.HIDE_DELAY,
  showOnFocus: TOOLTIP_DEFAULTS.SHOW_ON_FOCUS,
  showOnHover: TOOLTIP_DEFAULTS.SHOW_ON_HOVER,
  rich: TOOLTIP_DEFAULTS.RICH,
};

/**
 * Creates the base configuration for Tooltip component
 * @param {TooltipConfig} config - User provided configuration
 * @returns {TooltipConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: TooltipConfig = {}): TooltipConfig =>
  createComponentConfig(defaultConfig, config, "tooltip") as TooltipConfig;

/**
 * Generates element configuration for the Tooltip component
 * @param {TooltipConfig} config - Tooltip configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: TooltipConfig) => {
  // Create the attributes object
  const attributes: Record<string, any> = {
    role: "tooltip",
    "aria-hidden": "true",
  };

  // Add z-index if provided
  if (config.zIndex !== undefined) {
    attributes["style"] = `z-index: ${config.zIndex};`;
  }

  return createElementConfig(config, {
    tag: "div",
    attributes,
    className: [
      config.class,
      `${config.prefix}-tooltip--${config.position}`,
      `${config.prefix}-tooltip--${config.variant}`,
    ],
    text: config.text || "",
  });
};

/**
 * Creates API configuration for the Tooltip component
 * @param {Object} comp - Component with lifecycle feature
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  lifecycle: {
    destroy: () => comp.lifecycle.destroy(),
  },
});

export default defaultConfig;
