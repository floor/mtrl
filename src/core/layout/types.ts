// src/core/layout/types.ts
/**
 * @module core/layout
 * @description Type definitions for layout creation system
 */

/**
 * Layout configuration options
 */
export interface LayoutConfig {
  /** Base layout type */
  type?: 'stack' | 'row' | 'grid' | string;
  
  /** Spacing between elements */
  gap?: number | string;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Alignment of items along the cross axis */
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  /** Alignment of items along the main axis */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  
  /** Whether and how items should wrap */
  wrap?: boolean | 'reverse' | 'nowrap';
  
  /** Whether row items should stack vertically on mobile */
  mobileStack?: boolean;
  
  /** Whether row items should scroll horizontally on mobile */
  mobileScroll?: boolean;
  
  /** Number of columns or automatic sizing method */
  columns?: number | 'auto-fit' | 'auto-fill';
  
  /** Minimum item width for grid layouts */
  minWidth?: string | number;
  
  /** Whether to use dense packing algorithm for grid */
  dense?: boolean;
  
  /** Whether grid items should adjust height automatically */
  autoHeight?: boolean;
}

/**
 * Configuration for individual layout items
 */
export interface LayoutItemConfig {
  /** Column width in a 12-column grid */
  width?: number;
  
  /** Width on small screens */
  sm?: number;
  
  /** Width on medium screens */
  md?: number;
  
  /** Width on large screens */
  lg?: number;
  
  /** Width on extra-large screens */
  xl?: number;
  
  /** Number of grid columns to span */
  span?: number;
  
  /** Number of grid rows to span */
  rowSpan?: number;
  
  /** Display order */
  order?: number | 'first' | 'last';
  
  /** Self-alignment within container */
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  /** Whether item should automatically size */
  auto?: boolean;
}

/**
 * Interface for component-like objects
 */
export interface ComponentLike {
  /** DOM element reference */
  element: HTMLElement;
  
  /** Optional method to clean up resources */
  destroy?: () => void;
  
  /** Allow additional properties */
  [key: string]: any;
}

/**
 * Extended options for element creation
 */
export interface ElementOptions extends Record<string, any> {
  /** Layout configuration for the element */
  layout?: LayoutConfig;
  
  /** Layout item configuration */
  layoutItem?: LayoutItemConfig;
}

/**
 * Definition for a single element in the layout
 */
export interface ElementDefinition {
  /** Optional name to reference the element */
  name?: string;
  
  /** Creator function that produces an HTMLElement or ComponentLike */
  creator?: (options?: Record<string, any>) => HTMLElement | ComponentLike;
  
  /** Options to pass to the creator function */
  options?: ElementOptions;
  
  /** Child elements to create and attach */
  children?: Record<string, ElementDefinition>;
}

/**
 * Schema for layout creation
 */
export interface Schema {
  /** Root element definition */
  element?: ElementDefinition;
  
  /** Additional elements */
  [key: string]: ElementDefinition | undefined;
}

/**
 * Options for layout creation
 */
export interface LayoutOptions {
  /** Default creator function to use if not specified in schema */
  creator?: (options?: Record<string, any>) => HTMLElement | ComponentLike;
  
  /** Whether to apply CSS class prefix @default true */
  prefix?: boolean;
  
  /** Additional options */
  [key: string]: any;
}

/**
 * Result object returned after creating a layout
 */
export interface LayoutResult {
  /** The raw layout object with all components */
  layout: Record<string, any>;
  
  /** Reference to the root element for convenience */
  element: HTMLElement | ComponentLike;
  
  /** Flattened component map */
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