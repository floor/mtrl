// src/core/structure/utils.ts
/**
 * @module core/structure
 * @description Optimized utility functions for structure creation
 */

import { PREFIX } from '../config';
import { ComponentLike } from './types';

/**
 * Checks if a value is a component object (has an element property)
 * Optimized fast path check by only validating that element property exists
 * 
 * @param value - Value to check
 * @returns True if the value is a component-like object
 */
export function isComponent(value: any): value is ComponentLike {
  return value && 
         typeof value === 'object' && 
         'element' in value;
}

/**
 * Creates a document fragment for faster DOM operations
 * 
 * @returns New DocumentFragment
 */
export function createFragment(): DocumentFragment {
  return document.createDocumentFragment();
}

/**
 * Processes className options to add prefix if needed
 * Optimized version with fewer conditional branches
 * 
 * @param options - Element options
 * @param skipPrefix - Whether to skip adding prefixes
 * @returns Updated options with prefixed classNames
 */
export function processClassNames(
  options: Record<string, any>, 
  skipPrefix: boolean = false
): Record<string, any> {
  // Fast path - if no options, no className, or skipping prefix
  if (!options || !options.className || skipPrefix) return { ...options };
  
  // Clone options to avoid mutating the original
  const processed = { ...options };
  
  // Handle string className
  if (typeof processed.className === 'string') {
    // Split and map in a single operation
    processed.className = processed.className
      .split(' ')
      .map(cls => cls.startsWith(`${PREFIX}-`) ? cls : `${PREFIX}-${cls}`)
      .join(' ');
  }
  // Handle array className
  else if (Array.isArray(processed.className)) {
    processed.className = processed.className
      .map(cls => typeof cls === 'string' && !cls.startsWith(`${PREFIX}-`) ? `${PREFIX}-${cls}` : cls)
      .join(' ');
  }
  
  return processed;
}

/**
 * Flattens a nested structure into a simple object with element and component references
 * Optimized by using a direct property access loop and early exits
 * 
 * @param structure - Structure object
 * @returns Flattened structure with all elements and components
 */
export function flattenStructure(structure: Record<string, any>): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  for (const key in structure) {
    const value = structure[key];
    
    // Only include components, elements, and non-functions
    // Fast path with fewer type checks
    if (value && 
        typeof value !== 'function' && 
        (value instanceof HTMLElement || 'element' in value)) {
      flattened[key] = value;
    }
  }
  
  return flattened;
}