// src/components/chips/chip/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../../core/config/component";

import { ChipConfig } from "../types";

/**
 * Component with required elements and methods
 * @internal
 */
interface BaseComponent {
  element: HTMLElement;
  disabled?: {
    enable: () => any;
    disable: () => any;
  };
  lifecycle?: {
    destroy: () => void;
  };
  [key: string]: any;
}

/**
 * Default configuration for the Chip component
 */
export const defaultConfig: ChipConfig = {
  variant: "filled",
  ripple: true,
};

/**
 * Creates the base configuration for Chip component
 * @param {ChipConfig} config - User provided configuration
 * @returns {ChipConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: ChipConfig = {}): ChipConfig =>
  createComponentConfig(defaultConfig, config, "chip") as ChipConfig;

/**
 * Generates element configuration for the Chip component
 * @param {ChipConfig} config - Chip configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ChipConfig) => {
  // Create the attributes object
  const attributes: Record<string, any> = {
    role: "button",
    tabindex: "0",
  };

  // Only add aria-disabled attribute if needed
  if (config.disabled === true) {
    attributes["aria-disabled"] = "true";
  }

  // Add aria-selected if specified
  if (config.selected === true) {
    attributes["aria-selected"] = "true";
  } else if (config.selected === false) {
    attributes["aria-selected"] = "false";
  }

  // Define additional classes
  const className = [
    config.class,
    config.selected ? `${config.prefix}-chip--selected` : null,
  ];

  return createElementConfig(config, {
    tag: "div",
    attributes,
    className,
    forwardEvents: {
      click: (component: BaseComponent) =>
        component.element.getAttribute("aria-disabled") !== "true",
      keydown: (component: BaseComponent, event: KeyboardEvent) => {
        // Handle space and enter key for accessibility
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          component.element.click();
          return true;
        }
        return false;
      },
      focus: true,
      blur: true,
    },
  });
};

/**
 * Creates API configuration for the Chip component
 * @param {BaseComponent} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp: BaseComponent) => ({
  disabled: {
    enable: () => comp.disabled?.enable(),
    disable: () => comp.disabled?.disable(),
  },
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.(),
  },
});

export default defaultConfig;
