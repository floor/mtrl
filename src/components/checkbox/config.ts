// src/components/checkbox/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { CheckboxConfig, BaseComponent, ApiComponent, ApiOptions } from "./types";

import { setHTML } from "../../core/dom/html";
/**
 * Default configuration for the Checkbox component
 */
export const defaultConfig: CheckboxConfig = {
  variant: "filled",
  labelPosition: "end",
};

/**
 * Creates the base configuration for Checkbox component
 * @param {CheckboxConfig} config - User provided configuration
 * @returns {CheckboxConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: CheckboxConfig = {}): CheckboxConfig =>
  createComponentConfig(defaultConfig, config, "checkbox") as CheckboxConfig;

/**
 * Generates element configuration for the Checkbox component
 * @param {CheckboxConfig} config - Checkbox configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: CheckboxConfig) =>
  createElementConfig(config, {
    tag: "div",
    className: config.class,
    interactive: true,
  });

/**
 * Adds check icon to checkbox
 * @param {CheckboxConfig} config - Component configuration
 */
export const withCheckIcon =
  (config: CheckboxConfig) =>
  <C extends BaseComponent>(component: C): C => {
    const icon = document.createElement("span");
    icon.className = `${config.prefix}-checkbox__icon`;
    setHTML(icon, `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M9.55 14.6L6.35 11.4l-1.9 1.9L9.55 18.4l10.9-10.9-1.9-1.9z"/>
    </svg>
  `);

    component.element.appendChild(icon);
    return component;
  };

/**
 * Applies label position class to the component
 * @param {CheckboxConfig} config - Component configuration
 */
export const withLabelPosition =
  (config: CheckboxConfig) =>
  <C extends BaseComponent>(component: C): C => {
    const position = config.labelPosition || "end";
    const positionClass = `${config.prefix}-checkbox--label-${position}`;

    component.element.classList.add(positionClass);

    return component;
  };

/**
 * Creates API configuration for the Checkbox component
 * @param {ApiComponent} comp - Component with disabled, lifecycle, and checkable features
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: ApiComponent): ApiOptions => ({
  disabled: {
    enable: comp.disabled.enable,
    disable: comp.disabled.disable,
  },
  lifecycle: {
    destroy: comp.lifecycle.destroy,
  },
  checkable: {
    check: comp.checkable.check,
    uncheck: comp.checkable.uncheck,
    toggle: comp.checkable.toggle,
    isChecked: comp.checkable.isChecked,
  },
});

export default defaultConfig;
