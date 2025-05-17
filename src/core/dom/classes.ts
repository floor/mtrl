// src/core/dom/classes.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities optimized for performance
 */

import { PREFIX } from '../config';

// Constant for prefix with dash for better performance
const PREFIX_WITH_DASH = `${PREFIX}-`;


/**
 * Normalizes class names input by handling various formats:
 * - String with space-separated classes
 * - Array of strings
 * - Mixed array of strings and space-separated classes
 * 
 * @param classes - Classes to normalize
 * @returns Array of unique, non-empty class names
 */
export const normalizeClasses = (...classes: (string | string[])[]): string[] => {
  // Process the input classes
  const processedClasses = classes
    .flat()
    .reduce((acc: string[], cls) => {
      if (typeof cls === 'string') {
        // Split space-separated classes and add them individually
        acc.push(...cls.split(/\s+/));
      }
      return acc;
    }, [])
    .filter(Boolean); // Remove empty strings
  
  // Create a Set and convert back to array without spread operator
  const uniqueClasses = new Set<string>();
  processedClasses.forEach(cls => uniqueClasses.add(cls));
  
  return Array.from(uniqueClasses);
};

/**
 * Adds multiple classes to an element
 * Automatically adds prefix to classes that don't already have it
 * Optimized for minimal array operations and DOM interactions
 * 
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to add
 * @returns {HTMLElement} Modified element
 */
export const addClass = (element: HTMLElement, ...classes: (string | string[])[]): HTMLElement => {
  const normalizedClasses = normalizeClasses(...classes);
  
  // Early return for empty classes
  if (!normalizedClasses.length) return element;
  
  // Using DOMTokenList's add() with multiple arguments is faster than multiple add() calls
  // But we need to handle prefixing first
  const prefixedClasses: string[] = [];
  
  for (let i = 0; i < normalizedClasses.length; i++) {
    const cls = normalizedClasses[i];
    if (!cls) continue;
    
    prefixedClasses.push(
      cls.startsWith(PREFIX_WITH_DASH) ? cls : PREFIX_WITH_DASH + cls
    );
  }
  
  // Add all classes in a single operation if possible
  if (prefixedClasses.length) {
    element.classList.add(...prefixedClasses);
  }
  
  return element;
};

/**
 * Removes multiple classes from an element
 * Handles only exact class names as specified (no automatic prefixing)
 * For better performance, clients should know exactly which classes to remove
 * 
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to remove
 * @returns {HTMLElement} Modified element
 */
export const removeClass = (element: HTMLElement, ...classes: (string | string[])[]): HTMLElement => {
  const normalizedClasses = normalizeClasses(...classes);
  
  // Early return for empty classes
  if (!normalizedClasses.length) return element;
  
  // Prepare prefixed class names
  const prefixedClasses: string[] = [];
  
  for (let i = 0; i < normalizedClasses.length; i++) {
    const cls = normalizedClasses[i];
    if (!cls) continue;
    
    // Only add the prefixed version
    prefixedClasses.push(
      cls.startsWith(PREFIX_WITH_DASH) ? cls : PREFIX_WITH_DASH + cls
    );
  }
  
  // Remove all classes in a single operation if possible
  if (prefixedClasses.length) {
    element.classList.remove(...prefixedClasses);
  }
  
  return element;
};

/**
 * Toggles multiple classes on an element
 * Automatically adds prefix to classes that don't already have it
 * 
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to toggle
 * @returns {HTMLElement} Modified element
 */
export const toggleClass = (element: HTMLElement, ...classes: (string | string[])[]): HTMLElement => {
  const normalizedClasses = normalizeClasses(...classes);
  
  for (let i = 0; i < normalizedClasses.length; i++) {
    const cls = normalizedClasses[i];
    if (!cls) continue;
    
    const prefixedClass = cls.startsWith(PREFIX_WITH_DASH) ? cls : PREFIX_WITH_DASH + cls;
    element.classList.toggle(prefixedClass);
  }
  
  return element;
};

/**
 * Checks if an element has all specified classes
 * Automatically adds prefix to classes that don't already have it
 * 
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to check
 * @returns {boolean} True if element has all specified classes
 */
export const hasClass = (element: HTMLElement, ...classes: (string | string[])[]): boolean => {
  const normalizedClasses = normalizeClasses(...classes);
  
  // Early return for empty classes (technically all are present)
  if (!normalizedClasses.length) return true;
  
  for (let i = 0; i < normalizedClasses.length; i++) {
    const cls = normalizedClasses[i];
    if (!cls) continue;
    
    const prefixedClass = cls.startsWith(PREFIX_WITH_DASH) ? cls : PREFIX_WITH_DASH + cls;
    if (!element.classList.contains(prefixedClass)) {
      return false;
    }
  }
  
  return true;
};