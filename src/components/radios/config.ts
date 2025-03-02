// src/components/radios/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { RadiosConfig } from './types';
import { RADIO_DIRECTIONS, RADIO_SIZES } from './constants';

/**
 * Default configuration for the Radios component
 */
export const defaultConfig: RadiosConfig = {
  name: '',
  direction: RADIO_DIRECTIONS.VERTICAL,
  size: RADIO_SIZES.MEDIUM,
  disabled: false,
  ripple: true,
  options: []
};

/**
 * Creates the base configuration for Radios component
 * @param {RadiosConfig} config - User provided configuration
 * @returns {RadiosConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: RadiosConfig): RadiosConfig => 
  createComponentConfig(defaultConfig, config, 'radios') as RadiosConfig;

/**
 * Generates element configuration for the Radios container
 * @param {RadiosConfig} config - Radios configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: RadiosConfig) => {
  return createElementConfig(config, {
    tag: 'div',
    attrs: {
      role: 'radiogroup'
    },
    className: config.class
  });
};

/**
 * Creates API configuration for the Radios component
 * @param {Object} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp) => ({
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable()
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  }
});

export default defaultConfig;