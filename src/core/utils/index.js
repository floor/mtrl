// src/core/utils/index.js

export { isObject, byString } from './object'

/**
 * Normalizes class names by handling various input formats
 * @param {...(string|string[])} classes - Classes to normalize
 * @returns {string[]} Array of unique, non-empty class names
 */
export const normalizeClasses = (...classes) => {
  return [...new Set(
    classes
      .flat()
      .reduce((acc, cls) => {
        if (typeof cls === 'string') {
          // Split space-separated classes and add them individually
          acc.push(...cls.split(/\s+/))
        }
        return acc
      }, [])
      .filter(Boolean) // Remove empty strings
  )]
}

/**
 * Creates a transformer that only runs if a condition is met
 * @param {Function} predicate - Condition to check
 * @param {Function} transformer - Transformer to run if condition is true
 * @returns {Function} Conditional transformer
 */
export const when = (predicate, transformer) => (obj, context) =>
  predicate(obj, context) ? transformer(obj, context) : obj

/**
 * Joins class names, filtering out falsy values
 * @param {...string} classes - Class names to join
 * @returns {string} Joined class names
 */
export const classNames = (...classes) => classes.filter(Boolean).join(' ')
