// src/core/structure/processor.ts
/**
 * @module core/structure
 * @description Lightweight processor for structure creation, optimized for bundle size
 */

import { createElement } from '../dom/create';
import { Schema, StructureResult, StructureOptions } from './types';
import { isComponent, createFragment, processClassNames } from './utils';
import { createStructureResult } from './result';
import { isObject } from '../utils';

/**
 * Creates a component from a constructor or factory function
 * 
 * @param Component - Component constructor or factory function
 * @param options - Component creation options 
 * @param structureOptions - Global structure options
 * @returns Created component instance
 */
export function createComponentInstance(
  Component: any, 
  options: Record<string, any> = {}, 
  structureOptions: StructureOptions = {}
): any {
  // Check if Component is a class constructor
  const isClass = typeof Component === 'function' && 
                 Component.prototype && 
                 Component.prototype.constructor === Component &&
                 // Exclude native constructors like Object, Array, etc.
                 Object.getPrototypeOf(Component) !== Function.prototype;

  // Use 'new' for class constructors, call directly for function factories
  return isClass
    ? new Component(options)
    : Component(options);
}

/**
 * Processes any type of structure definition (array or object)
 * 
 * @param schema - Structure schema to process
 * @param parentElement - Parent element to attach to
 * @param level - Current nesting level 
 * @param options - Structure creation options
 * @returns Structure result object
 */
export function processSchema(
  schema: any, 
  parentElement: HTMLElement | null = null, 
  level: number = 0,
  options: StructureOptions = {}
): StructureResult {
  return Array.isArray(schema)
    ? processArraySchema(schema, parentElement, level, options)
    : processObjectSchema(schema, parentElement, options);
}

/**
 * Processes an array-based structure definition
 * 
 * @param schema - Array schema to process
 * @param parentElement - Parent element to attach to
 * @param level - Current nesting level
 * @param options - Structure creation options
 * @returns Structure result object
 */
function processArraySchema(
  schema: any[], 
  parentElement: HTMLElement | null = null, 
  level: number = 0,
  options: StructureOptions = {}
): StructureResult {
  level++;
  const structure = {};
  const components = [];
  const fragment = createFragment();
  let component = null;

  if (!Array.isArray(schema)) {
    console.error('Schema is not an array!', parentElement, level, schema);
    return createStructureResult(structure);
  }

  // Get default creator function from options or use createElement
  const defaultCreator = options.creator || createElement;

  for (let i = 0; i < schema.length; i++) {
    const item = schema[i];
    if (!item) continue;

    // Handle nested arrays recursively
    if (Array.isArray(item)) {
      const container = component || parentElement;
      const result = processSchema(item, container, level, options);
      Object.assign(structure, result.structure);
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
      
      // For default creator with string keys, set tag if not defined
      if (creator === createElement && !('tag' in itemOptions)) {
        itemOptions.tag = name;
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
 * 
 * @param schema - Object schema to process
 * @param parentElement - Parent element to attach to
 * @param options - Structure creation options
 * @returns Structure result object
 */
function processObjectSchema(
  schema: Schema, 
  parentElement: HTMLElement | null = null,
  options: StructureOptions = {}
): StructureResult {
  const structure = {};
  
  // Get default creator function from options or use createElement
  const defaultCreator = options.creator || createElement;

  // Handle root element creation
  if (schema.element && !parentElement) {
    const elementDef = schema.element;
    const createElementFn = elementDef.creator || defaultCreator;
    
    // Process class names based on prefix option
    const elementOptions = elementDef.options || {};
    const processedOptions = options.prefix !== false ? 
      processClassNames(elementOptions) : 
      { ...elementOptions };
      
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
          fragment,
          options
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
    
    // Use appropriate creator
    const elementCreator = def.creator || defaultCreator;
    
    // Process class names based on prefix option
    const elementOptions = def.options || {};
    const shouldApplyPrefix = 
      'prefix' in elementOptions ? elementOptions.prefix : options.prefix !== false;
      
    const processedOptions = shouldApplyPrefix ? 
      processClassNames(elementOptions) : 
      { ...elementOptions };
      
    // Create element
    const created = elementCreator(processedOptions);
    
    // Store in structure
    structure[key] = created;
    if (def.name && def.name !== key) structure[def.name] = created;
    
    // Handle DOM operations
    const element = isComponent(created) ? created.element : created;
    if (fragment) fragment.appendChild(element);
    
    // Process children
    if (def.children) {
      const childResult = processObjectSchema(def.children, element, options);
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