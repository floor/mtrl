// src/components/extended-fab/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { ExtendedFabConfig } from './types';
import { FAB_VARIANTS, EXTENDED_FAB_WIDTH } from './constants';

/**
 * Default configuration for the Extended FAB component
 */
export const defaultConfig: ExtendedFabConfig = {
  variant: FAB_VARIANTS.PRIMARY,
  type: 'button',
  ripple: true,
  iconPosition: 'start',
  width: 'fixed'
};

/**
 * Creates the base configuration for Extended FAB component
 * @param {ExtendedFabConfig} config - User provided configuration
 * @returns {ExtendedFabConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: ExtendedFabConfig = {}): ExtendedFabConfig => 
  createComponentConfig(defaultConfig, config, 'extended-fab') as ExtendedFabConfig;

/**
 * Generates element configuration for the Extended FAB component
 * @param {ExtendedFabConfig} config - Extended FAB configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ExtendedFabConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {
    type: config.type || 'button',
    'aria-label': config.ariaLabel || config.text || (config.icon ? 'action' : undefined)
  };
  
  // Build class list
  let classNames = [`${config.prefix}-extended-fab`];
  
  // Add width class
  if (config.width) {
    classNames.push(`${config.prefix}-extended-fab--${config.width}`);
  }
  
  // Add animation class if specified
  if (config.animate) {
    classNames.push(`${config.prefix}-extended-fab--animate-enter`);
  }
  
  // Add position class if specified
  if (config.position) {
    classNames.push(`${config.prefix}-extended-fab--${config.position}`);
  }
  
  // Add collapse-on-scroll class if specified
  if (config.collapseOnScroll) {
    classNames.push(`${config.prefix}-extended-fab--collapsible`);
  }
  
  // Add user classes
  if (config.class) {
    classNames.push(config.class);
  }
  
  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attrs.disabled = true;
    classNames.push(`${config.prefix}-extended-fab--disabled`);
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
 * Creates API configuration for the Extended FAB component
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
  className: comp.getClass('extended-fab'),
  text: {
    setText: (text: string) => comp.text.setText(text),
    getText: () => comp.text.getText()
  }
});

export default defaultConfig;