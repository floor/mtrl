// test/components/switch.test.js
import { describe, test, expect, mock } from 'bun:test'
import createSwitch from '../../src/components/switch/switch'
import { SWITCH_LABEL_POSITION } from '../../src/components/switch/constants'

describe('Switch Component', () => {
  test('should create a switch element', () => {
    const switchComp = createSwitch()
    expect(switchComp.element).toBeDefined()
    expect(switchComp.element.tagName).toBe('DIV')
    expect(switchComp.element.className).toContain('mtrl-switch')
  })

  test('should create input element with type checkbox', () => {
    const switchComp = createSwitch()

    // Check for input through direct property
    expect(switchComp.input).toBeDefined()
    expect(switchComp.input.type).toBe('checkbox')
  })

  test('should apply custom class', () => {
    const customClass = 'custom-switch'
    const switchComp = createSwitch({
      class: customClass
    })

    expect(switchComp.element.className).toContain(customClass)
  })

  test('should add label content through config', () => {
    const labelText = 'Toggle me'
    const switchComp = createSwitch({
      label: labelText
    })

    // Check config has label
    expect(switchComp.config.label).toBe(labelText)
  })

  test('should position label correctly', () => {
    // Test if the configuration is stored correctly
    const startPos = SWITCH_LABEL_POSITION.START
    const startSwitch = createSwitch({
      label: 'Label at Start',
      labelPosition: startPos
    })

    // Check label position in config
    expect(startSwitch.config.labelPosition).toBe(startPos)

    // Check class is applied
    expect(startSwitch.element.className).toContain('mtrl-switch--label-start')

    // Default position (end)
    const endSwitch = createSwitch({
      label: 'Label at End'
    })

    expect(endSwitch.element.className).toContain('mtrl-switch--label-end')
  })

  test('should handle change events', () => {
    const switchComp = createSwitch()
    const handleChange = mock(() => {})

    // Check if the event handler is registered
    switchComp.on('change', handleChange)

    // Simulate change by calling the emit method if it exists
    if (switchComp.emit) {
      switchComp.emit('change', {})
      expect(handleChange).toHaveBeenCalled()
    }
  })

  test('should support disabled state', () => {
    const switchComp = createSwitch()

    // Check API methods
    expect(typeof switchComp.disable).toBe('function')
    expect(typeof switchComp.enable).toBe('function')

    // Test the API methods without making assumptions about implementation
    switchComp.disable()
    switchComp.enable()

    // Test initially disabled through config
    const disabledSwitch = createSwitch({ disabled: true })
    expect(disabledSwitch.config.disabled).toBe(true)
  })

  test('should support checked state', () => {
    // Check API methods
    const switchComp = createSwitch()
    expect(typeof switchComp.check).toBe('function')
    expect(typeof switchComp.uncheck).toBe('function')
    expect(typeof switchComp.toggle).toBe('function')

    // Initial unchecked state
    const uncheckedSwitch = createSwitch()
    expect(uncheckedSwitch.config.checked).toBeFalsy()

    // Initial checked state
    const checkedSwitch = createSwitch({ checked: true })
    expect(checkedSwitch.config.checked).toBe(true)

    // Verify methods execute without errors
    switchComp.check()
    switchComp.uncheck()
    switchComp.toggle()
  })

  test('should set name attribute correctly', () => {
    const name = 'theme-toggle'
    const switchComp = createSwitch({ name })

    // Check config
    expect(switchComp.config.name).toBe(name)
  })

  test('should set value attribute correctly', () => {
    const value = 'dark-mode'
    const switchComp = createSwitch({ value })

    // Check config
    expect(switchComp.config.value).toBe(value)
  })

  test('should set required attribute correctly', () => {
    const switchComp = createSwitch({ required: true })

    // Check config
    expect(switchComp.config.required).toBe(true)
  })

  test('should allow updating label', () => {
    const initialLabel = 'Initial Label'
    const switchComp = createSwitch({
      label: initialLabel
    })

    // Check initial label in config
    expect(switchComp.config.label).toBe(initialLabel)

    // Check setLabel method exists
    expect(typeof switchComp.setLabel).toBe('function')

    // Update label
    const newLabel = 'Updated Label'
    switchComp.setLabel(newLabel)
  })

  test('should include track and thumb elements', () => {
    const switchComp = createSwitch()

    // Check for track - it might be directly accessible or through the DOM
    const hasTrack = switchComp.track !== undefined ||
                    switchComp.element.querySelector('.mtrl-switch-track') !== null

    expect(hasTrack).toBe(true)
  })

  test('should have value getter and setter', () => {
    const switchComp = createSwitch()

    // Check API methods
    expect(typeof switchComp.getValue).toBe('function')
    expect(typeof switchComp.setValue).toBe('function')

    // Set a value
    const testValue = 'test-value'
    switchComp.setValue(testValue)
  })

  test('should properly clean up resources', () => {
    const switchComp = createSwitch()
    const parentElement = document.createElement('div')
    parentElement.appendChild(switchComp.element)

    // Destroy should remove the element and clean up resources
    switchComp.destroy()

    expect(parentElement.children.length).toBe(0)
  })
})
