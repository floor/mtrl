// src/components/fab/config.ts
// Class names are written out in full. The class helpers no longer add the
// `mtrl-` prefix for you (FLO-117), so a modifier built here carries it.
import { PREFIX } from "../../core/config";
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { FabConfig, FabComponent } from "./types";

/**
 * Default configuration for the FAB component
 *
 * Provides reasonable defaults for creating FABs
 * according to Material Design 3 guidelines.
 *
 * @category Components
 * @internal
 */
export const defaultConfig: Partial<FabConfig> = {
  variant: "primary-container",
  size: "default",
  type: "button",
  ripple: true,
};

/**
 * Creates the base configuration for FAB component
 *
 * Merges user-provided configuration with default values and validates
 * the configuration to ensure all required properties have values.
 *
 * @param {FabConfig} config - User provided configuration
 * @returns {FabConfig} Complete configuration with defaults applied
 *
 * @category Components
 * @internal
 */
export const createBaseConfig = (config: FabConfig): FabConfig =>
  createComponentConfig(defaultConfig, config, "fab") as FabConfig;

/**
 * Generates element configuration for the FAB component
 *
 * Transforms the user-friendly FabConfig into the internal format required
 * by the withElement function. Creates all the appropriate CSS classes and attributes
 * needed to properly render the FAB in the DOM.
 *
 * @param {FabConfig} config - FAB configuration
 * @returns {Object} Element configuration object for withElement
 *
 * @category Components
 * @internal
 */
export const getElementConfig = (config: FabConfig) => {
  // Create the attributes object
  const attributes: Record<string, string | boolean | undefined> = {
    type: config.type || "button",
    // No fallback. This used to be `|| (config.icon ? "action" : undefined)`,
    // which gave every unlabelled FAB the name "action" -- enough to pass axe
    // and Lighthouse while telling a screen-reader user nothing. FLO-110.
    "aria-label": config.ariaLabel,
  };

  if (config.value !== undefined) {
    attributes.value = config.value;
  }

  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attributes.disabled = true;
  }

  // Create component-specific classes that don't need prefixing (they already include the prefix)
  const componentClasses: string[] = [];

  // Add size class
  componentClasses.push(`${PREFIX}-fab--${config.size || "default"}`);

  // Add animation class if specified
  if (config.animate) {
    componentClasses.push(`${PREFIX}-fab--animate-enter`);
  }

  // Add position class if specified
  if (config.position) {
    componentClasses.push(`${PREFIX}-fab--${config.position}`);
  }

  // Add disabled class if specified
  if (config.disabled === true) {
    componentClasses.push(`${PREFIX}-fab--disabled`);
  }

  return createElementConfig(config, {
    tag: "button",
    attributes,
    className: componentClasses,
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
 * Creates API configuration for the FAB component
 *
 * Provides access to various component sub-features like disabled state
 * and lifecycle management.
 *
 * @param {Object} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object for withAPI
 *
 * @category Components
 * @internal
 */
export const getApiConfig = (
  comp: Pick<FabComponent, "disabled" | "lifecycle" | "getClass">
) => ({
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable(),
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy(),
  },
  className: comp.getClass("fab"),
});

export default defaultConfig;
