// src/core/compose/features/disabled.js

/**
 * Adds disabled state management to a component
 * @param {Object} config - Disabled configuration
 * @returns {Function} Component enhancer
 */
export const withDisabled = (config = {}) => (component) => {
  // Get the disabled class based on component name
  const disabledClass = `${component.getClass(component.componentName)}--disabled`

  // Directly implement disabled functionality
  const disabled = {
    enable () {
      component.element.classList.remove(disabledClass)
      if (component.input) {
        component.input.disabled = false
        component.input.removeAttribute('disabled')
      } else {
        component.element.disabled = false
        component.element.removeAttribute('disabled')
      }
      return this
    },

    disable () {
      component.element.classList.add(disabledClass)
      if (component.input) {
        component.input.disabled = true
        component.input.setAttribute('disabled', 'true')
      } else {
        component.element.disabled = true
        component.element.setAttribute('disabled', 'true')
      }
      return this
    },

    toggle () {
      if (this.isDisabled()) {
        this.enable()
      } else {
        this.disable()
      }
      return this
    },

    isDisabled () {
      return component.input ? component.input.disabled : component.element.disabled
    }
  }

  // Initialize disabled state if configured
  if (config.disabled) {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      disabled.disable()
    })
  }

  return {
    ...component,
    disabled
  }
}
