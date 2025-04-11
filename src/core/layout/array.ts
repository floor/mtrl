// src/core/layout/array.ts
/**
 * @module core/layout
 * @description Processor for array-based layout schemas
 */

import { createElement } from '../dom/create';
import { LayoutResult, LayoutOptions } from './types';
import { isComponent, createFragment, processClassNames } from './utils';
import { createLayoutResult } from './result';
import { createComponentInstance } from './processor';
import { isObject } from '../utils';

/**
 * Processes an array-based layout definition
 * 
 * @param schema - Array-based layout definition
 * @param parentElement - Optional parent element to attach layout to
 * @param level - Current recursion level
 * @param options - Layout creation options
 * @returns Layout result object
 */
export function processArraySchema(
  schema: any[], 
  parentElement: HTMLElement | null = null, 
  level: number = 0,
  options: LayoutOptions = {}
): LayoutResult {
  level++;
  const layout = {};
  const components = [];
  const fragment = createFragment();
  let component = null;

  if (!Array.isArray(schema)) {
    console.error('Schema is not an array!', parentElement, level, schema);
    return createLayoutResult(layout);
  }

  // Get default creator function from options or use createElement
  const defaultCreator = options.creator || createElement;

  for (let i = 0; i < schema.length; i++) {
    const item = schema[i];
    if (!item) continue;

    // Handle nested arrays recursively
    if (Array.isArray(item)) {
      const container = component || parentElement;
      // Use this function for recursion, not the external processSchema
      const result = processArraySchema(item, container, level, options);
      Object.assign(layout, result.layout);
      continue;
    }

    // Handle different item types
    let creator, name, itemOptions;

    // Case 1: Item is a function (component creator)
    if (typeof item === 'function') {
      creator = item;
      
      // Check next items for name (string) and options (object)
      const nextItem = schema[i+1];
      const afterNextItem = schema[i+2];
      
      if (typeof nextItem === 'string') {
        name = nextItem;
        i++; // Skip the name on next iteration
        
        // Check if options are provided after the name
        if (isObject(afterNextItem)) {
          itemOptions = afterNextItem;
          i++; // Skip the options on next iteration
        } else {
          itemOptions = {};
        }
      } else if (isObject(nextItem)) {
        // No name provided, just options
        itemOptions = nextItem;
        i++; // Skip the options on next iteration
      } else {
        // No name or options
        itemOptions = {};
      }
    }
    // Case 2: Item is a string (component name using default creator)
    else if (typeof item === 'string') {
      creator = defaultCreator;
      name = item;
      
      // Check next item for options
      const nextItem = schema[i+1];
      if (isObject(nextItem)) {
        itemOptions = nextItem;
        i++; // Skip the options on next iteration
      } else {
        itemOptions = {};
      }
      
      // Default to div if no tag is specified
      if (creator === createElement && !('tag' in itemOptions)) {
        itemOptions.tag = 'div';
      }
    }
    // Case 3: Item is an object (options for default creator with no name)
    else if (isObject(item)) {
      creator = defaultCreator;
      itemOptions = item;
    } 
    else {
      // Skip unsupported item types
      console.warn('Skipping unsupported item type:', item);
      continue;
    }
    
    // Check for additional options object after main options
    const maybeAdditionalOptions = schema[i+1];
    if (isObject(maybeAdditionalOptions) && !Array.isArray(maybeAdditionalOptions) && 
        typeof maybeAdditionalOptions.prefix !== 'undefined') {
      // Merge the additional options into main options
      Object.assign(itemOptions, maybeAdditionalOptions);
      i++; // Skip on next iteration
    }

    // Process options based on prefix setting
    const shouldApplyPrefix = 
      // Use item-specific prefix setting if available
      'prefix' in itemOptions ? 
        itemOptions.prefix : 
        // Otherwise use global options prefix setting (default to true)
        options.prefix !== false;

    const processedOptions = shouldApplyPrefix ? 
      processClassNames(itemOptions) : 
      { ...itemOptions };

    // Add name to options if needed and not a DOM element tag
    if (name && !('name' in processedOptions) && 
        !(creator === createElement || creator.isElement)) {
      processedOptions.name = name;
    }

    // Create and store component
    component = createComponentInstance(creator, processedOptions, options);
    const element = isComponent(component) ? component.element : component;
    
    if (level === 1) layout.element = element;
    if (name) {
      layout[name] = component;
      components.push([name, component]);
    }

    // Append to DOM
    if (component) {
      if ('insert' in component && typeof component.insert === 'function') {
        component.insert(fragment);
      } else {
        fragment.appendChild(element);
      }

      if (parentElement) {
        component._container = parentElement;
        
        if ('onInserted' in component && typeof component.onInserted === 'function') {
          component.onInserted(parentElement);
        }
      }
    }
  }

  // Append fragment to parent in a single operation
  if (parentElement && fragment.hasChildNodes()) {
    const wrapper = isComponent(parentElement) ? parentElement.element : parentElement;
    wrapper.appendChild(fragment);
  }

  layout.components = components;
  return createLayoutResult(layout);
}
