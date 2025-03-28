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
 * Supports BEM naming conventions when enabled
 * 
 * @param options - Element options
 * @param skipPrefix - Whether to skip adding prefixes
 * @param useBEM - Whether to respect BEM naming conventions
 * @returns Updated options with prefixed classNames
 */
export function processClassNames(
  options: Record<string, any>, 
  skipPrefix: boolean = false,
  useBEM: boolean = false
): Record<string, any> {
  // Fast path - if no options or skipping prefix, return as is
  if (!options || skipPrefix) return { ...options };
  
  // Clone options to avoid mutating the original
  const processed = { ...options };
  
  /**
   * Processes a single class name with optional BEM handling
   * 
   * @param cls - Class name to process
   * @returns Processed class name with prefix
   */
  const processClass = (cls: string): string => {
    // Already prefixed - leave it as is
    if (cls.startsWith(`${PREFIX}-`)) {
      return cls;
    }
    
    if (useBEM) {
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
    }
    
    // Standard case - prefix the entire class name
    return `${PREFIX}-${cls}`;
  };
  
  /**
   * Process a class property (either 'class' or 'className')
   * 
   * @param prop - Property name to process
   */
  const processProperty = (prop: string): void => {
    if (!processed[prop]) return;
    
    // Handle string class names
    if (typeof processed[prop] === 'string') {
      processed[prop] = processed[prop]
        .split(' ')
        .map(cls => cls ? processClass(cls) : '')
        .filter(Boolean)
        .join(' ');
    }
    // Handle array class names
    else if (Array.isArray(processed[prop])) {
      processed[prop] = processed[prop]
        .map(cls => typeof cls === 'string' ? processClass(cls) : cls)
        .filter(Boolean)
        .join(' ');
    }
  };
  
  // Process both possible class properties for compatibility
  processProperty('class');
  processProperty('className');
  
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