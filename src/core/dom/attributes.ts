// src/core/dom/attributes.ts
/**
 * @module core/dom
 * @description DOM attribute helpers
 */

/**
 * Sets attributes on an HTML element
 * 
 * @param {HTMLElement} element - Element to set attributes on
 * @param {Record<string, any>} attributes - Attributes to set
 * @returns {HTMLElement} The element for chaining
 */
export const setAttributes = (element: HTMLElement, attributes: Record<string, any> = {}): HTMLElement => {
  Object.entries(attributes).forEach(([key, value]) => {
    // Skip null/undefined values
    if (value === null || value === undefined) return;
    
    element.setAttribute(key, String(value));
  });
  
  return element;
};

/**
 * Removes attributes from an HTML element
 * 
 * @param {HTMLElement} element - Element to remove attributes from
 * @param {string[]} attributes - Attributes to remove
 * @returns {HTMLElement} The element for chaining
 */
export const removeAttributes = (element: HTMLElement, attributes: string[] = []): HTMLElement => {
  attributes.forEach(attr => element.removeAttribute(attr));
  
  return element;
};