// src/core/structure/types.ts
/**
 * @module core/structure
 * @description Type definitions for structure creation system
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
 * Definition for a single element in the structure
 */
export interface ElementDefinition {
  /**
   * Optional name to reference the element
   */
  name?: string;
  
  /**
   * Creator function that produces an HTMLElement or ComponentLike
   */
  creator?: Function;
  
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
 * Schema for structure creation
 */
export interface Schema {
  /**
   * Root element definition
   */
  element?: ElementDefinition;
  
  /**
   * Additional elements or custom properties
   */
  [key: string]: ElementDefinition | any;
}

/**
 * Result object returned after creating a structure
 */
export interface StructureResult {
  /**
   * The raw structure object with all components
   */
  structure: Record<string, any>;
  
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
  get: (name: string) => any;
  
  /**
   * Gets all components in a flattened map
   * @returns Object with all components
   */
  getAll: () => Record<string, any>;
  
  /**
   * Destroys the structure, cleaning up all components
   */
  destroy: () => void;
}