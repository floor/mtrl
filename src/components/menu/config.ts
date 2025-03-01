// src/components/menu/config.ts
import { PREFIX } from '../../core/config';
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { MenuConfig, BaseComponent, ApiOptions } from './types';

/**
 * Default configuration for the Menu component
 */
export const defaultConfig: MenuConfig = {
  items: [],
  stayOpenOnSelect: false
};

/**
 * Creates the base configuration for Menu component
 * @param {MenuConfig} config - User provided configuration
 * @returns {MenuConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: MenuConfig = {}): MenuConfig => 
  createComponentConfig(defaultConfig, config, 'menu') as MenuConfig;

/**
 * Generates element configuration for the Menu component
 * @param {MenuConfig} config - Menu configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: MenuConfig) => 
  createElementConfig(config, {
    tag: 'div',
    componentName: 'menu',
    attrs: {
      role: 'menu',
      tabindex: '-1',
      'aria-hidden': 'true'
    },
    className: config.class
  });

/**
 * Creates API configuration for the Menu component
 * @param {BaseComponent} comp - Component with lifecycle feature
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: BaseComponent): ApiOptions => ({
  lifecycle: {
    destroy: comp.lifecycle?.destroy || (() => {})
  }
});

export default defaultConfig;