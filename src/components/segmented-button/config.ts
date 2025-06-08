// src/components/segmented-button/config.ts
import { createComponentConfig } from "../../core/config/component";
import { SegmentedButtonConfig, SelectionMode, Density } from "./types";
import { SEGMENTED_BUTTON_DEFAULTS } from "./constants";

/**
 * Default configuration values for segmented buttons
 * @internal
 */
export const DEFAULT_CONFIG = {
  mode: SEGMENTED_BUTTON_DEFAULTS.MODE,
  ripple: SEGMENTED_BUTTON_DEFAULTS.RIPPLE,
  density: SEGMENTED_BUTTON_DEFAULTS.DENSITY,
};

/**
 * Creates the base configuration for Segmented Button component
 * @param {SegmentedButtonConfig} config - User provided configuration
 * @returns {SegmentedButtonConfig} Complete configuration with defaults applied
 * @internal
 */
export const createBaseConfig = (
  config: SegmentedButtonConfig = {}
): SegmentedButtonConfig =>
  createComponentConfig(
    DEFAULT_CONFIG,
    config,
    "segmented-button"
  ) as SegmentedButtonConfig;

/**
 * Generates element configuration for the Segmented Button container
 * @param {SegmentedButtonConfig} config - Segmented Button configuration
 * @returns {Object} Element configuration object for withElement
 * @internal
 */
export const getContainerConfig = (config: SegmentedButtonConfig) => {
  const density = config.density || Density.DEFAULT;

  return {
    tag: "div",
    componentName: "segmented-button",
    attributes: {
      role: "group",
      "aria-label": "Segmented button",
      "data-mode": config.mode || SelectionMode.SINGLE,
      "data-density": density,
    },
    className: [
      config.class,
      config.disabled ? `${config.prefix}-segmented-button--disabled` : null,
      density !== Density.DEFAULT
        ? `${config.prefix}-segmented-button--${density}`
        : null,
    ],
    interactive: true,
  };
};

/**
 * Gets density-specific sizing and spacing values
 * @param {string} density - The density level
 * @returns {Object} CSS variables with sizing values
 * @internal
 */
export const getDensityStyles = (density: string): Record<string, string> => {
  switch (density) {
    case Density.COMPACT:
      return {
        "--segment-padding": "4px 8px",
        "--segment-height": "28px",
        "--segment-font-size": "0.8125rem",
      };
    case Density.COMFORTABLE:
      return {
        "--segment-padding": "6px 12px",
        "--segment-height": "32px",
        "--segment-font-size": "0.875rem",
      };
    case Density.DEFAULT:
    default:
      return {
        "--segment-padding": "8px 16px",
        "--segment-height": "36px",
        "--segment-font-size": "0.875rem",
      };
  }
};

/**
 * Generates configuration for a segment element
 * @param {Object} segment - Segment configuration
 * @param {string} prefix - Component prefix
 * @param {boolean} groupDisabled - Whether the entire group is disabled
 * @returns {Object} Element configuration for the segment
 * @internal
 */
export const getSegmentConfig = (segment, prefix, groupDisabled = false) => {
  const isDisabled = groupDisabled || segment.disabled;

  // We use button as our base class, but add segment-specific classes for states
  return {
    tag: "button",
    attributes: {
      type: "button",
      role: "button",
      disabled: isDisabled ? true : undefined,
      "aria-pressed": segment.selected ? "true" : "false",
      value: segment.value,
    },
    className: [
      `${prefix}-button`, // Base button class
      `${prefix}-segmented-button-segment`, // Specific segment class
      segment.selected ? `${prefix}-segment--selected` : null, // Selected state
      isDisabled ? `${prefix}-segment--disabled` : null, // Disabled state
      segment.class, // Custom class if provided
    ],
    forwardEvents: {
      click: () => !isDisabled,
    },
    interactive: !isDisabled,
  };
};
