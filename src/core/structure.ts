// src/core/structure.ts
import { createElement } from './dom/create';
import { PREFIX, getComponentClass } from './config';

/**
 * Type definitions for structure creation
 */
export interface ComponentLike {
  element: HTMLElement;
  destroy?: () => void;
  [key: string]: any;
}

export interface ElementDefinition {
  name?: string;
  creator?: Function;
  options?: Record<string, any>;
  children?: Record<string, ElementDefinition>;
}

export interface Schema {
  element?: ElementDefinition;
  [key: string]: ElementDefinition | any;
}

/**
 * Structure result interface with separated structure and utility functions
 */
export interface StructureResult {
  // The raw structure object with all components
  structure: Record<string, any>;
  
  // Reference to the root element for convenience 
  element: HTMLElement | ComponentLike;
  
  // Utility functions
  get: (name: string) => any;
  getAll: () => Record<string, any>;
  destroy: () => void;
}

/**
 * Checks if a value is a component object (has an element property)
 * Uses a faster property check before the instanceof check
 * @param value Value to check
 * @returns True if the value is a component-like object
 */
function isComponentLike(value: any): value is ComponentLike {
  return value && 
         typeof value === 'object' && 
         'element' in value && 
         value.element instanceof HTMLElement;
}

/**
 * Creates a document fragment for faster DOM operations when appending multiple children
 * @returns DocumentFragment
 */
function createFragment(): DocumentFragment {
  return document.createDocumentFragment();
}

/**
 * Processes className options to add prefix if needed
 * Correctly handles BEM notation by only prefixing the block part
 * @param options Element options
 * @returns Updated options with prefixed classNames
 */
function processClassNames(options: Record<string, any>): Record<string, any> {
  if (!options) return options;
  
  const processed = { ...options };
  
  // Process className property
  if (processed.className && typeof processed.className === 'string') {
    // Split className by spaces to process each class separately
    const classes = processed.className.split(' ').map(cls => {
      // Skip classes that already have the prefix
      if (cls.startsWith(`${PREFIX}-`)) {
        return cls;
      }
      
      // For BEM classes (with __ or --), only prefix the block part
      if (cls.includes('__')) {
        // This is a BEM element, prefix only the block part
        const [block, element] = cls.split('__');
        return `${PREFIX}-${block}__${element}`;
      } else if (cls.includes('--')) {
        // This is a BEM modifier, prefix only the block part
        const [block, modifier] = cls.split('--');
        return `${PREFIX}-${block}--${modifier}`;
      }
      
      // Regular class, add prefix
      return `${PREFIX}-${cls}`;
    });
    
    processed.className = classes.join(' ');
  }
  
  return processed;
}

/**
 * Creates a DOM or component structure based on a structure definition
 * @param definition Structure definition object
 * @param parentElement Optional parent element to attach structure to
 * @returns Object containing the structure and utility functions
 */
export default function createStructure(
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

/**
 * Creates a result object with the structure and utility functions
 * @param structure The raw structure object
 * @returns Result object with structure and utility functions
 */
function createStructureResult(structure: Record<string, any>): StructureResult {
  return {
    // Raw structure object
    structure,
    
    // Root element reference for convenience
    element: structure.element,
    
    component: flattenStructure(structure),

    /**
     * Gets a component by name
     * @param name Component name
     * @returns Component if found, null otherwise
     */
    get: (name: string): any => {
      return structure[name] || null;
    },
    
    /**
     * Gets all components in a flattened map
     * @returns Object with all components
     */
    getAll: (): Record<string, any> => {
      return flattenStructure(structure);
    },
    
    /**
     * Destroys the structure, cleaning up all components
     */
    destroy: (): void => {
      // Clean up the root element if it exists
      if (structure.element) {
        // If element is a component with a destroy method, call it
        if (isComponentLike(structure.element) && typeof structure.element.destroy === 'function') {
          structure.element.destroy();
        } 
        // Otherwise, if it's a DOM element or component, remove it from the DOM
        else if (isComponentLike(structure.element) && structure.element.element.parentNode) {
          structure.element.element.parentNode.removeChild(structure.element.element);
        }
        else if (structure.element instanceof HTMLElement && structure.element.parentNode) {
          structure.element.parentNode.removeChild(structure.element);
        }
      }
      
      // Clean up all other components in the structure
      Object.keys(structure).forEach(key => {
        if (key === 'element') {
          return; // Already handled element
        }
        
        const item = structure[key];
        
        // Handle component objects
        if (isComponentLike(item) && typeof item.destroy === 'function') {
          item.destroy();
        }
        // Handle DOM elements
        else if (item instanceof HTMLElement && item.parentNode) {
          item.parentNode.removeChild(item);
        }
      });
    }
  };
}

/**
 * Flattens a nested structure into a simple object with element and component references
 * Optimized version that avoids unnecessary type checks where possible
 * @param structure Structure object
 * @returns Flattened structure with all elements and components
 */
export function flattenStructure(structure: Record<string, any>): Record<string, any> {
  const flattened: Record<string, any> = Object.create(null);
  const keys = Object.keys(structure);
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = structure[key];
    
    // Fast path for common cases
    if (value instanceof HTMLElement || 
        (value && typeof value === 'object' && 'element' in value)) {
      flattened[key] = value;
      continue;
    }
    
    // Skip functions and other non-element/component objects
    if (typeof value !== 'function' && 
        (value instanceof Element || isComponentLike(value))) {
      flattened[key] = value;
    }
  }
  
  return flattened;
}