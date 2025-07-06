// src/core/dom/attributes.ts
/**
 * @module core/dom
 * @description DOM attribute helpers
 */

/**
 * Set attributes on an element with performance optimizations
 * Fast path for single attribute, efficient iteration for multiple
 *
 * @param {HTMLElement} element - Element to set attributes on
 * @param {Record<string, any>} attributes - Attributes to set
 * @returns {HTMLElement} The element for chaining
 */
export const setAttributes = (
  element: HTMLElement,
  attributes: Record<string, any> = {}
): HTMLElement => {
  if (!attributes) return element;

  // Fast path: single attribute - avoid Object.keys overhead
  const keys = Object.keys(attributes);
  if (keys.length === 1) {
    const value = attributes[keys[0]];
    if (value != null) {
      element.setAttribute(keys[0], String(value));
    }
    return element;
  }

  // General case: multiple attributes - for...in is faster than Object.entries
  for (const key in attributes) {
    const value = attributes[key];
    if (value != null) {
      element.setAttribute(key, String(value));
    }
  }

  return element;
};

/**
 * Remove attributes from an element
 * Standard for loop is fastest for array iteration
 *
 * @param {HTMLElement} element - Element to remove attributes from
 * @param {string[]} attributes - Attributes to remove
 * @returns {HTMLElement} The element for chaining
 */
export const removeAttributes = (
  element: HTMLElement,
  attributes: string[] = []
): HTMLElement => {
  // Standard for loop is fastest for array iteration
  for (let i = 0; i < attributes.length; i++) {
    element.removeAttribute(attributes[i]);
  }
  return element;
};

/**
 * Batch attribute operations for better performance when setting many attributes
 * Single pass through operations array for optimal performance
 *
 * @param {HTMLElement} element - Element to modify
 * @param {Array<{action: "set" | "remove", key: string, value?: any}>} operations - Array of attribute operations
 * @returns {HTMLElement} The element for chaining
 */
export const batchAttributes = (
  element: HTMLElement,
  operations: Array<{
    action: "set" | "remove";
    key: string;
    value?: any;
  }>
): HTMLElement => {
  // Process all operations in a single pass for optimal performance
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op.action === "set" && op.value != null) {
      element.setAttribute(op.key, String(op.value));
    } else if (op.action === "remove") {
      element.removeAttribute(op.key);
    }
  }
  return element;
};

/**
 * Check if element has attribute
 * @param element - Element to check
 * @param attribute - Attribute name to check
 * @returns True if element has the attribute
 */
export const hasAttribute = (
  element: HTMLElement,
  attribute: string
): boolean => element.hasAttribute(attribute);

/**
 * Get attribute value with default
 * @param element - Element to get attribute from
 * @param attribute - Attribute name
 * @param defaultValue - Default value if attribute doesn't exist
 * @returns Attribute value or default
 */
export const getAttribute = (
  element: HTMLElement,
  attribute: string,
  defaultValue: string = ""
): string => element.getAttribute(attribute) ?? defaultValue;
