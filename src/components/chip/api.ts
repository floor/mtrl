// src/components/chip/api.js

/**
 * Enhances a chip component with API methods
 * @param {Object} options - API configuration options
 * @param {Object} options.disabled - Object containing enable/disable methods
 * @param {Object} options.lifecycle - Object containing lifecycle methods
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Chip component
 */
export const withAPI = ({ disabled, lifecycle }) => (component) => ({
  ...component,
  element: component.element,

  /**
   * Gets the chip's value
   * @returns {string} The chip's value attribute
   */
  getValue: () => component.element.getAttribute('data-value'),

  /**
   * Sets the chip's value
   * @param {string} value - Value to set
   * @returns {Object} The chip instance for chaining
   */
  setValue (value) {
    component.element.setAttribute('data-value', value)
    return this
  },

  /**
   * Enables the chip
   * @returns {Object} The chip instance for chaining
   */
  enable () {
    disabled.enable()
    component.element.setAttribute('aria-disabled', 'false')
    return this
  },

  /**
   * Disables the chip
   * @returns {Object} The chip instance for chaining
   */
  disable () {
    disabled.disable()
    component.element.setAttribute('aria-disabled', 'true')
    return this
  },

  /**
   * Sets the chip's text content
   * @param {string} content - Text content
   * @returns {Object} The chip instance for chaining
   */
  setText (content) {
    component.text.setText(content)
    return this
  },

  /**
   * Gets the chip's text content
   * @returns {string} The chip's text content
   */
  getText () {
    return component.text.getText()
  },

  /**
   * Sets the chip's leading icon
   * @param {string} icon - Icon HTML content
   * @returns {Object} The chip instance for chaining
   */
  setIcon (icon) {
    component.icon.setIcon(icon)
    return this
  },

  /**
   * Gets the chip's icon content
   * @returns {string} The chip's icon HTML
   */
  getIcon () {
    return component.icon.getIcon()
  },

  /**
   * Sets the chip's trailing icon
   * @param {string} icon - Icon HTML content
   * @returns {Object} The chip instance for chaining
   */
  setTrailingIcon (icon) {
    const trailingIconSelector = `.${component.getClass('chip')}-trailing-icon`
    let trailingIconElement = component.element.querySelector(trailingIconSelector)

    if (!trailingIconElement && icon) {
      trailingIconElement = document.createElement('span')
      trailingIconElement.className = `${component.getClass('chip')}-trailing-icon`
      component.element.appendChild(trailingIconElement)
    }

    if (trailingIconElement) {
      trailingIconElement.innerHTML = icon || ''
    }

    return this
  },

  /**
   * Destroys the chip component and cleans up resources
   */
  destroy () {
    lifecycle.destroy()
  }
})
