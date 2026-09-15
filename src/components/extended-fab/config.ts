// src/components/extended-fab/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { ExtendedFabConfig, ExtendedFabComponent } from "./types";
import { EXTENDED_FAB_CLASSES } from "./constants";

/**
 * Default configuration for the Extended FAB component
 *
 * Provides reasonable defaults for creating Extended FABs
 * according to Material Design 3 guidelines.
 *
 * @category Components
 * @internal
 */
export const defaultConfig: ExtendedFabConfig = {
  variant: "primary-container",
  type: "button",
  ripple: true,
  iconPosition: "start",
  width: "fixed",
  size: "small",
};

/**
 * Creates the base configuration for Extended FAB component
 *
 * Merges user-provided configuration with default values and validates
 * the configuration to ensure all required properties have values.
 *
 * @param {ExtendedFabConfig} config - User provided configuration
 * @returns {ExtendedFabConfig} Complete configuration with defaults applied
 *
 * @category Components
 * @internal
 */
export const createBaseConfig = (
  config: ExtendedFabConfig = {}
): ExtendedFabConfig =>
  createComponentConfig(
    defaultConfig,
    config,
    "extended-fab"
  ) as ExtendedFabConfig;

/**
 * Generates element configuration for the Extended FAB component
 *
 * Transforms the user-friendly ExtendedFabConfig into the internal format required
 * by the withElement function. Creates all the appropriate CSS classes and attributes
 * needed to properly render the Extended FAB in the DOM.
 *
 * @param {ExtendedFabConfig} config - Extended FAB configuration
 * @returns {Object} Element configuration object for withElement
 *
 * @category Components
 * @internal
 */
export const getElementConfig = (config: ExtendedFabConfig) => {
  // Create the attributes object
  const attributes: Record<string, string | boolean | undefined> = {
    type: config.type || "button",
    "aria-label":
      config.ariaLabel || config.text || (config.icon ? "action" : undefined),
  };

  if (config.value !== undefined) {
    attributes.value = config.value;
  }

  // Build class list
  const classNames = [`${config.prefix}-extended-fab`];

  // Add variant class
  if (config.variant) {
    classNames.push(`${config.prefix}-extended-fab--${config.variant}`);
  }

  // Every size, including the default, carries its expressive size class.
  classNames.push(`${config.prefix}-extended-fab--${config.size || "small"}`);

  if (config.iconPosition === "end") {
    classNames.push(`${config.prefix}-${EXTENDED_FAB_CLASSES.ICON_END}`);
  }

  // Add width class
  if (config.width) {
    classNames.push(`${config.prefix}-extended-fab--${config.width}`);
  }

  // Add animation class if specified
  if (config.animate) {
    classNames.push(`${config.prefix}-extended-fab--animate-enter`);
  }

  // Add position class if specified
  if (config.position) {
    classNames.push(`${config.prefix}-extended-fab--${config.position}`);
  }

  // Add collapse-on-scroll class if specified
  if (config.collapseOnScroll) {
    classNames.push(`${config.prefix}-extended-fab--collapsible`);
  }

  // Add user classes
  if (config.class) {
    classNames.push(config.class);
  }

  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attributes.disabled = true;
    classNames.push(`${config.prefix}-extended-fab--disabled`);
  }

  return createElementConfig(config, {
    tag: "button",
    attributes,
    className: classNames,
    forwardEvents: {
      click: (component) => !component.element.disabled,
      focus: true,
      blur: true,
    },
    interactive: true,
  });
};

/**
 * Creates API configuration for the Extended FAB component
 *
 * Provides access to various component sub-features like disabled state,
 * lifecycle management, and text content.
 *
 * @param {Object} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object for withAPI
 *
 * @category Components
 * @internal
 */
export const getApiConfig = (
  comp: Pick<
    ExtendedFabComponent,
    "disabled" | "lifecycle" | "getClass" | "text"
  >
) => ({
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable(),
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy(),
  },
  className: comp.getClass("extended-fab"),
  text: {
    setText: (text: string) => comp.text.setText(text),
    getText: () => comp.text.getText(),
  },
});

export default defaultConfig;
