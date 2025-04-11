// src/core/layout/utils.ts
/**
 * @module core/layout
 * @description Utility functions for layout creation
 */

import { PREFIX } from '../config';
import { ComponentLike } from './types';
import { normalizeClasses as normalizeClassesUtil } from '../utils';

/**
 * Checks if a value is a component object (has an element property)
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
 * Normalizes class values into an array of strings
 */
export function normalizeClasses(...classes: (string | string[])[]): string[] {
  return normalizeClassesUtil(...classes);
}

// Constant for prefix with dash
const PREFIX_WITH_DASH = `${PREFIX}-`;

/**
 * Processes className options to add prefix if needed
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
  // Fast path - if no options or skipping prefix, return a new object
  if (!options || skipPrefix) return { ...options };
  
  // Avoid unnecessary clone if no class properties exist
  const hasClassProps = options.class || options.className || options.rawClass;
  if (!hasClassProps) return { ...options };
  
  // Create clone only once
  const processed = { ...options };
  
  // Unify class and className as aliases
  if (processed.className) {
    if (!processed.class) {
      // Simple transfer if only className exists
      processed.class = processed.className;
    } else {
      // Merge if both exist
      const classNames = normalizeClasses([processed.class, processed.className]);
      processed.class = classNames.join(' ');
    }
    // Always remove className after processing
    delete processed.className;
  }
  
  // Process prefixed classes
  if (processed.class && !skipPrefix) {
    // Handle string format
    if (typeof processed.class === 'string') {
      const classes = processed.class.split(/\s+/).filter(Boolean);
      
      if (useBEM) {
        // Handle BEM notation with special prefixing rules
        processed.class = classes.map(cls => {
          if (!cls || cls.startsWith(PREFIX_WITH_DASH)) return cls;
          
          if (cls.includes('__')) {
            const [block, element] = cls.split('__');
            return `${PREFIX_WITH_DASH}${block}__${element}`;
          } else if (cls.includes('--')) {
            const [block, modifier] = cls.split('--');
            return `${PREFIX_WITH_DASH}${block}--${modifier}`;
          }
          
          return `${PREFIX_WITH_DASH}${cls}`;
        }).join(' ');
      } else {
        // Standard prefix handling
        processed.class = classes.map(cls => 
          cls && !cls.startsWith(PREFIX_WITH_DASH) ? `${PREFIX_WITH_DASH}${cls}` : cls
        ).filter(Boolean).join(' ');
      }
    } 
    // Handle array format
    else if (Array.isArray(processed.class)) {
      processed.class = processed.class
        .filter(Boolean)
        .map(cls => typeof cls === 'string' && !cls.startsWith(PREFIX_WITH_DASH) ? 
          `${PREFIX_WITH_DASH}${cls}` : cls)
        .join(' ');
    }
  }
  
  return processed;
}

/**
 * Flattens a nested layout into a simple object with element and component references
 * 
 * @param layout - Layout object
 * @returns Flattened layout with all elements and components
 */
export function flattenLayout(layout: Record<string, any>): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  // Fast path - return empty object for empty layout
  if (!layout || typeof layout !== 'object') return flattened;
  
  for (const key in layout) {
    const value = layout[key];
    
    // Only include components, elements, and non-functions
    if (value && 
        typeof value !== 'function' && 
        (value instanceof HTMLElement || isComponent(value))) {
      flattened[key] = value;
    }
  }
  
  return flattened;
}
