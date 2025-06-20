// src/components/list/config.ts

import {
  createComponentConfig,
  createElementConfig as coreCreateElementConfig,
} from "../../core/config/component";
import { LIST_DEFAULTS, LIST_CLASSES } from "./constants";
import { ListConfig } from "./types";

/**
 * Default configuration for the List component
 */
export const defaultConfig = {
  // Collection settings (for API-connected lists)
  collection: LIST_DEFAULTS.COLLECTION,
  transform: (item) => item,
  baseUrl: LIST_DEFAULTS.BASE_URL,

  // Static data (for in-memory lists)
  items: [],

  // Rendering settings
  // itemHeight: 48, // disabled to force itemHeightCalculation
  pageSize: LIST_DEFAULTS.PAGE_SIZE,
  renderBufferSize: LIST_DEFAULTS.RENDER_BUFFER_SIZE,
  renderItem: null,

  // Behavior settings
  trackSelection: true,
  multiSelect: false,
};

/**
 * Creates the base configuration for List component
 * @param {ListConfig} config - User provided configuration
 * @returns {Object} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: Partial<ListConfig> = {}) => {
  // Validate required props
  if (!config.renderItem && !Array.isArray(config.items)) {
    throw new Error(
      "List requires either static items or a renderItem function"
    );
  }

  // If static items are provided but no renderItem, create a default renderer
  if (Array.isArray(config.items) && !config.renderItem) {
    config.renderItem = (item) => {
      const element = document.createElement("div");
      element.className = "mtrl-list-item";
      element.textContent =
        item.text || item.title || item.headline || item.name || item.id;
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
    attributes,
    className: [LIST_CLASSES.CONTAINER, config.class],
    forwardEvents: {
      scroll: true,
      keydown: true,
    },
  });
};

/**
 * Creates API configuration for the List component
 * @param {Object} component - Component with list manager
 * @returns {Object} API configuration object
 */
export const getApiConfig = (component) => ({
  list: {
    refresh: component.list?.refresh,
    loadMore: component.list?.loadMore,
    loadPage: component.list?.loadPage,
    loadPreviousPage: component.list?.loadPreviousPage,
    scrollNext: component.list?.scrollNext,
    scrollPrevious: component.list?.scrollPrevious,
    scrollToItem: component.list?.scrollToItem,
    getVisibleItems: component.list?.getVisibleItems,
    getAllItems: component.list?.getAllItems,
    isLoading: component.list?.isLoading,
    hasNextPage: component.list?.hasNextPage,
  },
  events: {
    on: component.on,
    off: component.off,
  },
  lifecycle: {
    destroy: component.lifecycle?.destroy,
  },
});

export default defaultConfig;
