// src/components/search/config.ts

import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import {
  SearchConfig,
  SearchSuggestion,
  SearchState,
  SearchViewMode,
} from "./types";
import {
  SEARCH_STATES,
  SEARCH_VIEW_MODES,
  SEARCH_DEFAULTS,
  SEARCH_MEASUREMENTS,
} from "./constants";

/**
 * Default configuration for the Search component
 * Aligned with MD3 specifications
 */
export const defaultConfig: SearchConfig = {
  // State
  initialState: SEARCH_STATES.BAR,
  viewMode: SEARCH_VIEW_MODES.DOCKED,
  disabled: SEARCH_DEFAULTS.DISABLED,

  // Content
  placeholder: SEARCH_DEFAULTS.PLACEHOLDER,
  value: SEARCH_DEFAULTS.VALUE,
  leadingIcon: undefined, // Uses default search icon
  trailingItems: undefined,
  suggestions: undefined,

  // Behavior
  showClearButton: SEARCH_DEFAULTS.SHOW_CLEAR_BUTTON,
  expandOnFocus: true,
  collapseOnBlur: true,
  collapseDelay: 150,

  // Sizing
  minWidth: SEARCH_MEASUREMENTS.BAR_MIN_WIDTH,
  maxWidth: SEARCH_MEASUREMENTS.BAR_MAX_WIDTH,
  fullWidth: SEARCH_DEFAULTS.FULL_WIDTH,
};

/**
 * Creates the base configuration for Search component
 * Merges user config with defaults
 *
 * @param config User provided configuration
 * @returns Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SearchConfig = {}): SearchConfig =>
  createComponentConfig(defaultConfig, config, "search") as SearchConfig;

/**
 * Generates element configuration for the Search component
 *
 * @param config Search configuration
 * @returns Element configuration object for withElement
 */
export const getElementConfig = (config: SearchConfig) =>
  createElementConfig(config, {
    tag: "div",
    attributes: {
      role: "search",
      "aria-disabled": config.disabled === true ? "true" : "false",
    },
    className: config.class,
  });

/**
 * Internal component interface for API configuration
 */
interface InternalComponent {
  input?: {
    setValue?: (value: string, triggerEvent?: boolean) => void;
    getValue?: () => string;
    setPlaceholder?: (text: string) => void;
    getPlaceholder?: () => string;
    clear?: () => void;
    submit?: () => void;
    focus?: () => void;
    blur?: () => void;
    setSuggestions?: (suggestions: SearchSuggestion[] | string[]) => void;
    getSuggestions?: () => SearchSuggestion[];
    clearSuggestions?: () => void;
  };
  states?: {
    expand?: () => void;
    collapse?: () => void;
    getState?: () => SearchState;
    isExpanded?: () => boolean;
    setViewMode?: (mode: SearchViewMode) => void;
    getViewMode?: () => SearchViewMode;
  };
  disabled?: {
    enable?: () => void;
    disable?: () => void;
    isDisabled?: () => boolean;
  };
  suggestions?: {
    render?: () => void;
  };
  on?: (event: string, handler: Function) => void;
  off?: (event: string, handler: Function) => void;
  lifecycle?: {
    destroy?: () => void;
  };
}

/**
 * Creates API configuration for the Search component
 * Maps internal component methods to public API
 *
 * @param comp Component with search features
 * @returns API configuration object
 */
export const getApiConfig = (comp: InternalComponent) => ({
  // Value management
  value: {
    setValue: (v: string, t?: boolean) => comp.input?.setValue?.(v, t),
    getValue: () => comp.input?.getValue?.() ?? "",
    setPlaceholder: (p: string) => comp.input?.setPlaceholder?.(p),
    getPlaceholder: () => comp.input?.getPlaceholder?.() ?? "",
    clear: () => comp.input?.clear?.(),
    submit: () => comp.input?.submit?.(),
    focus: () => comp.input?.focus?.(),
    blur: () => comp.input?.blur?.(),
  },

  // State management
  state: {
    expand: () => comp.states?.expand?.(),
    collapse: () => comp.states?.collapse?.(),
    getState: () => comp.states?.getState?.() ?? ("bar" as SearchState),
    isExpanded: () => comp.states?.isExpanded?.() ?? false,
    setViewMode: (m: SearchViewMode) => comp.states?.setViewMode?.(m),
    getViewMode: () =>
      comp.states?.getViewMode?.() ?? ("docked" as SearchViewMode),
  },

  // Disabled state
  disabled: {
    enable: () => comp.disabled?.enable?.(),
    disable: () => comp.disabled?.disable?.(),
    isDisabled: () => comp.disabled?.isDisabled?.() ?? false,
  },

  // Suggestions
  suggestions: {
    set: (s: SearchSuggestion[] | string[]) => comp.input?.setSuggestions?.(s),
    get: () => comp.input?.getSuggestions?.() ?? [],
    clear: () => comp.input?.clearSuggestions?.(),
    render: () => comp.suggestions?.render?.(),
  },

  // Events
  events: {
    on: (e: string, h: Function) => comp.on?.(e, h),
    off: (e: string, h: Function) => comp.off?.(e, h),
  },

  // Lifecycle
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.(),
  },
});
