// src/core/layout/object.ts
/**
 * @module core/layout
 * @description Processor for object-based layout schemas
 */

import { createElement } from '../dom/create';
import { Schema, ElementDefinition, LayoutResult, LayoutOptions } from './types';
import { isComponent, createFragment, processClassNames } from './utils';
import { createLayoutResult } from './result';

/**
 * Processes an object-based layout definition
 * 
 * @param schema - Object-based layout definition
 * @param parentElement - Optional parent element to attach layout to
 * @param options - Layout creation options
 * @returns Layout result object
 */
export function processObjectSchema(
  schema: Schema, 
  parentElement?: HTMLElement | null,
  options: LayoutOptions = {}
): LayoutResult {
  const layout = {};
  const fragment = parentElement ? document.createDocumentFragment() : null;
  
  // Process keys in a single pass
  for (const key in schema) {
    const def = schema[key];
    if (!def) continue;
    
    // Process className options to add prefix
    const processedOptions = processClassNames(def.options || {});
    
    // Create element
    const creator = def.creator || createElement;
    const element = creator(processedOptions);
    layout[key] = element;
    
    // Also add with its name if different from key
    if (def.name && def.name !== key) {
      layout[def.name] = element;
    }
    
    // Add to DOM
    if (fragment) {
      // Get actual DOM element
      const domElement = isComponent(element) ? element.element : element;
      fragment.appendChild(domElement);
    }
    
    // Process children
    if (def.children) {
      const childResult = processObjectSchema(def.children, isComponent(element) ? element.element : element);
      Object.assign(layout, childResult.layout);
    }
  }
  
  // Append to parent
  if (parentElement && fragment) {
    const parentDom = isComponent(parentElement) ? parentElement.element : parentElement;
    parentDom.appendChild(fragment);
  }
  
  return createLayoutResult(layout);
}