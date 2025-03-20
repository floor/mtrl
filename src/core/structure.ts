// src/core/structure.ts
import { isObject } from './utils/object';

/**
 * Element creator function type
 */
export type ElementCreator = (options: any) => HTMLElement;

/**
 * Options for a structure node
 */
export interface StructureNodeOptions {
  /** Unique name identifier for the node */
  name: string;
  /** Element creator function */
  creator: ElementCreator;
  /** Options to pass to the creator function */
  options: Record<string, any>;
  /** Nested children elements */
  children?: Record<string, StructureNodeOptions>;
}

/**
 * Structure node with its created DOM element
 */
export interface StructureNode {
  /** Node name */
  name: string;
  /** DOM element */
  element: HTMLElement;
  /** Child structure nodes */
  children: Record<string, StructureNode>;
}

/**
 * Creates DOM structure from a structure definition object
 * 
 * @param structure - Structure definition object
 * @param container - Optional container to append to
 * @returns Structure node with created DOM elements
 */
export function createStructure(
  structure: Record<string, StructureNodeOptions>,
  container?: HTMLElement
): Record<string, StructureNode> {
  const result: Record<string, StructureNode> = {};
  const fragment = document.createDocumentFragment();
  
  // Process each top level node
  Object.entries(structure).forEach(([key, options]) => {
    const node = createStructureNode(options);
    result[key] = node;
    fragment.appendChild(node.element);
  });
  
  // Append to container if provided
  if (container && fragment.hasChildNodes()) {
    container.appendChild(fragment);
  }
  
  return result;
}

/**
 * Creates a structure node and its children recursively
 * 
 * @param options - Node options
 * @returns Structure node with element and children
 */
function createStructureNode(options: StructureNodeOptions): StructureNode {
  // Create the element using the provided creator function
  const element = options.creator(options.options);
  
  // Process children recursively
  const children: Record<string, StructureNode> = {};
  if (options.children) {
    Object.entries(options.children).forEach(([childKey, childOptions]) => {
      const childNode = createStructureNode(childOptions);
      children[childKey] = childNode;
      element.appendChild(childNode.element);
    });
  }
  
  return {
    name: options.name,
    element,
    children
  };
}

// src/core/structure.ts
/**
 * Flattens a nested structure object into a single-level object
 * 
 * @param structure - Structure node
 * @returns Flattened structure with component elements
 */
export function flattenStructure(
  structure: Record<string, StructureNode>
): Record<string, HTMLElement> {
  const result: Record<string, HTMLElement> = {};
  
  function processNode(node: StructureNode, path: string[] = []) {
    // Add this node to the result
    const nodePath = path.length ? [...path, node.name].join('.') : node.name;
    result[nodePath] = node.element;
    
    // Process children
    Object.entries(node.children).forEach(([childKey, childNode]) => {
      const newPath = path.length ? [...path, node.name] : [node.name];
      processNode(childNode, newPath);
    });
  }
  
  // Process each top-level node
  Object.entries(structure).forEach(([key, node]) => {
    processNode(node);
  });
  
  // Add special entries for commonly accessed elements to make them available at top level
  // This lets us access both 'container.track' and just 'track' as needed
  Object.keys(result).forEach(key => {
    if (key.includes('.')) {
      const parts = key.split('.');
      const simpleName = parts[parts.length - 1];
      
      // Only add if it doesn't already exist to avoid overriding top-level elements
      if (!result[simpleName]) {
        result[simpleName] = result[key];
      }
    }
  });
  
  return result;
}