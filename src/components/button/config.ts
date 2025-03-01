// src/components/button/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { ButtonConfig } from './types';
import { BUTTON_VARIANTS } from './constants';

/**
 * Default configuration for the Button component
 */
export const defaultConfig: ButtonConfig = {
  variant: BUTTON_VARIANTS.FILLED,
  type: 'button'
  // Don't set disabled: false as default - it should be undefined by default
};

/**
 * Creates the base configuration for Button component
 * @param {ButtonConfig} config - User provided configuration
 * @returns {ButtonConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: ButtonConfig = {}): ButtonConfig => 
  createComponentConfig(defaultConfig, config, 'button') as ButtonConfig;

/**
 * Generates element configuration for the Button component
 * @param {ButtonConfig} config - Button configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ButtonConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {
    type: config.type || 'button'
  };
  
  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attrs.disabled = true;
  }
  
  // Add value attribute only if it exists
  if (config.value !== undefined) {
    attrs.value = config.value;
  }
  
  return createElementConfig(config, {
    tag: 'button',
    attrs,
    className: config.class,
    forwardEvents: {
      click: (component) => !component.element.disabled,
      focus: true,
      blur: true
    }
  });
};

/**
 * Creates API configuration for the Button component
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