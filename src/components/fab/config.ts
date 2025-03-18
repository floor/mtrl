// src/components/fab/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { FabConfig } from './types';

/**
 * Default configuration for the FAB component
 */
export const defaultConfig: FabConfig = {
  variant: 'primary',
  size: 'default',
  type: 'button',
  ripple: true
};

/**
 * Creates the base configuration for FAB component
 * @param {FabConfig} config - User provided configuration
 * @returns {FabConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: FabConfig = {}): FabConfig => 
  createComponentConfig(defaultConfig, config, 'fab') as FabConfig;

/**
 * Generates element configuration for the FAB component
 * @param {FabConfig} config - FAB configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: FabConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {
    type: config.type || 'button',
    'aria-label': config.ariaLabel || (config.icon ? 'action' : undefined)
  };
  
  // Add size class
  const fabSizeClass = `${config.prefix}-fab--${config.size || 'default'}`;
  let classNames = [fabSizeClass];
  
  // Add animation class if specified
  if (config.animate) {
    classNames.push(`${config.prefix}-fab--animate-enter`);
  }
  
  // Add position class if specified
  if (config.position) {
    classNames.push(`${config.prefix}-fab--${config.position}`);
  }
  
  // Add user classes
  if (config.class) {
    classNames.push(config.class);
  }
  
  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attrs.disabled = true;
    classNames.push(`${config.prefix}-fab--disabled`);
  }
  
  return createElementConfig(config, {
    tag: 'button',
    attrs,
    className: classNames,
    forwardEvents: {
      click: (component) => !component.element.disabled,
      focus: true,
      blur: true
    },
    interactive: true
  });
};

/**
 * Creates API configuration for the FAB component
 * @param {Object} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp: any) => ({
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable()
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  },
  className: comp.getClass('fab')
});

export default defaultConfig;