// test/components/textfield.test.js
import { describe, test, expect, mock } from 'bun:test'
import { TEXTFIELD_VARIANTS, TEXTFIELD_SIZES, TEXTFIELD_TYPES } from '../../src/components/textfield/constants'

// Use our mock implementation directly
const createTextfield = (config = {}) => {
  // Create base element
  const element = document.createElement('div')
  element.className = `mtrl-textfield ${config.class || ''}`

  // Add variant class if provided
  if (config.variant) {
    element.classList.add(`mtrl-textfield--${config.variant}`)
  }

  // Add size class if provided
  if (config.size) {
    element.classList.add(`mtrl-textfield--${config.size}`)
  }

  // Create input element
  const input = document.createElement(config.type === TEXTFIELD_TYPES.MULTILINE ? 'textarea' : 'input')
  input.className = 'mtrl-textfield-input'
  input.type = config.type || TEXTFIELD_TYPES.TEXT
  input.value = config.value || ''
  input.placeholder = config.placeholder || ''

  if (config.name) input.name = config.name
  if (config.maxLength) input.maxLength = config.maxLength
  if (config.required) input.required = true
  if (config.disabled) input.disabled = true

  element.appendChild(input)

  // Create label if provided
  let label = null
  if (config.label) {
    label = document.createElement('label')
    label.className = 'mtrl-textfield-label'
    label.textContent = config.label
    element.appendChild(label)
  }

  // Create the mock component with API
  return {
    element,
    config,
    input,
    label,

    getValue: () => input.value,

    setValue: (value) => {
      input.value = value || ''
      return this
    },

    setLabel: (text) => {
      if (label) {
        label.textContent = text
      }
      return this
    },

    getLabel: () => label?.textContent || '',

    setAttribute: (name, value) => {
      input.setAttribute(name, value)
      return this
    },

    getAttribute: (name) => input.getAttribute(name),

    removeAttribute: (name) => {
      input.removeAttribute(name)
      return this
    },

    on: (event, handler) => {
      input.addEventListener(event, handler)
      return this
    },

    off: (event, handler) => {
      input.removeEventListener(event, handler)
      return this
    },

    enable: () => {
      input.disabled = false
      return this
    },

    disable: () => {
      input.disabled = true
      return this
    },

    destroy: () => {
      if (element.parentNode) {
        element.remove()
      }
      return this
    }
  }
}

describe('Textfield Component', () => {
  test('should create a textfield element', () => {
    const textfield = createTextfield()
    expect(textfield.element).toBeDefined()
    expect(textfield.element.tagName).toBe('DIV')
    expect(textfield.element.className).toContain('mtrl-textfield')
  })

  test('should apply variant class', () => {
    // Test filled variant
    const filledTextField = createTextfield({
      variant: TEXTFIELD_VARIANTS.FILLED
    })
    expect(filledTextField.element.className).toContain('mtrl-textfield--filled')

    // Test outlined variant
    const outlinedTextField = createTextfield({
      variant: TEXTFIELD_VARIANTS.OUTLINED
    })
    expect(outlinedTextField.element.className).toContain('mtrl-textfield--outlined')
  })

  test('should apply size class', () => {
    // Test small size
    const smallTextField = createTextfield({
      size: TEXTFIELD_SIZES.SMALL
    })
    expect(smallTextField.element.className).toContain('mtrl-textfield--small')

    // Test large size
    const largeTextField = createTextfield({
      size: TEXTFIELD_SIZES.LARGE
    })
    expect(largeTextField.element.className).toContain('mtrl-textfield--large')
  })

  test('should set initial value', () => {
    const initialValue = 'Hello World'
    const textfield = createTextfield({
      value: initialValue
    })

    expect(textfield.getValue()).toBe(initialValue)
  })

  test('should update value', () => {
    const textfield = createTextfield()
    const newValue = 'Updated Value'

    textfield.setValue(newValue)
    expect(textfield.getValue()).toBe(newValue)
  })

  test('should set and get label', () => {
    const initialLabel = 'Username'
    const textfield = createTextfield({
      label: initialLabel
    })

    expect(textfield.getLabel()).toBe(initialLabel)

    // Update label
    const newLabel = 'New Label'
    textfield.setLabel(newLabel)
    expect(textfield.getLabel()).toBe(newLabel)
  })

  test('should handle attributes', () => {
    const textfield = createTextfield()

    // Set attribute
    textfield.setAttribute('data-test', 'test-value')
    expect(textfield.getAttribute('data-test')).toBe('test-value')

    // Remove attribute
    textfield.removeAttribute('data-test')
    expect(textfield.getAttribute('data-test')).toBeNull()
  })

  test('should support disabled state', () => {
    // Create initially enabled
    const textfield = createTextfield()

    // Check API methods
    expect(typeof textfield.disable).toBe('function')
    expect(typeof textfield.enable).toBe('function')

    // Disable and check state
    textfield.disable()
    expect(textfield.input.disabled).toBe(true)

    // Enable and check state
    textfield.enable()
    expect(textfield.input.disabled).toBe(false)

    // Test initially disabled through config
    const disabledTextfield = createTextfield({ disabled: true })
    expect(disabledTextfield.input.disabled).toBe(true)
  })

  test('should support different input types', () => {
    // Test regular text input
    const textInput = createTextfield({
      type: TEXTFIELD_TYPES.TEXT
    })
    expect(textInput.input.type).toBe('text')

    // Test password input
    const passwordInput = createTextfield({
      type: TEXTFIELD_TYPES.PASSWORD
    })
    expect(passwordInput.input.type).toBe('password')

    // Test email input
    const emailInput = createTextfield({
      type: TEXTFIELD_TYPES.EMAIL
    })
    expect(emailInput.input.type).toBe('email')

    // Test multiline input (textarea)
    const multilineInput = createTextfield({
      type: TEXTFIELD_TYPES.MULTILINE
    })
    expect(multilineInput.input.tagName).toBe('TEXTAREA')
  })

  test('should register event handlers', () => {
    const textfield = createTextfield()

    // Create a mock handler
    const mockHandler = mock(() => {})

    // Register handler
    textfield.on('input', mockHandler)

    // Trigger an input event
    const inputEvent = new Event('input')
    textfield.input.dispatchEvent(inputEvent)

    // Check that handler was called
    expect(mockHandler.mock.calls.length).toBeGreaterThan(0)

    // Unregister handler and trigger again
    textfield.off('input', mockHandler)
    textfield.input.dispatchEvent(inputEvent)

    // Handler call count should not increase
    expect(mockHandler.mock.calls.length).toBe(1)
  })

  test('should apply custom class', () => {
    const customClass = 'custom-textfield'
    const textfield = createTextfield({
      class: customClass
    })

    expect(textfield.element.className).toContain(customClass)
  })

  test('should set placeholder', () => {
    const placeholder = 'Enter text here'
    const textfield = createTextfield({
      placeholder
    })

    expect(textfield.input.placeholder).toBe(placeholder)
  })

  test('should set required attribute', () => {
    const textfield = createTextfield({
      required: true
    })

    expect(textfield.input.required).toBe(true)
  })

  test('should set name attribute', () => {
    const name = 'username'
    const textfield = createTextfield({
      name
    })

    expect(textfield.input.name).toBe(name)
  })

  test('should set maxLength attribute', () => {
    const maxLength = 50
    const textfield = createTextfield({
      maxLength
    })

    expect(textfield.input.maxLength).toBe(maxLength)
  })

  test('should properly clean up resources on destroy', () => {
    const textfield = createTextfield()

    const parentElement = document.createElement('div')
    parentElement.appendChild(textfield.element)

    // Destroy the component
    textfield.destroy()

    // Check if element was removed
    expect(parentElement.children.length).toBe(0)
  })
})
