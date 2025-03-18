// src/components/search/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { SearchConfig } from './types';

/**
 * Default configuration for the Search component
 */
export const defaultConfig: SearchConfig = {
  variant: 'bar',
  disabled: false,
  placeholder: 'Search',
  value: '',
  leadingIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  showClearButton: true,
  minWidth: 360,
  maxWidth: 720,
  fullWidth: false,
  showDividers: true
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
    attrs: {
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