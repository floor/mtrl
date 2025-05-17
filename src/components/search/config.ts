// src/components/search/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component';
import { SearchConfig } from './types';
import { 
  SEARCH_VARIANTS, 
  SEARCH_DEFAULTS, 
  SEARCH_ICONS 
} from './constants';

/**
 * Default configuration for the Search component
 */
export const defaultConfig: SearchConfig = {
  variant: SEARCH_VARIANTS.BAR,
  disabled: false,
  placeholder: SEARCH_DEFAULTS.PLACEHOLDER,
  value: SEARCH_DEFAULTS.VALUE,
  leadingIcon: SEARCH_ICONS.SEARCH,
  showClearButton: SEARCH_DEFAULTS.SHOW_CLEAR_BUTTON,
  minWidth: SEARCH_DEFAULTS.MIN_WIDTH,
  maxWidth: SEARCH_DEFAULTS.MAX_WIDTH,
  fullWidth: SEARCH_DEFAULTS.FULL_WIDTH,
  showDividers: SEARCH_DEFAULTS.SHOW_DIVIDERS
};

/**
 * Creates the base configuration for Search component
 * @param {SearchConfig} config - User provided configuration
 * @returns {SearchConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SearchConfig = {}): SearchConfig => 
  createComponentConfig(defaultConfig, config, 'search') as SearchConfig;

/**
 * Generates element configuration for the Search component
 * @param {SearchConfig} config - Search configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: SearchConfig) => 
  createElementConfig(config, {
    tag: 'div',
    attributes: {
      role: 'search',
      'aria-disabled': config.disabled === true ? 'true' : 'false'
    },
    className: config.class
  });

/**
 * Creates API configuration for the Search component
 * @param {Object} comp - Component with search features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  search: {
    setValue: (v, t) => comp.search?.setValue(v, t),
    getValue: () => comp.search?.getValue() ?? '',
    setPlaceholder: (p) => comp.search?.setPlaceholder(p),
    getPlaceholder: () => comp.search?.getPlaceholder() ?? '',
    focus: () => comp.search?.focus(),
    blur: () => comp.search?.blur(),
    expand: () => comp.search?.expand(),
    collapse: () => comp.search?.collapse(),
    clear: () => comp.search?.clear(),
    submit: () => comp.search?.submit(),
    setSuggestions: (s) => comp.search?.setSuggestions(s),
    showSuggestions: (s) => comp.search?.showSuggestions(s)
  },
  disabled: {
    enable: () => comp.disabled?.enable?.(),
    disable: () => comp.disabled?.disable?.(),
    isDisabled: () => comp.disabled?.isDisabled?.() ?? false
  },
  appearance: {
    setColor: (c) => comp.appearance?.setColor?.(c),
    getColor: () => comp.appearance?.getColor?.() ?? '',
    setSize: (s) => comp.appearance?.setSize?.(s),
    getSize: () => comp.appearance?.getSize?.() ?? ''
  },
  icons: {
    setLeadingIcon: (i) => comp.icons?.setLeadingIcon?.(i),
    setTrailingIcon: (i) => comp.icons?.setTrailingIcon?.(i),
    setTrailingIcon2: (i) => comp.icons?.setTrailingIcon2?.(i),
    setAvatar: (a) => comp.icons?.setAvatar?.(a),
    showClearButton: (s) => comp.icons?.showClearButton?.(s)
  },
  events: {
    on: (e, h) => comp.on?.(e, h),
    off: (e, h) => comp.off?.(e, h)
  },
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.()
  }
});