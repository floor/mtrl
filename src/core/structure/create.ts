// src/core/structure/create.ts
/**
 * @module core/structure
 * @description Main structure creation functionality
 */

import { createElement } from '../dom/create';
import { Schema, StructureResult } from './types';
import { isComponentLike, createFragment, processClassNames } from './utils';
import { createStructureResult } from './result';

/**
 * Creates a DOM or component structure based on a structure definition
 * 
 * @param schema - Structure definition object
 * @param parentElement - Optional parent element to attach structure to
 * @returns Object containing the structure and utility functions
 */
export function createStructure(
  schema: Schema, 
  parentElement: HTMLElement | null = null
): StructureResult {
  // Use object literal instead of empty object for faster property access
  const structure: Record<string, any> = Object.create(null);
  
  // Special case for root component creation
  if (schema.element && !parentElement) {
    const elementDef = schema.element;
    const createElementFn = elementDef.creator || createElement;
    
    // Process className options to add prefix
    const processedOptions = processClassNames(elementDef.options);
    
    const rootComponent = createElementFn(processedOptions);
    const rootElement = isComponentLike(rootComponent) ? rootComponent.element : rootComponent;
    
    structure.element = rootComponent;
    
    if (elementDef.name) {
      structure[elementDef.name] = rootComponent;
    }
    
    if (elementDef.children) {
      // Use fragment for better performance when appending multiple children
      const fragment = createFragment();
      let childKeys = Object.keys(elementDef.children);
      
      // Process all children first and collect their structures
      const childStructures = new Array(childKeys.length);
      
      for (let i = 0; i < childKeys.length; i++) {
        const key = childKeys[i];
        const childDef = elementDef.children[key];
        
        // Create child structure and attach to fragment temporarily
        const childResult = createStructure({ [key]: childDef }, fragment);
        childStructures[i] = childResult.structure;
      }
      
      // Append fragment to root element (single DOM operation)
      rootElement.appendChild(fragment);
      
      // Now merge all child structures into the main structure
      for (let i = 0; i < childStructures.length; i++) {
        Object.assign(structure, childStructures[i]);
      }
    }
    
    // Create and return the result object with utility functions
    return createStructureResult(structure);
  }
  
  // Use fragment if we have multiple elements to append to the parent
  const fragment = parentElement ? createFragment() : null;
  const keys = Object.keys(schema);
  const keyLength = keys.length;
  
  // Pre-allocate arrays for better performance
  const elements = new Array(keyLength);
  const childStructuresToMerge = [];
  
  // First pass: create all elements
  for (let i = 0; i < keyLength; i++) {
    const key = keys[i];
    const def = schema[key];
    
    // Skip if no schema
    if (!def) {
      elements[i] = null;
      continue;
    }
    
    // Process className options to add prefix
    const processedOptions = processClassNames(def.options);
    
    // Create the element
    const createElementFn = def.creator || createElement;
    const created = createElementFn(processedOptions);
    elements[i] = created;
    
    // Add to structure
    structure[key] = created;
    
    // Add element to structure with its name if different from key
    if (def.name && def.name !== key) {
      structure[def.name] = created;
    }
  }
  
  // Second pass: handle children and append to parent
  for (let i = 0; i < keyLength; i++) {
    const key = keys[i];
    const def = schema[key];
    const created = elements[i];
    
    if (!created || !def) continue;
    
    // Get the actual DOM element
    const element = isComponentLike(created) ? created.element : created;
    
    // Append to fragment
    if (fragment) {
      fragment.appendChild(element);
    }
    
    // Process children recursively
    if (def.children) {
      const childResult = createStructure(def.children, element);
      childStructuresToMerge.push(childResult.structure);
    }
  }
  
  // Append fragment to parent (single DOM operation)
  if (parentElement && fragment) {
    parentElement.appendChild(fragment);
  }
  
  // Merge all child structures at once
  for (let i = 0; i < childStructuresToMerge.length; i++) {
    Object.assign(structure, childStructuresToMerge[i]);
  }
  
  // Create and return the result object with utility functions
  return createStructureResult(structure);
}