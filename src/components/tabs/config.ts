// src/components/tabs/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { withElement } from '../../core/compose/component';
import { TabConfig } from './types';
import { TABS_VARIANTS, TAB_STATES } from './constants';

/**
 * Default configuration for a Tab
 */
export const defaultTabConfig: TabConfig = {
  state: TAB_STATES.INACTIVE,
  componentName: 'tab',
  ripple: true
};

/**
 * Creates the base configuration for a Tab
 * @param {TabConfig} config - User provided configuration
 * @returns {TabConfig} Complete configuration with defaults applied
 */
export const createTabConfig = (config: TabConfig = {}): TabConfig => 
  createComponentConfig(defaultTabConfig, config, 'tab') as TabConfig;

/**
 * Generates element configuration for a Tab
 * @param {TabConfig} config - Tab configuration
 * @returns {Function} Component enhancer function that creates a button element
 */
export const getTabElementConfig = (config: TabConfig) => {
  // Create the attributes object
  const attrs: Record<string, any> = {
    role: 'tab',
    'aria-selected': config.state === TAB_STATES.ACTIVE ? 'true' : 'false',
    'data-value': config.value !== undefined ? config.value : ''
  };
  
  // Only add disabled attribute if it's explicitly true
  if (config.disabled === true) {
    attrs.disabled = true;
    attrs['aria-disabled'] = 'true';
  }
  
  const elementConfig = createElementConfig(config, {
    tag: 'button',
    attrs,
    className: config.class,
    interactive: true,
    forwardEvents: {
      click: (component) => !component.element.hasAttribute('disabled'),
      focus: true,
      blur: true
    }
  });
  
  return (component) => withElement(elementConfig)(component);
};

/**
 * Default configuration for the Tabs component
 */
export const defaultTabsConfig = {
  variant: TABS_VARIANTS.PRIMARY,
  scrollable: true,
  showDivider: true,
  componentName: 'tabs'
};

/**
 * Creates the base configuration for Tabs component
 * @param {Object} config - User provided configuration
 * @returns {Object} Complete configuration with defaults applied
 */
export const createTabsConfig = (config = {}) => 
  createComponentConfig(defaultTabsConfig, config, 'tabs');

/**
 * Generates element configuration for the Tabs component
 * @param {Object} config - Tabs configuration
 * @returns {Function} Component enhancer function that creates a tabs container
 */
export const getTabsElementConfig = (config) => {
  const elementConfig = {
    tag: 'div',
    attrs: {
      role: 'tablist',
      'aria-orientation': 'horizontal'
    },
    className: [
      `${config.prefix}-tabs`,
      `${config.prefix}-tabs--${config.variant || TABS_VARIANTS.PRIMARY}`,
      config.class
    ]
  };
  
  return (component) => withElement(elementConfig)(component);
};

/**
 * Creates API configuration for the Tab component
 * @param {Object} comp - Component with disabled and lifecycle features
 * @returns {Object} API configuration object
 */
export const getTabApiConfig = (comp) => ({
  disabled: {
    enable: () => comp.disabled.enable(),
    disable: () => comp.disabled.disable(),
    isDisabled: () => comp.disabled.isDisabled && comp.disabled.isDisabled()
  },
  lifecycle: {
    destroy: () => comp.lifecycle.destroy()
  },
  button: comp.button
});