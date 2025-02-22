// src/core/compose/features/input.js

/**
 * Creates an input element and adds it to a component
 * Handles both input creation and event emission for state changes
 *
 * @param {Object} config - Input configuration
 * @param {string} [config.name] - Input name attribute
 * @param {boolean} [config.checked] - Initial checked state
 * @param {boolean} [config.required] - Whether input is required
 * @param {boolean} [config.disabled] - Whether input is disabled
 * @param {string} [config.value='on'] - Input value attribute
 * @param {string} [config.label] - Accessibility label text
 * @param {string} [config.ariaLabel] - Alternative accessibility label
 *
 * @returns {Function} Component transformer that adds input functionality
 */
export const withInput = (config = {}) => (component) => {
  const input = document.createElement('input')
  const name = component.componentName
  input.type = 'checkbox'
  input.className = `${component.getClass(name)}-input`

  // Ensure input can receive focus
  input.style.position = 'absolute'
  input.style.opacity = '0'
  input.style.cursor = 'pointer'
  // Don't use display: none or visibility: hidden as they prevent focus

  // The input itself should be focusable, not the wrapper
  component.element.setAttribute('role', 'presentation')
  input.setAttribute('role', name)

  const attributes = {
    name: config.name,
    checked: config.checked,
    required: config.required,
    disabled: config.disabled,
    value: config.value || 'on',
    'aria-label': config.label || config.ariaLabel
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      input.setAttribute(key, value)
    }
  })

  // Bridge native checkbox events to our event system
  input.addEventListener('change', (event) => {
    component.emit('change', {
      checked: input.checked,
      value: input.value,
      nativeEvent: event
    })
  })

  // Add keyboard handling
  input.addEventListener('keydown', (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      if (!input.disabled) {
        input.checked = !input.checked
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  })

  component.element.appendChild(input)

  return {
    ...component,
    input,

    /**
     * Gets the current input value
     * @returns {string} Current value
     */
    getValue: () => input.value,

    /**
     * Sets the input value and emits a value event
     * @param {string} value - New value to set
     * @returns {Object} Component instance
     */
    setValue (value) {
      input.value = value
      component.emit('value', { value })
      return this
    }
  }
}
