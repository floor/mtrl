// src/core/compose/features/checkable.js

/**
 * Adds checked state management to a component with an input
 * Manages visual state and event emission for checked changes
 *
 * @param {Object} config - Checkable configuration
 * @param {boolean} [config.checked] - Initial checked state
 *
 * @returns {Function} Component transformer that adds checkable functionality
 *
 * @example
 * const component = pipe(
 *   createBase,
 *   withEvents(),
 *   withInput(config),
 *   withCheckable({ checked: true })
 * )(config);
 *
 * // Use the checkable API
 * component.checkable.toggle();
 * component.checkable.check();
 * component.checkable.uncheck();
 *
 * // Listen for changes
 * component.on('change', ({ checked }) => {
 *   console.log('State changed:', checked);
 * });
 */
export const withCheckable = (config = {}) => (component) => {
  if (!component.input) return component

  /**
   * Updates component classes to reflect checked state
   * @private
   */
  const updateStateClasses = () => {
    component.element.classList.toggle(
      `${component.getClass('switch')}--checked`,
      component.input.checked
    )
  }

  // Set initial state
  if (config.checked) {
    component.input.checked = true
    updateStateClasses()
  }

  // Update classes whenever checked state changes
  component.on('change', updateStateClasses)

  return {
    ...component,
    checkable: {
      /**
       * Sets the checked state to true
       * Emits change event if state changes
       * @returns {Object} Checkable interface
       */
      check () {
        if (!component.input.checked) {
          component.input.checked = true
          updateStateClasses()
          component.emit('change', {
            checked: true,
            value: component.input.value
          })
        }
        return this
      },

      /**
       * Sets the checked state to false
       * Emits change event if state changes
       * @returns {Object} Checkable interface
       */
      uncheck () {
        if (component.input.checked) {
          component.input.checked = false
          updateStateClasses()
          component.emit('change', {
            checked: false,
            value: component.input.value
          })
        }
        return this
      },

      /**
       * Toggles the current checked state
       * Always emits change event
       * @returns {Object} Checkable interface
       */
      toggle () {
        component.input.checked = !component.input.checked
        updateStateClasses()
        component.emit('change', {
          checked: component.input.checked,
          value: component.input.value
        })
        return this
      },

      /**
       * Gets the current checked state
       * @returns {boolean} Whether component is checked
       */
      isChecked () {
        return component.input.checked
      }
    }
  }
}
