// src/components/tabs/config.ts
import { 
  createComponentConfig, 
  createElementConfig
} from '../../core/config/component-config';
import { TabsConfig } from './types';
import { TABS_VARIANTS } from './constants';

/**
 * Default configuration for the Tabs component
 */
export const defaultConfig: TabsConfig = {
  variant: TABS_VARIANTS.PRIMARY,
  showIndicator: true,
  animated: true,
  scrollable: true,
  activeIndex: 0
};

/**
 * Creates the base configuration for Tabs component
 * @param {TabsConfig} config - User provided configuration
 * @returns {TabsConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: TabsConfig = {}): TabsConfig => 
  createComponentConfig(defaultConfig, config, 'tabs') as TabsConfig;

/**
 * Generates element configuration for the Tabs component
 * @param {TabsConfig} config - Tabs configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: TabsConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {
    role: 'tablist'
  };
  
  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attrs['aria-disabled'] = 'true';
  }
  
  const extraClasses: string[] = [];
  
  if (config.scrollable) {
    extraClasses.push('--scrollable');
  }
  
  if (config.animated) {
    extraClasses.push('--animated');
  }
  
  return createElementConfig(config, {
    tag: 'div',
    attrs,
    className: config.class,
    extraClasses,
    forwardEvents: {
      keydown: true
    }
  });
};

/**
 * Creates API configuration for the Tabs component
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