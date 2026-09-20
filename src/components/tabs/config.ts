// src/components/tabs/config.ts
import { createComponentConfig } from "../../core/config/component";
import { BaseComponent, ElementComponent, withElement } from "../../core/compose/component";
import { TabConfig, TabComponent, TabsConfig } from "./types";
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

export const getTabsElementConfig = (config: TabsConfig) => {
  const elementConfig = {
    tag: "div",
    attributes: {
      role: "tablist",
      "aria-orientation": "horizontal",
    },
    // Filtered, because `class` is optional: an absent one used to arrive here
    // as undefined and was only dropped further down, inside withElement. With
    // the config typed, the ratchet sees it -- and the filter belongs where the
    // array is built rather than one layer away.
    className: [
      `${config.prefix}-tabs`,
      `${config.prefix}-tabs--${config.variant || "primary"}`,
      config.class,
    ].filter((name): name is string => Boolean(name)),
  };

  // Generic in the component, because this sits mid-pipe: a fixed parameter
  // type here collapses everything withEvents put on before it.
  return <C extends BaseComponent>(component: C): C & ElementComponent =>
    withElement(elementConfig)(component);
};

/**
 * What getTabApiConfig reads off a tab. The three members are TabComponent's
 * own, optional there because a tab is assembled in steps; by the time an API
 * config is built they are present, so this requires the two it calls through.
 *
 * A Pick is safe here only because none of these members return `this` -- an
 * indexed access would bind it to TabComponent and lose the polymorphism.
 */
type TabApiHost = Required<Pick<TabComponent, "disabled" | "lifecycle">> &
  Pick<TabComponent, "button">;

/**
 * Creates API configuration for the Tab component
 * @param {TabApiHost} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object
 */
export const getTabApiConfig = (comp: TabApiHost) => ({
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
