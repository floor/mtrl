// src/components/select/config.ts

import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { SelectConfig, BaseComponent, ApiOptions } from './types';

/**
 * Default configuration for the Select component
 */
export const defaultConfig: SelectConfig = {
  options: [],
  variant: 'filled',
  placement: 'bottom-start'
};

/**
 * Creates the base configuration for Select component
 * @param {SelectConfig} config - User provided configuration
 * @returns {SelectConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SelectConfig = {}): SelectConfig => 
  createComponentConfig(defaultConfig, config, 'select') as SelectConfig;

/**
 * Creates API configuration for the Select component
 * @param {BaseComponent} comp - Component with select features
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: BaseComponent): ApiOptions => ({
  select: {
    getValue: comp.select?.getValue || (() => null),
    setValue: comp.select?.setValue || (() => comp),
    getText: comp.select?.getText || (() => ''),
    getSelectedOption: comp.select?.getSelectedOption || (() => null),
    getOptions: comp.select?.getOptions || (() => []),
    setOptions: comp.select?.setOptions || (() => comp),
    open: comp.select?.open || (() => comp),
    close: comp.select?.close || (() => comp),
    isOpen: comp.select?.isOpen || (() => false)
  },
  events: {
    on: comp.on || (() => comp),
    off: comp.off || (() => comp)
  },
  disabled: {
    enable: () => {
      if (comp.textfield?.enable) {
        comp.textfield.enable();
      }
      return comp;
    },
    disable: () => {
      if (comp.textfield?.disable) {
        comp.textfield.disable();
      }
      return comp;
    }
  },
  lifecycle: {
    destroy: () => {
      if (comp.textfield?.destroy) {
        comp.textfield.destroy();
      }
      if (comp.menu?.destroy) {
        comp.menu.destroy();
      }
      if (comp.lifecycle?.destroy) {
        comp.lifecycle.destroy();
      }
    }
  }
});

export default defaultConfig;