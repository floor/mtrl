// src/components/list/config.ts

import {
  createComponentConfig,
  createElementConfig as coreCreateElementConfig,
} from "../../core/config/component";
import { LIST_CLASSES } from "./constants";
import { ListConfig } from "./types";

/**
 * Default configuration for the List component
 */
export const defaultConfig: Partial<ListConfig> = {
  // Static data
  items: [],

  // Behavior settings
  trackSelection: true,
  multiSelect: false,
  animate: false,
};

/**
 * Creates the base configuration for List component
 * @param {ListConfig} config - User provided configuration
 * @returns {Object} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: Partial<ListConfig> = {}) => {
  // Validate required props
  if (!Array.isArray(config.items) && !config.renderItem) {
    throw new Error("List requires either items array or renderItem function");
  }

  // If items are provided but no renderItem, create a default renderer
  if (
    Array.isArray(config.items) &&
    config.items.length > 0 &&
    !config.renderItem
  ) {
    config.renderItem = (item) => {
      const element = document.createElement("div");
      element.className = "mtrl-list-item";
      element.textContent =
        item.text ||
        item.title ||
        item.headline ||
        item.name ||
        item.id ||
        String(item);
      return element;
    };
  }

  // Create component config with defaults
  return createComponentConfig(defaultConfig, config, "list");
};

/**
 * Generates element configuration for the List component
 * @param {Object} config - List configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config) => {
  const attributes = {
    role: "list",
    tabindex: "0",
  };

  // Add ARIA attributes for accessibility
  if (config.ariaLabel) {
    attributes["aria-label"] = config.ariaLabel;
  }

  // Create element config
  return coreCreateElementConfig(config, {
    tag: "div",
    attributes: attributes,
    className: [LIST_CLASSES.CONTAINER, config.class],
    forwardEvents: {
      scroll: true,
      keydown: true,
    },
  });
};

/**
 * Creates API configuration for the List component
 * @param {Object} component - Component with list features
 * @param {Object} config - Base configuration
 * @returns {Object} API configuration object
 */
export const getApiConfig = (component, config) => ({
  list: {
    refresh: component.list?.refresh,
    getItems: component.list?.getItems,
    getAllItems: component.list?.getAllItems,
    getVisibleItems: component.list?.getVisibleItems,
    scrollToItem: component.list?.scrollToItem,
    scrollToIndex: component.list?.scrollToIndex,
    isLoading: () => false, // Simple lists are never loading
    hasNextPage: () => false, // Simple lists don't paginate
  },
  selection: {
    getSelectedItems: component.getSelectedItems,
    getSelectedItemIds: component.getSelectedItemIds,
    isItemSelected: component.isItemSelected,
    selectItem: component.selectItem,
    deselectItem: component.deselectItem,
    clearSelection: component.clearSelection,
    setSelection: component.setSelection,
  },
  events: {
    on: component.on,
    off: component.off,
  },
  lifecycle: {
    destroy: component.lifecycle?.destroy,
  },
  config: {
    animate: config?.animate,
  },
});

export default defaultConfig;
