// src/components/list/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { ListConfig, BaseComponent } from './types';

/**
 * Default configuration for the List component
 */
export const defaultConfig: ListConfig = {
  type: 'default',
  layout: 'horizontal',
  items: []
};

/**
 * Creates the base configuration for List component
 * @param {ListConfig} config - User provided configuration
 * @returns {ListConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: ListConfig = {}): ListConfig => 
  createComponentConfig(defaultConfig, config, 'list') as ListConfig;

/**
 * Generates element configuration for the List component
 * @param {ListConfig} config - List configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ListConfig) => 
  createElementConfig(config, {
    tag: 'div',
    role: config.type === 'default' ? 'list' : 'listbox',
    attrs: {
      'aria-multiselectable': config.type === 'multi' ? 'true' : undefined
    },
    componentName: 'list',
    className: config.class
  });

export default defaultConfig;