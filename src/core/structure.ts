// src/core/structure.ts
import { createElement } from './dom/create';

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

export interface StructureDefinition {
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
 * Creates a DOM or component structure based on a structure definition
 * @param definition Structure definition object
 * @param parentElement Optional parent element to attach structure to
 * @returns Object containing the structure and utility functions
 */
export default function createStructure(
  definition: StructureDefinition, 
  parentElement: HTMLElement | null = null
): StructureResult {
  // Use object literal instead of empty object for faster property access
  const structure: Record<string, any> = Object.create(null);
  
  // Special case for root component creation
  if (definition.element && !parentElement) {
    const elementDef = definition.element;
    const createElementFn = elementDef.creator || createElement;
    const rootComponent = createElementFn(elementDef.options);
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
  const keys = Object.keys(definition);
  const keyLength = keys.length;
  
  // Pre-allocate arrays for better performance
  const elements = new Array(keyLength);
  const childStructuresToMerge = [];
  
  // First pass: create all elements
  for (let i = 0; i < keyLength; i++) {
    const key = keys[i];
    const def = definition[key];
    
    // Skip if no definition
    if (!def) {
      elements[i] = null;
      continue;
    }
    
    // Create the element
    const createElementFn = def.creator || createElement;
    const created = createElementFn(def.options);
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
    const def = definition[key];
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