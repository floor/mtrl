// src/components/chip/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { ChipConfig, BaseComponent } from './types';
import { CHIP_VARIANTS } from './constants';

/**
 * Default configuration for the Chip component
 */
export const defaultConfig: ChipConfig = {
  variant: CHIP_VARIANTS.FILLED,
  ripple: true
};

/**
 * Creates the base configuration for Chip component
 * @param {ChipConfig} config - User provided configuration
 * @returns {ChipConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: ChipConfig = {}): ChipConfig => 
  createComponentConfig(defaultConfig, config, 'chip') as ChipConfig;

/**
 * Generates element configuration for the Chip component
 * @param {ChipConfig} config - Chip configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: ChipConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {
    role: 'button',
    tabindex: '0'
  };
  
  // Only add aria-disabled attribute if needed
  if (config.disabled === true) {
    attrs['aria-disabled'] = 'true';
  }
  
  // Add aria-selected if specified
  if (config.selected === true) {
    attrs['aria-selected'] = 'true';
  } else if (config.selected === false) {
    attrs['aria-selected'] = 'false';
  }

  // Define additional classes
  const className = [
    config.class,
    config.selected ? `${config.prefix}-chip--selected` : null
  ];
  
  return createElementConfig(config, {
    tag: 'div',
    attrs,
    className,
    forwardEvents: {
      click: (component: BaseComponent) => component.element.getAttribute('aria-disabled') !== 'true',
      keydown: (component: BaseComponent, event: KeyboardEvent) => {
        // Handle space and enter key for accessibility
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault();
          component.element.click();
          return true;
        }
        return false;
      },
      focus: true,
      blur: true
    }
  });
};

/**
 * Creates API configuration for the Chip component
 * @param {BaseComponent} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object
 */
export const getApiConfig = (comp: BaseComponent) => ({
  disabled: {
    enable: () => comp.disabled?.enable(),
    disable: () => comp.disabled?.disable()
  },
  lifecycle: {
    destroy: () => comp.lifecycle?.destroy?.()
  }
});

export default defaultConfig;