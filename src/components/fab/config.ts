// src/components/fab/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { FabConfig } from './types';

/**
 * Default configuration for the FAB component
 * 
 * Provides reasonable defaults for creating FABs
 * according to Material Design 3 guidelines.
 * 
 * @category Components
 * @internal
 */
export const defaultConfig: FabConfig = {
  variant: 'primary',
  size: 'default',
  type: 'button',
  ripple: true
};

/**
 * Creates the base configuration for FAB component
 * 
 * Merges user-provided configuration with default values and validates
 * the configuration to ensure all required properties have values.
 * 
 * @param {FabConfig} config - User provided configuration
 * @returns {FabConfig} Complete configuration with defaults applied
 * 
 * @category Components
 * @internal
 */
export const createBaseConfig = (config: FabConfig = {}): FabConfig => 
  createComponentConfig(defaultConfig, config, 'fab') as FabConfig;

/**
 * Generates element configuration for the FAB component
 * 
 * Transforms the user-friendly FabConfig into the internal format required
 * by the withElement function. Creates all the appropriate CSS classes and attributes
 * needed to properly render the FAB in the DOM.
 * 
 * @param {FabConfig} config - FAB configuration
 * @returns {Object} Element configuration object for withElement
 * 
 * @category Components
 * @internal
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
 * 
 * Provides access to various component sub-features like disabled state
 * and lifecycle management.
 * 
 * @param {Object} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object for withAPI
 * 
 * @category Components
 * @internal
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