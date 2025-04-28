// src/components/snackbar/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { SnackbarConfig, BaseComponent, ApiOptions } from './types';
import { SNACKBAR_VARIANTS, SNACKBAR_POSITIONS, SNACKBAR_DEFAULTS } from './constants';

/**
 * Default configuration for the Snackbar component
 */
export const defaultConfig: SnackbarConfig = {
  variant: SNACKBAR_DEFAULTS.VARIANT,
  position: SNACKBAR_DEFAULTS.POSITION,
  duration: SNACKBAR_DEFAULTS.DURATION
};

/**
 * Creates the base configuration for Snackbar component
 * @param {SnackbarConfig} config - User provided configuration
 * @returns {SnackbarConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SnackbarConfig): SnackbarConfig => 
  createComponentConfig(defaultConfig, config, 'snackbar') as SnackbarConfig;

/**
 * Generates element configuration for the Snackbar component
 * @param {SnackbarConfig} config - Snackbar configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: SnackbarConfig) => 
  createElementConfig(config, {
    tag: 'div',
    componentName: 'snackbar',
    className: config.class
  });

/**
 * Creates text configuration for the Snackbar component
 * @param {SnackbarConfig} config - Snackbar configuration
 * @returns {Object} Text configuration object
 */
export const getTextConfig = (config: SnackbarConfig) => ({
  ...config,
  text: config.message
});

/**
 * Creates API configuration for the Snackbar component
 * @param {BaseComponent} comp - Component with lifecycle feature
 * @param {SnackbarQueue} queue - Snackbar queue manager
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: BaseComponent, queue: any): ApiOptions => ({
  lifecycle: {
    destroy: comp.lifecycle?.destroy || (() => {})
  },
  queue
});

export default defaultConfig;