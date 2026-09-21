import { omitsAttribute } from "../utils/attributes";
import { safeUrl, URL_ATTRIBUTES } from "../utils/url";
// src/core/dom/attributes.ts
/**
 * @module core/dom
 * @description DOM attribute helpers
 */

/**
 * Set attributes on an element with performance optimizations
 * Fast path for single attribute, efficient iteration for multiple
 *
 * @param {HTMLElement | SVGElement} element - Element to set attributes on
 * @param {object} attributes - Attributes to set
 * @returns {HTMLElement | SVGElement} The element for chaining
 */
export const setAttributes = <E extends HTMLElement | SVGElement>(
  element: E,
  attributes: object = {}
): E => {
  if (!attributes) return element;
  const values = attributes as Record<string, unknown>;

  // `style` is refused here. Writing it as an attribute takes a whole CSS
  // string, so one interpolated value can carry further declarations -- the
  // same injection route closed on createElement's own style option in
  // FLO-111. Leaving it open here would be a door beside a locked one.
  // Inline styles go through `style`, which assigns per property.

  // href, src and action are scheme-checked wherever they are set, so a javascript:
  // URL cannot become a styled control that runs script on click.
  const attributeValue = (key: string, value: unknown): string =>
    URL_ATTRIBUTES.has(key.toLowerCase()) ? safeUrl(String(value)) : String(value);

  // Fast path: single attribute - avoid Object.keys overhead
  const keys = Object.keys(attributes);
  if (keys.length === 1) {
    const value = values[keys[0]];
    if (
      value != null &&
      keys[0] !== "style" &&
      !omitsAttribute(keys[0], value)
    ) {
      element.setAttribute(keys[0], attributeValue(keys[0], value));
    }
    return element;
  }

  // General case: multiple attributes - for...in is faster than Object.entries
  for (const key in attributes) {
    const value = values[key];
    if (value != null && key !== "style" && !omitsAttribute(key, value)) {
      element.setAttribute(key, attributeValue(key, value));
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
 * @param {Array<{action: "set" | "remove", key: string, value?: unknown}>} operations - Array of attribute operations
 * @returns {HTMLElement} The element for chaining
 */
export const batchAttributes = (
  element: HTMLElement,
  operations: Array<{
    action: "set" | "remove";
    key: string;
    value?: unknown;
  }>
): HTMLElement => {
  // Process all operations in a single pass for optimal performance
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    // `style` is refused here too, for the reason given on setAttributes:
    // the attribute takes a whole CSS string and the style option does not.
    if (
      op.action === "set" &&
      op.value != null &&
      op.key !== "style" &&
      !omitsAttribute(op.key, op.value)
    ) {
      element.setAttribute(
        op.key,
        URL_ATTRIBUTES.has(op.key.toLowerCase()) ? safeUrl(String(op.value)) : String(op.value)
      );
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
