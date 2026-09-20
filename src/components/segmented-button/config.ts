// src/components/segmented-button/config.ts
import { createComponentConfig } from "../../core/config/component";
import { SegmentedButtonConfig, SegmentConfig, SelectionMode, Density } from "./types";
import { SEGMENTED_BUTTON_DEFAULTS } from "./constants";

/**
 * Default configuration values for segmented buttons
 * @internal
 */
export const DEFAULT_CONFIG: SegmentedButtonConfig = {
  mode: SelectionMode.SINGLE,
  ripple: SEGMENTED_BUTTON_DEFAULTS.RIPPLE,
  density: SEGMENTED_BUTTON_DEFAULTS.DENSITY,
};

/**
 * Creates the base configuration for Segmented Button component
 * @param {SegmentedButtonConfig} config - User provided configuration
 * @returns {SegmentedButtonConfig} Complete configuration with defaults applied
 * @internal
 */
export const createBaseConfig = (config: SegmentedButtonConfig = {}) =>
  // No cast: it discarded the `componentName` and `prefix` that
  // createComponentConfig guarantees, which put `prefix` back to optional and
  // left every `${config.prefix}-...` template holding "undefined-".
  createComponentConfig(DEFAULT_CONFIG, config, "segmented-button");

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
    ].filter((name): name is string => Boolean(name)),
    interactive: true,
  };
};

/**
 * Generates configuration for a segment element
 * @param {Object} segment - Segment configuration
 * @param {string} prefix - Component prefix
 * @param {boolean} groupDisabled - Whether the entire group is disabled
 * @returns {Object} Element configuration for the segment
 * @internal
 */
export const getSegmentConfig = (
  segment: SegmentConfig,
  prefix: string,
  groupDisabled = false,
) => {
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
