/**
 * Lightweight Global Configuration System for mtrl
 * 
 * This system allows setting default configurations for all components
 * without adding complexity or performance overhead.
 */

import { ButtonConfig } from '../../components/button/types';
import type { CardSchema } from '../../components/card/types';
import type { CheckboxConfig } from '../../components/checkbox/types';
import type { ChipConfig } from '../../components/chips/types';
import type { DialogConfig } from '../../components/dialog/types';
import type { NavigationRailConfig } from '../../components/navigation-rail/types';
import type { SliderConfig } from '../../components/slider/types';
import type { SwitchConfig } from '../../components/switch/types';
import { TextfieldConfig } from '../../components/textfield/types';
// Import other component configs as needed

/**
 * Component configuration map
 * Add new components here as they support global config
 */
export interface ComponentConfigMap {
  "navigation-rail"?: Partial<NavigationRailConfig>;
  button?: Partial<ButtonConfig>;
  textfield?: Partial<TextfieldConfig>;
  checkbox?: Partial<CheckboxConfig>;
  switch?: Partial<SwitchConfig>;
  slider?: Partial<SliderConfig>;
  card?: Partial<CardSchema>;
  chip?: Partial<ChipConfig>;
  dialog?: Partial<DialogConfig>;
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