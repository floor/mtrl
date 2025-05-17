// src/components/checkbox/config.ts
import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component';
import { CheckboxConfig, BaseComponent, ApiOptions } from './types';

/**
 * Default configuration for the Checkbox component
 */
export const defaultConfig: CheckboxConfig = {
  variant: 'filled',
  labelPosition: 'end'
};

/**
 * Creates the base configuration for Checkbox component
 * @param {CheckboxConfig} config - User provided configuration
 * @returns {CheckboxConfig} Complete configuration with defaults applied
 */
export const createBaseConfig = (config: CheckboxConfig = {}): CheckboxConfig => 
  createComponentConfig(defaultConfig, config, 'checkbox') as CheckboxConfig;

/**
 * Generates element configuration for the Checkbox component
 * @param {CheckboxConfig} config - Checkbox configuration
 * @returns {Object} Element configuration object for withElement
 */
export const getElementConfig = (config: CheckboxConfig) => 
  createElementConfig(config, {
    tag: 'div',
  // @ts-ignore: Fix later - Object literal may only specify known properties, and 'componentName' does not exist in type '{ tag: string; attributes?: Record<string, any>; className?: string | string[]; html?: string; text?: string; forwardEvents?: Record<string, boolean | ((component: any, event: Event) => boolean)>; interactive?: boolean; }'.
    componentName: 'checkbox',
    className: config.class,
    interactive: true
  });

/**
 * Adds check icon to checkbox
 * @param {CheckboxConfig} config - Component configuration
 */
export const withCheckIcon = (config: CheckboxConfig) => (component: BaseComponent): BaseComponent => {
  const icon = document.createElement('span');
  icon.className = `${config.prefix}-checkbox-icon`;
  icon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M9.55 14.6L6.35 11.4l-1.9 1.9L9.55 18.4l10.9-10.9-1.9-1.9z"/>
    </svg>
  `;

  component.element.appendChild(icon);
  return component;
};

/**
 * Applies label position class to the component
 * @param {CheckboxConfig} config - Component configuration
 */
export const withLabelPosition = (config: CheckboxConfig) => (component: BaseComponent): BaseComponent => {
  const position = config.labelPosition || 'end';
  const positionClass = `${config.prefix}-checkbox--label-${position}`;

  component.element.classList.add(positionClass);

  return component;
};

/**
 * Creates API configuration for the Checkbox component
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