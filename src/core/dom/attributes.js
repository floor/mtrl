// src/core/dom/attributes.js
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

/**
 * Sets multiple attributes on an element
 * @memberof module:core/dom
 * @function setAttributes
 * @param {HTMLElement} element - Target element
 * @param {Object} attrs - Attributes to set
 * @returns {HTMLElement} Modified element
 */
export const setAttributes = (element, attrs = {}) => {
  Object.entries(attrs).forEach(([key, value]) => {
    if (value != null) element.setAttribute(key, value)
  })
  return element
}

/**
 * Removes multiple attributes from an element
 * @memberof module:core/dom
 * @function removeAttributes
 * @param {HTMLElement} element - Target element
 * @param {string[]} attrs - Attributes to remove
 * @returns {HTMLElement} Modified element
 */
export const removeAttributes = (element, attrs = []) => {
  attrs.forEach(attr => element.removeAttribute(attr))
  return element
}
