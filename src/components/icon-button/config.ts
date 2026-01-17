// src/components/icon-button/config.ts

import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { IconButtonConfig } from "./types";
import {
  ICON_BUTTON_VARIANTS,
  ICON_BUTTON_SIZES,
  ICON_BUTTON_SHAPES,
  ICON_BUTTON_WIDTHS,
  ICON_BUTTON_TYPES,
  DEFAULT_RIPPLE_CONFIG,
} from "./constants";

/**
 * Default configuration for the IconButton component
 *
 * Provides reasonable defaults for creating icon buttons
 * according to Material Design 3 guidelines.
 *
 * @category Components
 * @internal
 */
export const defaultConfig: IconButtonConfig = {
  variant: ICON_BUTTON_VARIANTS.STANDARD,
  size: ICON_BUTTON_SIZES.S,
  shape: ICON_BUTTON_SHAPES.ROUND,
  width: ICON_BUTTON_WIDTHS.DEFAULT,
  disabled: false,
  type: ICON_BUTTON_TYPES.BUTTON,
  toggle: false,
  selected: false,
  ripple: true,
  tooltip: true,
  rippleConfig: {
    duration: DEFAULT_RIPPLE_CONFIG.DURATION,
    timing: DEFAULT_RIPPLE_CONFIG.TIMING,
    opacity: DEFAULT_RIPPLE_CONFIG.OPACITY,
  },
};

/**
 * Creates the base configuration for IconButton component
 *
 * Merges user-provided configuration with default values and validates
 * the configuration to ensure all required properties have values.
 *
 * @param config - User provided configuration
 * @returns Complete configuration with defaults applied
 *
 * @category Components
 * @internal
 */
export const createBaseConfig = (
  config: IconButtonConfig = {},
): IconButtonConfig =>
  createComponentConfig(
    defaultConfig,
    config,
    "icon-button",
  ) as IconButtonConfig;

/**
 * Generates element configuration for the IconButton component
 *
 * Transforms the user-friendly IconButtonConfig into the internal format required
 * by the withElement function. Creates all the appropriate CSS classes and attributes
 * needed to properly render the IconButton in the DOM.
 *
 * @param config - IconButton configuration
 * @returns Element configuration object for withElement
 *
 * @category Components
 * @internal
 */
export const getElementConfig = (config: IconButtonConfig) => {
  // Create the attributes object
  const attributes: Record<string, string | boolean | undefined> = {
    type: config.type || "button",
  };

  // Add aria-label for accessibility (required for icon buttons)
  if (config.ariaLabel) {
    attributes["aria-label"] = config.ariaLabel;
  }

  // Add aria-pressed for toggle buttons
  if (config.toggle) {
    attributes["aria-pressed"] = config.selected ? "true" : "false";
  }

  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attributes.disabled = true;
  }

  // Add value attribute if provided
  if (config.value !== undefined) {
    attributes.value = config.value;
  }

  // Create component-specific classes
  const componentClasses: string[] = [];

  // Add size class (default is 's')
  if (config.size && config.size !== "s") {
    componentClasses.push(`icon-button--${config.size}`);
  }

  // Add shape class (default is 'round')
  if (config.shape && config.shape !== "round") {
    componentClasses.push(`icon-button--${config.shape}`);
  }

  // Add width class (default is 'default')
  if (config.width && config.width !== "default") {
    componentClasses.push(`icon-button--${config.width}`);
  }

  // Add toggle class if in toggle mode
  if (config.toggle) {
    componentClasses.push("icon-button--toggle");
  }

  // Add selected class if initially selected
  if (config.toggle && config.selected) {
    componentClasses.push("icon-button--selected");
  }

  // Add disabled class if disabled
  if (config.disabled === true) {
    componentClasses.push("icon-button--disabled");
  }

  // Merge user-provided class/className with component classes
  const userClasses = config.className || config.class;
  const mergedClasses = [
    ...componentClasses,
    ...(Array.isArray(userClasses)
      ? userClasses
      : userClasses
        ? [userClasses]
        : []),
  ];

  // Create enhanced config with merged classes
  const enhancedConfig = {
    ...config,
    className: mergedClasses,
  };

  return createElementConfig(enhancedConfig, {
    tag: "button",
    attributes,
    forwardEvents: {
      click: (component: { element: HTMLButtonElement }) =>
        !component.element.disabled,
      focus: true,
      blur: true,
    },
    interactive: true,
  });
};

/**
 * Creates API configuration for the IconButton component
 *
 * Provides access to various component sub-features like disabled state
 * and lifecycle management.
 *
 * @param comp - Component with disabled and lifecycle features
 * @returns API configuration object for withAPI
 *
 * @category Components
 * @internal
 */
export const getApiConfig = (comp: {
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  lifecycle: { destroy: () => void };
  toggleState?: {
    select: () => unknown;
    deselect: () => unknown;
    toggle: () => unknown;
    isSelected: () => boolean;
    isToggle: () => boolean;
    setIcon: (html: string) => unknown;
    setSelectedIcon: (html: string) => unknown;
    getSelectedIcon: () => string;
  };
}) => ({
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable(),
    isDisabled: () => comp.disabled.isDisabled(),
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy(),
  },
  toggleState: comp.toggleState,
});

export default defaultConfig;
