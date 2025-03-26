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
  // Fast path - just check for element property existence first
  return value && typeof value === 'object' && 'element' in value;
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
  const flattened = {};
  for (const key in structure) {
    const value = structure[key];
    // Only include components and elements, skip functions and primitives
    if (value && typeof value === 'object' && ('element' in value || value instanceof HTMLElement)) {
      flattened[key] = value;
    }
  }
  return flattened;
}