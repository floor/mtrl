// src/core/state/disabled.js

/**
 * Creates a controller for managing the disabled state of an element
 * @param {HTMLElement} element - The element to control
 * @returns {Object} Disabled state controller
 */
export const createDisabled = (element) => {
  return {
    /**
     * Enables the element
     * @returns {Object} The controller instance for chaining
     */
    enable () {
      element.disabled = false
      element.removeAttribute('disabled')
      return this
    },

    /**
     * Disables the element
     * @returns {Object} The controller instance for chaining
     */
    disable () {
      element.disabled = true
      element.setAttribute('disabled', 'true')
      return this
    },

    /**
     * Toggles the disabled state
     * @returns {Object} The controller instance for chaining
     */
    toggle () {
      if (element.disabled) {
        this.enable()
      } else {
        this.disable()
      }
      return this
    },

    /**
     * Checks if the element is disabled
     * @returns {boolean} True if the element is disabled
     */
    isDisabled () {
      return element.disabled === true
    }
  }
}
