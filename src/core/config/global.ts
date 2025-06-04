/**
 * Lightweight Global Configuration System for mtrl
 * 
 * This system allows setting default configurations for all components
 * without adding complexity or performance overhead.
 */

import { ButtonConfig } from '../../components/button/types';
import { TextfieldConfig } from '../../components/textfield/types';
// Import other component configs as needed

/**
 * Component configuration map
 * Add new components here as they support global config
 * 
 * For components not yet integrated, use Partial<any> as a placeholder
 */
export interface ComponentConfigMap {
  button?: Partial<ButtonConfig>;
  textfield?: Partial<TextfieldConfig>;
  checkbox?: Partial<any>;
  switch?: Partial<any>;
  slider?: Partial<any>;
  card?: Partial<any>;
  chip?: Partial<any>;
  dialog?: Partial<any>;
  // Add other components as needed
}

/**
 * Internal storage for component configurations
 * Using a simple object for maximum performance
 */
const configStore: ComponentConfigMap = {};

/**
 * Sets global defaults for a specific component
 * 
 * @param component - Component name
 * @param config - Default configuration to apply
 * 
 * @example
 * ```typescript
 * // Set all buttons to be square by default
 * setComponentDefaults('button', {
 *   shape: 'square',
 *   size: 'm'
 * });
 * ```
 */
export function setComponentDefaults<K extends keyof ComponentConfigMap>(
  component: K,
  config: ComponentConfigMap[K]
): void {
  configStore[component] = config;
}

/**
 * Gets global defaults for a component
 * 
 * @param component - Component name
 * @returns Component defaults or empty object
 */
export function getComponentDefaults<K extends keyof ComponentConfigMap>(
  component: K
): ComponentConfigMap[K] {
  return configStore[component] || {} as ComponentConfigMap[K];
}

/**
 * Sets global defaults for multiple components at once
 * 
 * @param configs - Map of component names to their default configs
 * 
 * @example
 * ```typescript
 * setGlobalDefaults({
 *   button: { shape: 'square', size: 'm' },
 *   textfield: { variant: 'outlined' }
 * });
 * ```
 */
export function setGlobalDefaults(configs: Partial<ComponentConfigMap>): void {
  Object.assign(configStore, configs);
}

/**
 * Clears all global defaults
 */
export function clearGlobalDefaults(): void {
  Object.keys(configStore).forEach(key => {
    delete configStore[key as keyof ComponentConfigMap];
  });
} 