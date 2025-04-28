// src/components/navigation/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { NavigationConfig, BaseComponent, ApiOptions } from './types';
import { NAV_VARIANTS, NAV_POSITIONS, NAV_BEHAVIORS, NAV_DEFAULTS, NAV_CLASSES } from './constants';

/**
 * Default configuration for the Navigation component
 */
export const defaultConfig: NavigationConfig = {
  variant: NAV_DEFAULTS.VARIANT,
  position: NAV_DEFAULTS.POSITION,
  behavior: NAV_DEFAULTS.BEHAVIOR,
  items: [],
  showLabels: NAV_DEFAULTS.SHOW_LABELS,
  scrimEnabled: NAV_DEFAULTS.SCRIM_ENABLED
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
  const variantClass = config.variant ? `${config.prefix}-${NAV_CLASSES.VARIANT_PREFIX}${config.variant}` : '';
  
  // Add position class if specified
  const positionClass = config.position ? `${config.prefix}-${NAV_CLASSES.POSITION_PREFIX}${config.position}` : '';
  
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