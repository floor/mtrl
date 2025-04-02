// src/components/list/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { ListConfig, BaseComponent } from './types';

/**
 * Default configuration for the List component
 * 
 * Provides reasonable defaults for creating lists according
 * to Material Design 3 guidelines.
 * 
 * @category Components
 * @internal
 */
export const defaultConfig: ListConfig = {
  type: 'default',
  layout: 'horizontal',
  items: []
};

/**
 * Creates the base configuration for List component
 * 
 * Merges user-provided configuration with default values and ensures
 * all required properties have values.
 * 
 * @param {ListConfig} config - User provided configuration
 * @returns {ListConfig} Complete configuration with defaults applied
 * 
 * @category Components
 * @internal
 */
export const createBaseConfig = (config: ListConfig = {}): ListConfig => 
  createComponentConfig(defaultConfig, config, 'list') as ListConfig;

/**
 * Generates element configuration for the List component
 * 
 * Transforms the user-friendly ListConfig into the internal format required
 * by the withElement function, setting appropriate attributes for accessibility
 * and proper DOM structure.
 * 
 * @param {ListConfig} config - List configuration
 * @returns {Object} Element configuration object for withElement
 * 
 * @category Components
 * @internal
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