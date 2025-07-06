// src/core/dom/classes.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities optimized for performance
 */

import { PREFIX } from "../config";

// Constant for prefix with dash for better performance
const PREFIX_WITH_DASH = `${PREFIX}-`;

// Cache for frequently used class combinations to avoid repeated processing
const classCache = new Map<string, string[]>();
const MAX_CACHE_SIZE = 500;

/**
 * Normalize classes to array of unique strings with optimization and caching
 * - String with space-separated classes
 * - Array of strings
 * - Mixed array of strings and space-separated classes
 *
 * @param {...(string | string[])} classes - Classes to normalize
 * @returns {string[]} Array of unique, non-empty class names
 */
export const normalizeClasses = (
  ...classes: (string | string[])[]
): string[] => {
  // Fast path 1: Empty input
  if (classes.length === 0) return [];

  // Fast path 2: Single string without spaces - most common case
  if (classes.length === 1 && typeof classes[0] === "string") {
    const input = classes[0];
    if (!input) return [];
    if (!input.includes(" ")) return [input];

    // Check cache for single string with spaces
    if (classCache.has(input)) {
      return classCache.get(input)!;
    }
  }

  // Optimized processing - single pass with minimal allocations
  const seen = new Set<string>();
  const result: string[] = [];

  for (const cls of classes) {
    if (typeof cls === "string" && cls) {
      // Fast path for single class
      if (!cls.includes(" ")) {
        if (!seen.has(cls)) {
          seen.add(cls);
          result.push(cls);
        }
      } else {
        // Split space-separated classes efficiently
        cls.split(" ").forEach((c) => {
          const trimmed = c.trim();
          if (trimmed && !seen.has(trimmed)) {
            seen.add(trimmed);
            result.push(trimmed);
          }
        });
      }
    } else if (Array.isArray(cls)) {
      // Process array of classes
      cls.forEach((c) => {
        if (typeof c === "string" && c && !seen.has(c)) {
          seen.add(c);
          result.push(c);
        }
      });
    }
  }

  // Cache result for single string inputs to avoid repeated processing
  if (
    classes.length === 1 &&
    typeof classes[0] === "string" &&
    result.length <= 10
  ) {
    if (classCache.size < MAX_CACHE_SIZE) {
      classCache.set(classes[0], result);
    }
  }

  return result;
};

/**
 * Add prefixed classes to element with optimizations
 * Automatically adds prefix to classes that don't already have it
 * Optimized for minimal DOM interactions and single-class scenarios
 *
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to add
 * @returns {HTMLElement} Modified element for chaining
 */
export const addClass = (
  element: HTMLElement,
  ...classes: (string | string[])[]
): HTMLElement => {
  // Fast path 1: Empty classes
  if (classes.length === 0) return element;

  // Handle the case where an array is passed directly (not spread)
  // This happens when addClass(element, ["class1", "class2"]) is called
  if (classes.length === 1 && Array.isArray(classes[0])) {
    return addClass(element, ...classes[0]);
  }

  // Fast path 2: Single string class - most common case
  if (classes.length === 1 && typeof classes[0] === "string") {
    const cls = classes[0];
    if (cls && !cls.includes(" ")) {
      const prefixed = cls.startsWith(PREFIX_WITH_DASH)
        ? cls
        : PREFIX_WITH_DASH + cls;
      // Safety check: ensure no spaces were introduced by prefixing
      if (!prefixed.includes(" ")) {
        element.classList.add(prefixed);
        return element;
      }
    }
  }

  // Full processing for complex cases
  const normalized = normalizeClasses(...classes);
  for (const cls of normalized) {
    const prefixed = cls.startsWith(PREFIX_WITH_DASH)
      ? cls
      : PREFIX_WITH_DASH + cls;

    // Safety check: ensure no spaces in class token (prevents DOMTokenList errors)
    if (prefixed.includes(" ")) {
      // Split further if needed (shouldn't happen if normalizeClasses works correctly)
      prefixed.split(" ").forEach((c) => {
        const trimmed = c.trim();
        if (trimmed) element.classList.add(trimmed);
      });
    } else {
      element.classList.add(prefixed);
    }
  }

  return element;
};

/**
 * Remove prefixed classes from element with optimizations
 * Handles exact class names as specified with automatic prefixing
 * Optimized for single-class scenarios and batch operations
 *
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to remove
 * @returns {HTMLElement} Modified element for chaining
 */
export const removeClass = (
  element: HTMLElement,
  ...classes: (string | string[])[]
): HTMLElement => {
  // Fast path 1: Empty classes
  if (classes.length === 0) return element;

  // Handle the case where an array is passed directly (not spread)
  if (classes.length === 1 && Array.isArray(classes[0])) {
    return removeClass(element, ...classes[0]);
  }

  // Fast path 2: Single string class - most common case
  if (classes.length === 1 && typeof classes[0] === "string") {
    const cls = classes[0];
    if (cls && !cls.includes(" ")) {
      const prefixed = cls.startsWith(PREFIX_WITH_DASH)
        ? cls
        : PREFIX_WITH_DASH + cls;
      // Safety check: ensure no spaces were introduced by prefixing
      if (!prefixed.includes(" ")) {
        element.classList.remove(prefixed);
        return element;
      }
    }
  }

  // Full processing for complex cases
  const normalized = normalizeClasses(...classes);
  for (const cls of normalized) {
    const prefixed = cls.startsWith(PREFIX_WITH_DASH)
      ? cls
      : PREFIX_WITH_DASH + cls;

    // Safety check: ensure no spaces in class token
    if (prefixed.includes(" ")) {
      prefixed.split(" ").forEach((c) => {
        const trimmed = c.trim();
        if (trimmed) element.classList.remove(trimmed);
      });
    } else {
      element.classList.remove(prefixed);
    }
  }

  return element;
};

/**
 * Toggle prefixed classes on element with optimizations
 * Automatically adds prefix to classes that don't already have it
 * Optimized for single-class scenarios
 *
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to toggle
 * @returns {HTMLElement} Modified element for chaining
 */
export const toggleClass = (
  element: HTMLElement,
  ...classes: (string | string[])[]
): HTMLElement => {
  // Handle the case where an array is passed directly (not spread)
  if (classes.length === 1 && Array.isArray(classes[0])) {
    return toggleClass(element, ...classes[0]);
  }

  // Fast path: Single string class - most common case
  if (classes.length === 1 && typeof classes[0] === "string") {
    const cls = classes[0];
    if (cls && !cls.includes(" ")) {
      const prefixed = cls.startsWith(PREFIX_WITH_DASH)
        ? cls
        : PREFIX_WITH_DASH + cls;
      // Safety check: ensure no spaces were introduced by prefixing
      if (!prefixed.includes(" ")) {
        element.classList.toggle(prefixed);
        return element;
      }
    }
  }

  // Full processing for complex cases
  const normalized = normalizeClasses(...classes);
  for (const cls of normalized) {
    const prefixed = cls.startsWith(PREFIX_WITH_DASH)
      ? cls
      : PREFIX_WITH_DASH + cls;

    // Safety check: ensure no spaces in class token
    if (prefixed.includes(" ")) {
      prefixed.split(" ").forEach((c) => {
        const trimmed = c.trim();
        if (trimmed) element.classList.toggle(trimmed);
      });
    } else {
      element.classList.toggle(prefixed);
    }
  }

  return element;
};

/**
 * Check if element has all specified prefixed classes with optimizations
 * Automatically adds prefix to classes that don't already have it
 * Returns true only if ALL specified classes are present
 *
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to check
 * @returns {boolean} True if element has all specified classes
 */
export const hasClass = (
  element: HTMLElement,
  ...classes: (string | string[])[]
): boolean => {
  // Fast path: Empty classes - vacuously true
  if (classes.length === 0) return true;

  // Handle the case where an array is passed directly (not spread)
  if (classes.length === 1 && Array.isArray(classes[0])) {
    return hasClass(element, ...classes[0]);
  }

  // Fast path: Single string class - most common case
  if (classes.length === 1 && typeof classes[0] === "string") {
    const cls = classes[0];
    if (cls && !cls.includes(" ")) {
      const prefixed = cls.startsWith(PREFIX_WITH_DASH)
        ? cls
        : PREFIX_WITH_DASH + cls;
      // Safety check: ensure no spaces were introduced by prefixing
      if (!prefixed.includes(" ")) {
        return element.classList.contains(prefixed);
      }
    }
  }

  // Full processing for complex cases
  const normalized = normalizeClasses(...classes);
  for (const cls of normalized) {
    const prefixed = cls.startsWith(PREFIX_WITH_DASH)
      ? cls
      : PREFIX_WITH_DASH + cls;

    // Safety check: ensure no spaces in class token
    if (prefixed.includes(" ")) {
      // For hasClass, all space-separated tokens must exist
      const tokens = prefixed
        .split(" ")
        .map((c) => c.trim())
        .filter(Boolean);
      for (const token of tokens) {
        if (!element.classList.contains(token)) {
          return false;
        }
      }
    } else {
      if (!element.classList.contains(prefixed)) {
        return false;
      }
    }
  }

  return true;
};
