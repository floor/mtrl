// src/core/structure/processor.ts
/**
 * @module core/structure
 * @description Lightweight processor for structure creation, optimized for bundle size
 */

import { createElement } from '../dom/create';
import { Schema, StructureResult } from './types';
import { isComponent, createFragment, processClassNames } from './utils';
import { createStructureResult } from './result';
import { isObject } from '../utils';

/**
 * Creates a component from a constructor or factory function
 */
export function createComponentInstance(Component, options = {}) {
  return Component.prototype && Component.prototype.constructor === Component
    ? new Component(options)
    : Component(options);
}

/**
 * Processes any type of structure definition (array or object)
 */
export function processSchema(schema, parentElement = null, level = 0) {
  return Array.isArray(schema)
    ? processArraySchema(schema, parentElement, level)
    : processObjectSchema(schema, parentElement);
}

/**
 * Processes an array-based structure definition
 */
function processArraySchema(schema, parentElement = null, level = 0) {
  level++;
  const structure = {};
  const components = [];
  const fragment = createFragment();
  let component = null;

  if (!Array.isArray(schema)) {
    console.error('Schema is not an array!', parentElement, level, schema);
    return createStructureResult(structure);
  }

  for (let i = 0; i < schema.length; i++) {
    const item = schema[i];
    if (!item) continue;

    // Handle nested arrays recursively
    if (Array.isArray(item)) {
      const container = component || parentElement;
      const result = processSchema(item, container, level);
      Object.assign(structure, result.structure);
      continue;
    }

    // Skip non-function items
    if (!(item instanceof Object && typeof item === 'function')) continue;

    // Extract options and name
    const nextItem = schema[i+1];
    const afterNextItem = schema[i+2];
    const options = isObject(nextItem) ? nextItem : (isObject(afterNextItem) ? afterNextItem : {});
    const name = options.id || (typeof nextItem === 'string' ? nextItem : undefined);
    
    // Add name to options if needed
    if (name && typeof nextItem === 'string' && !(item.isElement || item.isComponent)) {
      options.name = name;
    }

    // Create and store component
    component = createComponentInstance(item, options);
    const element = isComponent(component) ? component.element : component;
    
    if (level === 1) structure.element = element;
    if (name) {
      structure[name] = component;
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

  structure.components = components;
  return createStructureResult(structure);
}

/**
 * Processes an object-based structure definition
 */
function processObjectSchema(schema, parentElement = null) {
  const structure = {};
  
  // Handle root element creation
  if (schema.element && !parentElement) {
    const elementDef = schema.element;
    const createElementFn = elementDef.creator || createElement;
    const processedOptions = processClassNames(elementDef.options || {});
    const rootComponent = createElementFn(processedOptions);
    const rootElement = isComponent(rootComponent) ? rootComponent.element : rootComponent;
    
    structure.element = rootComponent;
    if (elementDef.name) structure[elementDef.name] = rootComponent;
    
    // Process children
    if (elementDef.children) {
      const fragment = createFragment();
      const childStructures = [];
      
      for (const key in elementDef.children) {
        const childResult = processObjectSchema(
          { [key]: elementDef.children[key] }, 
          fragment
        );
        childStructures.push(childResult.structure);
      }
      
      rootElement.appendChild(fragment);
      
      // Merge child structures
      for (const childStructure of childStructures) {
        Object.assign(structure, childStructure);
      }
    }
    
    return createStructureResult(structure);
  }
  
  // Process normal schema elements
  const fragment = parentElement ? createFragment() : null;
  const childStructuresToMerge = [];
  
  for (const key in schema) {
    const def = schema[key];
    if (!def) continue;
    
    // Create element
    const processedOptions = processClassNames(def.options || {});
    const createElementFn = def.creator || createElement;
    const created = createElementFn(processedOptions);
    
    // Store in structure
    structure[key] = created;
    if (def.name && def.name !== key) structure[def.name] = created;
    
    // Handle DOM operations
    const element = isComponent(created) ? created.element : created;
    if (fragment) fragment.appendChild(element);
    
    // Process children
    if (def.children) {
      const childResult = processObjectSchema(def.children, element);
      childStructuresToMerge.push(childResult.structure);
    }
  }
  
  // Append to parent
  if (parentElement && fragment) {
    const parentDom = isComponent(parentElement) ? parentElement.element : parentElement;
    parentDom.appendChild(fragment);
  }
  
  // Merge child structures
  for (const childStructure of childStructuresToMerge) {
    Object.assign(structure, childStructure);
  }
  
  return createStructureResult(structure);
}