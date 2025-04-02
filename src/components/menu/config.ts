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
 * 
 * Defines the standard behavior and initial state for menus.
 * These defaults are merged with user-provided configuration options.
 * 
 * @internal
 * @category Components
 */
export const defaultConfig: MenuConfig = {
  /** Empty initial items array */
  items: [],
  
  /** By default, menus close when an item is selected */
  stayOpenOnSelect: false
};

/**
 * Creates the base configuration for Menu component
 * 
 * Merges user-provided configuration with default values
 * to ensure all required properties are available.
 * 
 * @param {MenuConfig} config - User provided configuration
 * @returns {MenuConfig} Complete configuration with defaults applied
 * @internal
 * @category Components
 */
export const createBaseConfig = (config: MenuConfig = {}): MenuConfig => 
  createComponentConfig(defaultConfig, config, 'menu') as MenuConfig;

/**
 * Generates element configuration for the Menu component
 * 
 * Creates the configuration needed for the DOM element creation.
 * Sets up proper accessibility attributes like ARIA roles and states.
 * 
 * @param {MenuConfig} config - Menu configuration
 * @returns {Object} Element configuration object for withElement
 * @internal
 * @category Components
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
 * 
 * Builds the configuration needed for the withAPI feature,
 * including lifecycle methods for proper resource cleanup.
 * 
 * @param {BaseComponent} comp - Component with lifecycle feature
 * @returns {ApiOptions} API configuration object
 * @internal
 * @category Components
 */
export const getApiConfig = (comp: BaseComponent): ApiOptions => ({
  lifecycle: {
    destroy: comp.lifecycle?.destroy || (() => {})
  }
});

export default defaultConfig;