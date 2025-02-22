// src/core/build/text.js
/**
 * @module core/build
 */

/**
 * Creates a text manager for a component
 * @memberof module:core/build
 * @function createText
 * @param {HTMLElement} element - Parent element
 * @param {Object} [config] - Text configuration
 * @param {string} [config.prefix='mtrl'] - Class prefix
 * @param {string} [config.type='component'] - Component type
 * @param {HTMLElement} [config.beforeElement] - Element to insert before
 * @returns {Object} Text manager interface
 * @property {Function} setText - Sets text content
 * @property {Function} getText - Gets current text
 * @property {Function} getElement - Gets text element
 */
export const createText = (element, config = {}) => {
  let textElement = null
  const PREFIX = config.prefix || 'mtrl'

  const createElement = (content) => {
    const span = document.createElement('span')
    span.className = `${PREFIX}-${config.type || 'component'}-text`
    span.textContent = content
    return span
  }

  return {
    setText (text) {
      if (!textElement && text) {
        textElement = createElement(text)
        if (config.beforeElement) {
          element.insertBefore(textElement, config.beforeElement)
        } else {
          element.appendChild(textElement)
        }
      } else if (textElement) {
        textElement.textContent = text
      }
      return this
    },

    getText () {
      return textElement ? textElement.textContent : ''
    },

    getElement () {
      return textElement
    }
  }
}
