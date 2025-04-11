// src/components/menu/config.ts
import { PREFIX } from '../../core/config';
import { createComponentConfig, createElementConfig } from '../../core/config/component-config';
import { MenuConfig, BaseComponent, ApiOptions } from './types';

/**
 * Default configuration for the Menu component
 * @internal
 */
export const defaultConfig: MenuConfig = {
  items: [],
  stayOpenOnSelect: false,
  prefix: PREFIX
};

/**
 * Creates the base configuration for the Menu component
 * 
 * @param {MenuConfig} config - User provided configuration
 * @returns {MenuConfig} Complete configuration with defaults applied
 * @internal
 */
export const createBaseConfig = (config: MenuConfig = {}): MenuConfig => 
  createComponentConfig(defaultConfig, config, 'menu') as MenuConfig;

/**
 * Generates element configuration for the Menu component
 * 
 * @param {MenuConfig} config - Menu configuration
 * @returns {Object} Element configuration object
 * @internal
 */
export const getElementConfig = (config: MenuConfig) => 
  createElementConfig(config, {
    tag: 'div',
    attrs: {
      role: 'menu',
      tabindex: '-1',
      'aria-hidden': 'true'
    },
    className: [
      'menu',
      config.class,
      // Add submenu class if it's a submenu
      config.parentItem ? 'menu--submenu' : null
    ]
  });

/**
 * Creates API configuration for the Menu component
 * 
 * @param {BaseComponent} comp - Component with features
 * @returns {ApiOptions} API configuration object
 * @internal
 */
export const getApiConfig = (comp: BaseComponent): ApiOptions => ({
  lifecycle: {
    destroy: comp.lifecycle?.destroy || (() => {})
  }
});

export default defaultConfig;