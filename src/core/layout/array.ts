// src/core/layout/array.ts
/**
 * @module core/layout
 * @description Processor for array-based layout schemas
 */

import { ComponentLike, LayoutResult, LayoutOptions } from './types';
import { isComponent, createFragment } from './utils';
import { createLayoutResult } from './result';
import { isObject } from '../utils'

/**
 * Creates a component from a constructor or factory function
 * 
 * @param Component - Constructor or factory function
 * @param options - Component options
 * @returns Created component or element
 */
function createComponent(Component: Function, options: Record<string, any> = {}): any {
  // Check if Component is a class (has prototype) or function
  const isClass = Component.prototype && Component.prototype.constructor === Component;

  if (isClass) {
    return new (Component as new (options: Record<string, any>) => any)(options);
  }

  return (Component as Function)(options);
}

/**
 * Processes an array-based layout schema
 * 
 * @param schema - Array-based layout definition
 * @param parentElement - Optional parent element to attach layout to
 * @param level - Current recursion level
 * @param options - Layout creation options
 * @returns Layout result object
 */
export function processArraySchema(
  schema: any[], 
  parentElement?: HTMLElement | null, 
  level = 0,
  options: LayoutOptions = {}
): LayoutResult {
  level++;
  const layout = {};
  const fragment = document.createDocumentFragment();
  let component = null;
  
  // Single loop processing instead of multiple conditions
  for (let i = 0; i < schema.length; i++) {
    const item = schema[i];
    
    // Handle array recursively
    if (Array.isArray(item)) {
      const container = component || parentElement;
      const result = processArraySchema(item, container, level);
      Object.assign(layout, result.layout);
      continue;
    }
    
    // Skip non-component creators
    if (typeof item !== 'function') continue;
    
    // Determine options and name more efficiently
    const options = schema[i+1] && typeof schema[i+1] === 'object' && !Array.isArray(schema[i+1]) ? 
                    schema[i+1] : 
                    (schema[i+2] && typeof schema[i+2] === 'object' ? schema[i+2] : {});
                    
    const name = options.id || (typeof schema[i+1] === 'string' ? schema[i+1] : undefined);
    
    // Create component
    component = item.prototype ? new item(options) : item(options);
    
    // Add to layout and append to DOM
    if (name) layout[name] = component;
    if (level === 1) layout.element = component.element || component;
    
    // Append to fragment in one operation
    const element = component.element || component;
    fragment.appendChild(element);
  }
  
  // Append to parent once
  if (parentElement && fragment.hasChildNodes()) {
    (parentElement.element || parentElement).appendChild(fragment);
  }
  
  return createLayoutResult(layout);
}