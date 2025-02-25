
/**
 * Adds disabled state management to a component
 * @param {Object} config - Disabled configuration
 * @returns {Function} Component enhancer
 */
export const withDisabled = (config = {}) => (component) => {
  // Directly implement disabled functionality
  const disabled = {
    enable () {
      component.element.disabled = false
      component.element.removeAttribute('disabled')
      return this
    },

    disable () {
      component.element.disabled = true
      component.element.setAttribute('disabled', 'true')
      return this
    },

    toggle () {
      if (component.element.disabled) {
        this.enable()
      } else {
        this.disable()
      }
      return this
    },

    isDisabled () {
      return component.element.disabled === true
    }
  }

  if (config.disabled) {
    disabled.disable()
  }

  return {
    ...component,
    disabled
  }
}
