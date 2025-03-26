// src/core/structure/utils.ts
/**
 * @module core/structure
 * @description Utility functions for structure creation
 */

import { PREFIX } from '../config';
import { ComponentLike } from './types';

/**
 * Checks if a value is a component object (has an element property)
 * Uses a fast property check before the instanceof check
 * 
 * @param value - Value to check
 * @returns True if the value is a component-like object
 */
export function isComponent(value: any): value is ComponentLike {
  return value && 
         typeof value === 'object' && 
         'element' in value && 
         value.element instanceof HTMLElement;
}

/**
 * Creates a document fragment for faster DOM operations when appending multiple children
 * 
 * @returns New DocumentFragment
 */
export function createFragment(): DocumentFragment {
  return document.createDocumentFragment();
}

/**
 * Processes className options to add prefix if needed
 * 
 * @param options - Element options
 * @returns Updated options with prefixed classNames
 */
export function processClassNames(options: Record<string, any>): Record<string, any> {
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
      
      // // For BEM classes (with __ or --), only prefix the block part
      // if (cls.includes('__')) {
      //   // This is a BEM element, prefix only the block part
      //   const [block, element] = cls.split('__');
      //   return `${PREFIX}-${block}__${element}`;
      // } else if (cls.includes('--')) {
      //   // This is a BEM modifier, prefix only the block part
      //   const [block, modifier] = cls.split('--');
      //   return `${PREFIX}-${block}--${modifier}`;
      // }

      // Regular class, add prefix
      return `${PREFIX}-${cls}`;
    });
    
    processed.className = classes.join(' ');
  }
  
  return processed;
}

/**
 * Flattens a nested structure into a simple object with element and component references
 * Optimized version that avoids unnecessary type checks where possible
 * 
 * @param structure - Structure object
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
        (value instanceof Element || isComponent(value))) {
      flattened[key] = value;
    }
  }
  
  return flattened;
}