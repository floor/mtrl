// src/core/dom/attributes.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

/**
 * Sets multiple attributes on an element
 * @memberof module:core/dom
 * @function setAttributes
 * @param {HTMLElement} element - Target element
 * @param {Record<string, any>} attrs - Attributes to set
 * @returns {HTMLElement} Modified element
 */
export const setAttributes = (element: HTMLElement, attrs: Record<string, any> = {}): HTMLElement => {
  Object.entries(attrs).forEach(([key, value]) => {
    if (value != null) element.setAttribute(key, value.toString());
  });
  return element;
};

/**
 * Removes multiple attributes from an element
 * @memberof module:core/dom
 * @function removeAttributes
 * @param {HTMLElement} element - Target element
 * @param {string[]} attrs - Attributes to remove
 * @returns {HTMLElement} Modified element
 */
export const removeAttributes = (element: HTMLElement, attrs: string[] = []): HTMLElement => {
  attrs.forEach(attr => element.removeAttribute(attr));
  return element;
};