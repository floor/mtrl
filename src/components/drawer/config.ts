// src/components/drawer/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { DrawerConfig } from "./types";
import { DRAWER_DEFAULTS } from "./constants";

/**
 * Default configuration for the Drawer component.
 * These values will be used when not explicitly specified by the user.
 *
 * @category Components
 */
export const defaultConfig: DrawerConfig = {
  variant: DRAWER_DEFAULTS.VARIANT,
  position: DRAWER_DEFAULTS.POSITION,
  open: DRAWER_DEFAULTS.OPEN,
  dismissible: DRAWER_DEFAULTS.DISMISSIBLE,
  width: DRAWER_DEFAULTS.WIDTH,
  items: [],
};

/**
 * Creates the base configuration for the Drawer component by merging
 * user-provided config with default values. Global configuration is
 * automatically applied by createComponentConfig.
 *
 * @param {DrawerConfig} config - User provided configuration
 * @returns {DrawerConfig} Complete configuration with defaults applied
 * @category Components
 * @internal
 */
export const createBaseConfig = (config: DrawerConfig = {}): DrawerConfig =>
  createComponentConfig(defaultConfig, config, "drawer") as DrawerConfig;

/**
 * Generates element configuration for the Drawer component.
 * This function creates the necessary attributes and configuration
 * for the DOM element creation process.
 *
 * @param {DrawerConfig} config - Drawer configuration
 * @returns {Object} Element configuration object for withElement
 * @category Components
 * @internal
 */
export const getElementConfig = (config: DrawerConfig) => {
  const isModal = config.variant === "modal";

  const attributes: Record<string, string | boolean | undefined> = {};

  // Modal drawers are dialogs; standard drawers are navigation landmarks
  if (isModal) {
    attributes.role = "dialog";
    attributes["aria-modal"] = "true";
  } else {
    attributes.role = "navigation";
  }

  if (config.ariaLabel) {
    attributes["aria-label"] = config.ariaLabel;
  }

  return createElementConfig(config, {
    tag: "aside",
    attributes,
    className: [
      config.dense ? `${config.prefix}-drawer--dense` : null,
      config.class,
    ].filter(Boolean),
    forwardEvents: {
      click: true,
      keydown: true,
    },
  });
};

/**
 * Creates API configuration for the Drawer component.
 * This connects the core component features (state, items, headline)
 * to the public API methods exposed to users.
 *
 * @param {Object} comp - Component with all features applied
 * @returns {Object} API configuration object
 * @category Components
 * @internal
 */
export const getApiConfig = (comp: {
  drawerState: {
    open: () => void;
    close: () => void;
    toggle: () => void;
    isOpen: () => boolean;
  };
  drawerItems: {
    setActive: (id: string) => void;
    getActive: () => string | null;
    setItems: (items: DrawerConfig["items"]) => void;
    getItems: () => DrawerConfig["items"];
    setBadge: (id: string, badge: string) => void;
  };
  drawerHeadline: {
    setHeadline: (text: string) => void;
    getHeadline: () => string;
  };
  lifecycle: {
    destroy: () => void;
  };
  _stateCleanup?: () => void;
}) => ({
  state: {
    open: () => comp.drawerState.open(),
    close: () => comp.drawerState.close(),
    toggle: () => comp.drawerState.toggle(),
    isOpen: () => comp.drawerState.isOpen(),
  },
  items: {
    setActive: (id: string) => comp.drawerItems.setActive(id),
    getActive: () => comp.drawerItems.getActive(),
    setItems: (items: DrawerConfig["items"]) =>
      comp.drawerItems.setItems(items || []),
    getItems: () => comp.drawerItems.getItems(),
    setBadge: (id: string, badge: string) =>
      comp.drawerItems.setBadge(id, badge),
  },
  headline: {
    setHeadline: (text: string) => comp.drawerHeadline.setHeadline(text),
    getHeadline: () => comp.drawerHeadline.getHeadline(),
  },
  lifecycle: {
    destroy: () => {
      if (comp._stateCleanup) {
        comp._stateCleanup();
      }
      comp.lifecycle.destroy();
    },
  },
});

export default defaultConfig;
