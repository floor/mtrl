// src/core/build/icon.js
/**
 * @module core/build
 */

/**
 * Creates an icon DOM element
 * @memberof module:core/build
 * @private
 * @param {string} html - Icon HTML content
 * @param {Object} [options] - Icon options
 * @param {string} [options.prefix='mtrl'] - Class prefix
 * @param {string} [options.class] - Additional CSS class
 * @param {string} [options.size] - Icon size variant
 * @returns {HTMLElement} Icon element
 */
const createIconElement = (html, options = {}) => {
  const PREFIX = options.prefix || 'mtrl'
  const element = document.createElement('span')
  element.className = `${PREFIX}-icon`

  if (options.class) {
    element.classList.add(options.class)
  }
  if (options.size) {
    element.classList.add(`${PREFIX}-icon--${options.size}`)
  }

  element.innerHTML = html
  return element
}

/**
 * Creates an icon manager for a component
 * @memberof module:core/build
 * @function createIcon
 * @param {HTMLElement} element - Parent element
 * @param {Object} [config] - Icon configuration
 * @param {string} [config.prefix='mtrl'] - Class prefix
 * @param {string} [config.type='component'] - Component type
 * @param {string} [config.position] - Icon position ('start' or 'end')
 * @returns {Object} Icon manager interface
 * @property {Function} setIcon - Sets icon content
 * @property {Function} getIcon - Gets current icon content
 * @property {Function} getElement - Gets icon element
 */
export const createIcon = (element, config = {}) => {
  let iconElement = null
  const PREFIX = config.prefix || 'mtrl'

  return {
    setIcon (html) {
      if (!iconElement && html) {
        iconElement = createIconElement(html, {
          prefix: PREFIX,
          class: `${PREFIX}-${config.type || 'component'}-icon`,
          size: config.iconSize
        })
        if (config.position === 'end') {
          element.appendChild(iconElement)
        } else {
          element.insertBefore(iconElement, element.firstChild)
        }
      } else if (iconElement && html) {
        iconElement.innerHTML = html
      }
      return this
    },

    getIcon () {
      return iconElement ? iconElement.innerHTML : ''
    },

    getElement () {
      return iconElement
    }
  }
}
