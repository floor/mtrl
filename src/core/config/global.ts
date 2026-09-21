/**
 * Lightweight Global Configuration System for mtrl
 * 
 * This system allows setting default configurations for all components
 * without adding complexity or performance overhead.
 */

// Empty on purpose: this is a registry that components augment, and the
// rule's suggested alternatives (`object`, `unknown`) cannot be augmented.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ComponentConfigMap {
  // Deliberately empty. Each component adds its own key by augmenting this
  // interface from its own types.ts, so core imports nothing from components
  // -- mtrl-addons builds on core, and core importing leaf component types
  // was a layering inversion. FLO-115.
  //
  // A component's key exists only when that component is imported, which is
  // the right answer for a tree-shaken build rather than a gap.
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