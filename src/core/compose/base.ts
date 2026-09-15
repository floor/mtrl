// src/core/compose/base.ts

/**
 * Configuration for component creation
 */
export interface ComponentConfig {
  [key: string]: unknown;
}

/**
 * Basic component interface
 */
export interface Component {
  /**
   * Component element
   */
  element: HTMLElement | null;
  
  /**
   * Component configuration
   */
  config: ComponentConfig;
  
  /**
   * Setup method
   * @returns Component for chaining
   */
  setup: () => Component;
}

/**
 * Creates a basic component with minimal structure
 * 
 * @param config - Component configuration
 * @returns Basic component structure
 */
export const createComponent = (config: object = {}): Component => ({
  element: null,
  // Component configs are interfaces without index signatures; their keys read as unknown.
  config: config as ComponentConfig,
  setup() {
    return this;
  }
});