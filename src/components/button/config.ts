// src/components/button/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component';
import { ButtonConfig } from './types';
import { BUTTON_VARIANTS, BUTTON_TYPES, DEFAULT_RIPPLE_CONFIG, BUTTON_SIZES } from './constants';

/**
 * Default configuration for the Button component.
 * These values will be used when not explicitly specified by the user.
 * 
 * @category Components
 */
export const defaultConfig: ButtonConfig = {
  variant: BUTTON_VARIANTS.FILLED,
  size: BUTTON_SIZES.S,
  disabled: false,
  type: BUTTON_TYPES.BUTTON,
  ripple: true,  // Explicitly enable ripple effects by default
  rippleConfig: {
    duration: DEFAULT_RIPPLE_CONFIG.DURATION,
    timing: DEFAULT_RIPPLE_CONFIG.TIMING,
    opacity: DEFAULT_RIPPLE_CONFIG.OPACITY as [string, string]
  }
};

/**
 * Creates the base configuration for Button component by merging user-provided
 * config with default values.
 * 
 * @param {ButtonConfig} config - User provided configuration
 * @returns {ButtonConfig} Complete configuration with defaults applied
 * @category Components
 * @internal
 */
export const createBaseConfig = (config: ButtonConfig = {}): ButtonConfig => 
  createComponentConfig(defaultConfig, config, 'button') as ButtonConfig;

/**
 * Generates element configuration for the Button component.
 * This function creates the necessary attributes and configuration
 * for the DOM element creation process.
 * 
 * @param {ButtonConfig} config - Button configuration
 * @returns {Object} Element configuration object for withElement
 * @category Components
 * @internal
 */
export const getElementConfig = (config: ButtonConfig) => {
  // Create the attributes object
  const attributes: Record<string, any> = {
    type: config.type || 'button'
  };
  
  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attributes.disabled = true;
  }
  
  // Add value attribute only if it exists
  if (config.value !== undefined) {
    attributes.value = config.value;
  }
  
  // Add aria-label attribute for accessibility
  if (config.ariaLabel) {
    attributes['aria-label'] = config.ariaLabel;
  }
  
  return createElementConfig(config, {
    tag: 'button',
    attributes,
    className: config.class,
    forwardEvents: {
      click: (component: any, event: Event) => !component.element.disabled,
      focus: true,
      blur: true
    }
  });
};

/**
 * Creates API configuration for the Button component.
 * This connects the core component features (like disabled state)
 * to the public API methods exposed to users.
 * 
 * @param {Object} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object
 * @category Components
 * @internal
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