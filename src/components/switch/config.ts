// src/components/switch/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { SwitchConfig, BaseComponent, ApiOptions } from './types';

/**
 * Default configuration for the Switch component
 */
export const defaultConfig: SwitchConfig = {
  labelPosition: 'end'
};

/**
 * Creates the base configuration for Switch component
 * @param {SwitchConfig} config - User provided configuration
 * @returns {SwitchConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: SwitchConfig = {}): SwitchConfig => 
  createComponentConfig(defaultConfig, config, 'switch') as SwitchConfig;

/**
 * Generates element configuration for the Switch component
 * @param {SwitchConfig} config - Switch configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: SwitchConfig) => 
  createElementConfig(config, {
    tag: 'div',
    componentName: 'switch',
    className: config.class,
    interactive: true
  });

/**
 * Applies label position class to the component
 * @param {SwitchConfig} config - Component configuration
 */
export const withLabelPosition = (config: SwitchConfig) => (component: BaseComponent): BaseComponent => {
  if (!config.label) return component;

  const position = config.labelPosition || 'end';
  const positionClass = `${config.prefix}-switch--label-${position}`;

  component.element.classList.add(positionClass);

  return component;
};

/**
 * Creates API configuration for the Switch component
 * @param {BaseComponent} comp - Component with disabled, lifecycle, and checkable features
 * @returns {ApiOptions} API configuration object
 */
export const getApiConfig = (comp: BaseComponent): ApiOptions => ({
  disabled: {
    enable: comp.disabled?.enable,
    disable: comp.disabled?.disable
  },
  lifecycle: {
    destroy: comp.lifecycle?.destroy
  },
  checkable: {
    check: comp.checkable?.check,
    uncheck: comp.checkable?.uncheck,
    toggle: comp.checkable?.toggle,
    isChecked: comp.checkable?.isChecked
  }
});

export default defaultConfig;