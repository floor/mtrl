// src/components/navigation/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { NavigationConfig, BaseComponent, ApiOptions } from './types';

/**
 * Default configuration for the Navigation component
 */
export const defaultConfig: NavigationConfig = {
  variant: 'rail',
  position: 'left',
  behavior: 'fixed',
  items: [],
  showLabels: true,
  scrimEnabled: false
};

/**
 * Creates the base configuration for Navigation component
 * @param {NavigationConfig} config - User provided configuration
 * @returns {NavigationConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: NavigationConfig = {}): NavigationConfig => 
  createComponentConfig(defaultConfig, config, 'nav') as NavigationConfig;

/**
 * Generates element configuration for the Navigation component
 * @param {NavigationConfig} config - Navigation configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: NavigationConfig) => {
  // Build class list - start with the variant class
  const variantClass = config.variant ? `${config.prefix}-nav--${config.variant}` : '';
  
  // Add position class if specified
  const positionClass = config.position ? `${config.prefix}-nav--${config.position}` : '';
  
  // Add user-provided classes
  const userClass = config.class || '';
  
  // Combine all classes
  const classNames = [variantClass, positionClass, userClass].filter(Boolean);
  
  return createElementConfig(config, {
    tag: 'nav',
    componentName: 'nav',
    attrs: {
      role: 'navigation',
      'aria-label': config.ariaLabel || 'Main Navigation'
    },
    className: classNames
  });
};

/**
 * Creates API configuration for the Navigation component
 * @param {BaseComponent} comp - Component with disabled and lifecycle features
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: BaseComponent): ApiOptions => ({
  disabled: {
    enable: comp.disabled?.enable || (() => {}),
    disable: comp.disabled?.disable || (() => {})
  },
  lifecycle: {
    destroy: comp.lifecycle?.destroy || (() => {})
  }
});

export default defaultConfig;