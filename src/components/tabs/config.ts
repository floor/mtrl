// src/components/tabs/config.ts
import { createComponentConfig } from "../../core/config/component";
import { withElement } from "../../core/compose/component";
import { TabConfig } from "./types";
import { TAB_STATES, TABS_DEFAULTS } from "./constants";

/**
 * Default configuration for a Tab
 */
export const defaultTabConfig: TabConfig = {
  state: TAB_STATES.INACTIVE,
  componentName: "tab",
  ripple: TABS_DEFAULTS.RIPPLE,
};

/**
 * Default configuration for the Tabs component
 */
export const defaultTabsConfig = {
  variant: TABS_DEFAULTS.VARIANT,
  scrollable: TABS_DEFAULTS.SCROLLABLE,
  showDivider: TABS_DEFAULTS.SHOW_DIVIDER,
  componentName: "tabs",
};

export const createTabsConfig = (config = {}) =>
  createComponentConfig(defaultTabsConfig, config, "tabs");

/**
 * Creates the base configuration for a Tab
 * @param {TabConfig} config - User provided configuration
 * @returns {TabConfig} Complete configuration with defaults applied
 */
export const createTabConfig = (config: TabConfig = {}): TabConfig =>
  createComponentConfig(defaultTabConfig, config, "tab") as TabConfig;

export const getTabsElementConfig = (config) => {
  const elementConfig = {
    tag: "div",
    attributes: {
      role: "tablist",
      "aria-orientation": "horizontal",
    },
    className: [
      `${config.prefix}-tabs`,
      `${config.prefix}-tabs--${config.variant || "primary"}`,
      config.class,
    ],
  };

  return (component) => withElement(elementConfig)(component);
};

/**
 * Creates API configuration for the Tab component
 * @param {Object} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object
 */
export const getTabApiConfig = (comp) => ({
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable(),
    isDisabled: () => comp.disabled.isDisabled && comp.disabled.isDisabled(),
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy(),
  },
  button: comp.button,
});
