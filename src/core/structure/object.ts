// src/core/structure/object.ts
/**
 * @module core/structure
 * @description Processor for object-based structure schemas
 */

import { createElement } from '../dom/create';
import { Schema, ElementDefinition, StructureResult } from './types';
import { isComponent, createFragment, processClassNames } from './utils';
import { createStructureResult } from './result';

/**
 * Processes an object-based structure definition
 * 
 * @param schema - Object-based structure definition
 * @param parentElement - Optional parent element to attach structure to
 * @returns Structure result object
 */
export function processObjectSchema(schema: Schema, parentElement?: HTMLElement | null): StructureResult {
  const structure = {};
  const fragment = parentElement ? document.createDocumentFragment() : null;
  
  // Process keys in a single pass
  for (const key in schema) {
    const def = schema[key];
    if (!def) continue;
    
    // Process className options to add prefix - THIS WAS MISSING
    const processedOptions = processClassNames(def.options || {});
    
    // Create element
    const creator = def.creator || createElement;
    const element = creator(processedOptions);
    structure[key] = element;
    
    // Also add with its name if different from key
    if (def.name && def.name !== key) {
      structure[def.name] = element;
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
      Object.assign(structure, childResult.structure);
    }
  }
  
  // Append to parent
  if (parentElement && fragment) {
    const parentDom = isComponent(parentElement) ? parentElement.element : parentElement;
    parentDom.appendChild(fragment);
  }
  
  return createStructureResult(structure);
}