// src/core/utils/index.ts

export { isObject, byString } from './object';
export { normalizeEvent, hasTouchSupport, TOUCH_CONFIG, PASSIVE_EVENTS } from './mobile';
export { getInheritedBackground } from './background';
export { throttle, debounce, once } from './performance';

/**
 * Normalizes class names by handling various input formats
 * @param {...(string|string[])} classes - Classes to normalize
 * @returns {string[]} Array of unique, non-empty class names
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
 * Creates a transformer that only runs if a condition is met
 * @param {Function} predicate - Condition to check
 * @param {Function} transformer - Transformer to run if condition is true
 * @returns {Function} Conditional transformer
 */
export const when = <T, C>(
  predicate: (obj: T, context: C) => boolean, 
  transformer: (obj: T, context: C) => T
) => 
  (obj: T, context: C): T =>
    predicate(obj, context) ? transformer(obj, context) : obj;

/**
 * Joins class names, filtering out falsy values
 * @param {...(string | undefined | null | false)} classes - Class names to join
 * @returns {string} Joined class names
 */
export const classNames = (...classes: (string | undefined | null | false)[]): string => 
  classes.filter(Boolean).join(' ');