// src/core/config/component-config.ts
import { PREFIX } from '../config';

/**
 * Base component configuration interface
 * Common configuration properties shared by all components
 */
export interface BaseComponentConfig {
  componentName?: string;
  prefix?: string;
  class?: string;
  [key: string]: any;
}

/**
 * Creates a base configuration for any component
 * 
 * @param {BaseComponentConfig} defaults - Default configuration for the component
 * @param {BaseComponentConfig} userConfig - User provided configuration
 * @param {string} componentName - The name of the component
 * @returns {BaseComponentConfig} Complete configuration with defaults applied
 * 
 * @example
 * // In button/config.ts
 * export const createBaseConfig = (config: ButtonConfig = {}) => 
 *   createComponentConfig(defaultConfig, config, 'button');
 */
export const createComponentConfig = (
  defaults: BaseComponentConfig, 
  userConfig: BaseComponentConfig = {}, 
  componentName: string
): BaseComponentConfig => {
  // Create a new object with defaults and user config
  const config = {
    ...defaults,
    ...userConfig,
    // Force these values to ensure consistency
    componentName,
    prefix: PREFIX
  };

  return config;
};

/**
 * Creates a class name with proper prefixing
 * 
 * @param {string} componentName - The name of the component
 * @param {string} [element] - Optional element name for BEM notation
 * @param {string} [modifier] - Optional modifier name for BEM notation
 * @returns {string} Properly formatted class name
 * 
 * @example
 * // Returns 'mtrl-button'
 * createClassName('button');
 * 
 * // Returns 'mtrl-button__icon'
 * createClassName('button', 'icon');
 * 
 * // Returns 'mtrl-button--primary'
 * createClassName('button', null, 'primary');
 * 
 * // Returns 'mtrl-button__icon--small'
 * createClassName('button', 'icon', 'small');
 */
export const createClassName = (
  componentName: string,
  element?: string | null,
  modifier?: string | null
): string => {
  let className = `${PREFIX}-${componentName}`;
  
  if (element) {
    className += `__${element}`;
  }
  
  if (modifier) {
    className += `--${modifier}`;
  }
  
  return className;
};

/**
 * Processes class names for an element, handling arrays, nulls and conditional classes
 * 
 * @param {string | string[] | null} classNames - Class names to process
 * @returns {string} Space-separated class names as a string
 * 
 * @example
 * // Returns 'mtrl-card mtrl-card--elevated custom-class'
 * processClassNames(['mtrl-card', 'mtrl-card--elevated', 'custom-class']);
 * 
 * // Returns 'mtrl-card'
 * processClassNames(['mtrl-card', null, undefined]);
 */
export const processClassNames = (classNames: string | string[] | null): string => {
  if (!classNames) return '';
  
  if (typeof classNames === 'string') return classNames;
  
  return classNames
    .filter(Boolean) // Remove null, undefined, empty strings
    .join(' ');
};

/**
 * Creates a configuration object for withElement HOC
 * 
 * @param {BaseComponentConfig} config - Component configuration
 * @param {Object} options - Element options
 * @returns {Object} Configuration object for withElement
 */
export const createElementConfig = (
  config: BaseComponentConfig,
  options: {
    tag: string;
    attrs?: Record<string, any>;
    className?: string | string[] | null;
    html?: string;
    text?: string;
    forwardEvents?: Record<string, boolean | Function>;
    interactive?: boolean;
  }
) => {
  return {
    tag: options.tag,
    componentName: config.componentName,
    attrs: options.attrs || {},
    className: options.className,
    html: options.html,
    text: options.text,
    forwardEvents: options.forwardEvents || {},
    interactive: options.interactive
  };
};