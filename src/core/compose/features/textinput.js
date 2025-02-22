// src/core/compose/features/textinput.js
/**
 * Enhances a component with text input functionality
 * @param {Object} config - Text input configuration
 * @param {string} [config.type] - Input type (text, password, etc.)
 * @param {boolean} [config.multiline] - Whether to use textarea
 * @returns {Function} Component enhancer
 */
export const withTextInput = (config = {}) => (component) => {
  const input = document.createElement(config.type === 'multiline' ? 'textarea' : 'input')
  input.className = `${component.getClass('textfield')}-input`

  // Set input attributes
  const attributes = {
    type: config.type === 'multiline' ? null : (config.type || 'text'),
    name: config.name,
    required: config.required,
    disabled: config.disabled,
    maxLength: config.maxLength,
    pattern: config.pattern,
    autocomplete: config.autocomplete,
    value: config.value || ''
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      input.setAttribute(key, value)
    }
  })

  // Handle input state changes
  const updateInputState = () => {
    const isEmpty = !input.value
    component.element.classList.toggle(`${component.getClass('textfield')}--empty`, isEmpty)
    return isEmpty
  }

  // Detect autocomplete
  const handleAutocomplete = (event) => {
    // Chrome/Safari trigger animationstart
    if (event.animationName === 'onAutoFillStart') {
      component.element.classList.remove(`${component.getClass('textfield')}--empty`)
      component.emit('input', { value: input.value, isEmpty: false, isAutofilled: true })
    }
  }

  // Add required animation for autocomplete detection
  const style = document.createElement('style')
  style.textContent = `
    @keyframes onAutoFillStart { from {} to {} }
    .${component.getClass('textfield')}-input:-webkit-autofill {
      animation-name: onAutoFillStart;
      animation-duration: 1ms;
    }
  `
  document.head.appendChild(style)

  // Event listeners
  input.addEventListener('focus', () => {
    component.element.classList.add(`${component.getClass('textfield')}--focused`)
    component.emit('focus', { isEmpty: updateInputState() })
  })

  input.addEventListener('blur', () => {
    component.element.classList.remove(`${component.getClass('textfield')}--focused`)
    component.emit('blur', { isEmpty: updateInputState() })
  })

  input.addEventListener('input', () => {
    component.emit('input', {
      value: input.value,
      isEmpty: updateInputState(),
      isAutofilled: false
    })
  })

  input.addEventListener('animationstart', handleAutocomplete)

  // Initial state
  updateInputState()

  component.element.appendChild(input)

  // Cleanup
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy
    component.lifecycle.destroy = () => {
      input.removeEventListener('animationstart', handleAutocomplete)
      style.remove()
      input.remove()
      originalDestroy.call(component.lifecycle)
    }
  }

  return {
    ...component,
    input,
    setValue (value) {
      input.value = value || ''
      updateInputState()
      return this
    },
    getValue () {
      return input.value
    },
    setAttribute (name, value) {
      input.setAttribute(name, value)
      return this
    },
    getAttribute (name) {
      return input.getAttribute(name)
    },
    removeAttribute (name) {
      input.removeAttribute(name)
      return this
    }
  }
}
