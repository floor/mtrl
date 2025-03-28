// src/core/layout/types.ts
/**
 * @module core/layout
 * @description Optimized type definitions for layout creation system
 */

/**
 * Interface for component-like objects
 */
export interface ComponentLike {
  /**
   * DOM element reference
   */
  element: HTMLElement;
  
  /**
   * Optional method to clean up resources
   */
  destroy?: () => void;
  
  /**
   * Allow additional properties
   */
  [key: string]: any;
}

/**
 * Definition for a single element in the layout
 */
export interface ElementDefinition {
  /**
   * Optional name to reference the element
   */
  name?: string;
  
  /**
   * Creator function that produces an HTMLElement or ComponentLike
   */
  creator?: (options?: Record<string, any>) => HTMLElement | ComponentLike;
  
  /**
   * Options to pass to the creator function
   */
  options?: Record<string, any>;
  
  /**
   * Child elements to create and attach
   */
  children?: Record<string, ElementDefinition>;
}

/**
 * Schema for layout creation
 */
export interface Schema {
  /**
   * Root element definition
   */
  element?: ElementDefinition;
  
  /**
   * Additional elements
   */
  [key: string]: ElementDefinition | undefined;
}

/**
 * Options for layout creation
 */
export interface LayoutOptions {
  /**
   * Default creator function to use if not specified in schema
   */
  creator?: (options?: Record<string, any>) => HTMLElement | ComponentLike;
  
  /**
   * Whether to apply CSS class prefix
   * @default true
   */
  prefix?: boolean;

  /**
   * Additional options
   */
  [key: string]: any;
}

/**
 * Result object returned after creating a layout
 * Simplified API with essential methods
 */
export interface LayoutResult {
  /**
   * The raw layout object with all components
   */
  layout: Record<string, any>;
  
  /**
   * Reference to the root element for convenience
   */
  element: HTMLElement | ComponentLike;
  
  /**
   * Flattened component map
   */
  component: Record<string, any>;
  
  /**
   * Gets a component by name
   * @param name - Component name
   * @returns Component if found, null otherwise
   */
  get(name: string): any;
  
  /**
   * Gets all components in a flattened map
   * @returns Object with all components
   */
  getAll(): Record<string, any>;
  
  /**
   * Destroys the layout, cleaning up all components
   */
  destroy(): void;
}