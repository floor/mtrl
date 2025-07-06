// src/components/chips/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { ChipsConfig } from "./types";

/**
 * Default configuration for the Chips component
 */
export const defaultConfig: ChipsConfig = {
  chips: [],
  scrollable: false,
  vertical: false,
  multiSelect: false,
  onChange: null,
  selector: null,
  labelPosition: "start",
};

/**
 * Creates the base configuration for Chips component
 * @param {ChipsConfig} config - User provided configuration
 * @returns {ChipsConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: ChipsConfig = {}): ChipsConfig => {
  // Create the base config with defaults applied
  const baseConfig = createComponentConfig(
    defaultConfig,
    config,
    "chips"
  ) as ChipsConfig;

  return baseConfig;
};

/**
 * Generates element configuration for the Chips component
 * @param {ChipsConfig} config - Chips configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ChipsConfig) => {
  // Set default values
  const scrollable = config.scrollable === true;
  const vertical = config.vertical === true;
  const isMultiSelect = config.multiSelect === true;
  const hasLabel = config.label && config.label.trim().length > 0;
  const labelPosition = config.labelPosition || "start";

  const classes = [
    "chips",
    config.class,
    scrollable ? "chips--scrollable" : "",
    vertical ? "chips--vertical" : "",
    hasLabel ? "chips--with-label" : "",
    hasLabel && labelPosition === "end" ? "chips--label-end" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return createElementConfig(config, {
    tag: "div",
    attributes: {
      role: "group",
      "aria-multiselectable": isMultiSelect ? "true" : "false",
    },
    className: classes,
  });
};

/**
 * Creates API configuration for the Chips component
 * @param {Object} comp - Component with chips features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  chips: {
    addChip: function (chipConfig) {
      if (comp.chips && typeof comp.chips.addChip === "function") {
        return comp.chips.addChip(chipConfig);
      }
      return null;
    },
    removeChip: (chipOrIndex) => comp.chips?.removeChip?.(chipOrIndex),
    getChips: () => comp.chips?.getChips?.() ?? [],
    getSelectedChips: () => comp.chips?.getSelectedChips?.() ?? [],
    getSelectedValues: () => comp.chips?.getSelectedValues?.() ?? [],
    selectByValue: (values) => comp.chips?.selectByValue?.(values),
    clearSelection: () => comp.chips?.clearSelection?.(),
    scrollToChip: (chipOrIndex) => comp.chips?.scrollToChip?.(chipOrIndex),
  },
  layout: {
    setScrollable: (isScrollable) => comp.layout?.setScrollable?.(isScrollable),
    isScrollable: () => comp.layout?.isScrollable?.() ?? false,
    setVertical: (isVertical) => comp.layout?.setVertical?.(isVertical),
    isVertical: () => comp.layout?.isVertical?.() ?? false,
  },
  label: {
    setText: (t) => comp.label?.setText?.(t),
    getText: () => comp.label?.getText?.() ?? "",
    setPosition: (p) => comp.label?.setPosition?.(p),
    getPosition: () => comp.label?.getPosition?.() ?? "start",
  },
  keyboard: {
    enableKeyboardNavigation: () => comp.keyboard?.enable?.(),
    disableKeyboardNavigation: () => comp.keyboard?.disable?.(),
  },
  events: {
    on: (e, h) => comp.on?.(e, h),
    off: (e, h) => comp.off?.(e, h),
  },
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.(),
  },
});
