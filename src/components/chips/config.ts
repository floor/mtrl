// src/components/chips/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { ChipsConfig } from "./types";
import type { ApiOptions } from "./api";

/**
 * Default configuration for the Chips component
 */
export const defaultConfig: ChipsConfig = {
  chips: [],
  scrollable: false,
  vertical: false,
  multiSelect: false,
  onChange: undefined,
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
    "chips",
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
 * @param {ChipsConfig} config - Chips configuration
 * @returns {Object} API configuration object
 */
/**
 * What getApiConfig reads off the chips component.
 *
 * Every key is a sub-object one of the features installs. They are optional
 * for the reason the forwarding below uses `?.`: this is written to tolerate a
 * feature that did not install.
 */
interface ChipsApiHost {
  chips?: Partial<ApiOptions["chips"]>;
  layout?: Partial<ApiOptions["layout"]>;
  /**
   * Two different things share this name, which is why it is a union.
   *
   * withDom puts the label *element* here. withChipsLabel would put a label
   * *API* here — setText, getText, setPosition — but it is never applied to
   * the pipe, which is FLO-231. So today the `?.` chains below always miss and
   * the label block of the API config is inert. The union says that rather
   * than hiding it behind a type that describes only the half that is absent.
   */
  label?: HTMLElement | Partial<ApiOptions["label"]>;
  // The feature calls these enable and disable; ApiOptions calls them
  // enableKeyboardNavigation and disableKeyboardNavigation, and this function
  // is the bridge. Named from the producer.
  keyboard?: { enable?: () => void; disable?: () => void };
  on?: (event: string, handler: Function) => unknown;
  off?: (event: string, handler: Function) => unknown;
  lifecycle?: { destroy?: () => void };
}

/**
 * The label API, if there is one. See the note on ChipsApiHost's `label`:
 * today there never is, because withChipsLabel is not in the pipe (FLO-231).
 * A structural check rather than `instanceof HTMLElement`, so this needs no
 * DOM global.
 */
const labelApi = (
  label: ChipsApiHost["label"],
): Partial<ApiOptions["label"]> | undefined =>
  label && "setText" in label ? label : undefined;

export const getApiConfig = (
  comp: ChipsApiHost,
  config?: ChipsConfig,
): ApiOptions => ({
  config: {
    multiSelect: config?.multiSelect ?? false,
  },
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
    setText: (t) => labelApi(comp.label)?.setText?.(t),
    getText: () => labelApi(comp.label)?.getText?.() ?? "",
    setPosition: (p) => labelApi(comp.label)?.setPosition?.(p),
    getPosition: () => labelApi(comp.label)?.getPosition?.() ?? "start",
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
