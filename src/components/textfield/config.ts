// src/components/textfield/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component';
import { TextfieldConfig, BaseComponent, ApiOptions } from './types';
import { TEXTFIELD_DEFAULTS, TEXTFIELD_TYPES, TEXTFIELD_VARIANTS } from './constants';

/**
 * Default configuration for the Textfield component
 */
export const defaultConfig: TextfieldConfig = {
  type: TEXTFIELD_DEFAULTS.TYPE,
  variant: TEXTFIELD_DEFAULTS.VARIANT
};

/**
 * Creates the base configuration for Textfield component
 * @param {TextfieldConfig} config - User provided configuration
 * @returns {TextfieldConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: TextfieldConfig = {}): TextfieldConfig => 
  createComponentConfig(defaultConfig, config, 'textfield') as TextfieldConfig;

/**
 * Generates element configuration for the Textfield component
 * @param {TextfieldConfig} config - Textfield configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: TextfieldConfig) => 
  createElementConfig(config, {
    tag: 'div',
    className: config.class
  });

/**
 * Creates API configuration for the Textfield component
 * @param {BaseComponent} comp - Component with disabled and lifecycle features
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: BaseComponent): ApiOptions => ({
  disabled: {
    enable: comp.disabled?.enable,
    disable: comp.disabled?.disable
  },
  lifecycle: {
    destroy: comp.lifecycle?.destroy
  }
});

export default defaultConfig;