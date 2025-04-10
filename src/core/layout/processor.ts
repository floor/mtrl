// src/core/layout/processor.ts
/**
 * @module core/layout
 * @description Lightweight processor for layout creation, optimized for bundle size
 */

import { Schema, LayoutResult, LayoutOptions } from './types';
import { isComponent } from './utils';
import { processArraySchema } from './array';
import { processObjectSchema } from './object';
import { isObject } from '../utils';
import { applyLayoutClasses, applyLayoutItemClasses } from './config';

/**
 * Creates a component from a constructor or factory function
 * 
 * @param Component - Component constructor or factory function
 * @param options - Component creation options 
 * @param layoutOptions - Global layout options
 * @returns Created component instance
 */
export function createComponentInstance(
  Component: any, 
  options: Record<string, any> = {}, 
  layoutOptions: LayoutOptions = {}
): any {
  try {
    // Check if Component is a class constructor
    const isClass = typeof Component === 'function' && 
                   Component.prototype && 
                   Component.prototype.constructor === Component &&
                   // Exclude native constructors like Object, Array, etc.
                   Object.getPrototypeOf(Component) !== Function.prototype;

    // Before creating the component, set up any layout configuration
    const component = isClass
      ? new Component(options)
      : Component(options);
      
    // Apply layout configuration to the created component
    if (component) {
      // Get the actual DOM element
      const element = component.element || (component instanceof HTMLElement ? component : null);
      if (element) {
        // Apply layout classes if layout config exists
        if (options.layout) {
          applyLayoutClasses(element, options.layout);
        }
        
        // Apply layout item classes if layoutItem config exists
        if (options.layoutItem) {
          applyLayoutItemClasses(element, options.layoutItem);
        }
      }
    }
    
    return component;
  } catch (error) {
    console.error('Error creating component instance:', error);
    // Return a basic element as fallback
    return document.createElement('div');
  }
}

/**
 * Processes any type of layout definition (array or object)
 * This is the main entry point for schema processing
 * 
 * @param schema - Layout schema to process
 * @param parentElement - Parent element to attach to
 * @param level - Current nesting level 
 * @param options - Layout creation options
 * @returns Layout result object
 */
export function processSchema(
  schema: any, 
  parentElement: HTMLElement | null = null, 
  level: number = 0,
  options: LayoutOptions = {}
): LayoutResult {
  // Validate input to provide helpful error messages
  if (!schema) {
    console.warn('Empty schema provided to layout processor');
    return {
      layout: {},
      element: document.createElement('div'),
      component: {},
      get: () => null,
      getAll: () => ({}),
      destroy: () => {}
    };
  }
  
  // Process based on schema type
  return Array.isArray(schema)
    ? processArraySchema(schema, parentElement, level, options)
    : processObjectSchema(schema, parentElement, options);
}