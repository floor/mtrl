// src/core/compose/base.ts

/**
 * Configuration for component creation
 */
export interface ComponentConfig {
  [key: string]: any;
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
export const createComponent = (config: ComponentConfig = {}): Component => ({
  element: null,
  config,
  setup() {
    return this;
  }
});