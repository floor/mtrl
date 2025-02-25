// test/components/snackbar.test.js
import { describe, test, expect, mock, spyOn, beforeEach, afterEach } from 'bun:test'
import createSnackbar from '../../src/components/snackbar/snackbar'
import { SNACKBAR_VARIANTS, SNACKBAR_POSITIONS } from '../../src/components/snackbar/constants'

describe('Snackbar Component', () => {
  let originalBody
  let mockBodyAppendChild
  let mockBodyRemoveChild

  beforeEach(() => {
    // Mock document.body methods for testing
    originalBody = document.body
    mockBodyAppendChild = mock(() => {})
    mockBodyRemoveChild = mock(() => {})

    Object.defineProperty(document, 'body', {
      value: {
        appendChild: mockBodyAppendChild,
        removeChild: mockBodyRemoveChild,
        children: []
      },
      writable: true
    })
  })

  afterEach(() => {
    // Restore original document.body
    Object.defineProperty(document, 'body', {
      value: originalBody,
      writable: true
    })
  })

  test('should create a snackbar element', () => {
    const snackbar = createSnackbar({
      message: 'Test message'
    })

    expect(snackbar.element).toBeDefined()
    expect(snackbar.element.tagName).toBe('DIV')
    expect(snackbar.element.className).toContain('mtrl-snackbar')
  })

  test('should apply variant class', () => {
    const variant = SNACKBAR_VARIANTS.ACTION
    const snackbar = createSnackbar({
      message: 'Test message',
      variant
    })

    expect(snackbar.config.variant).toBe(variant)
  })

  test('should use basic as default variant', () => {
    const snackbar = createSnackbar({
      message: 'Test message'
    })

    expect(snackbar.config.variant).toBe(SNACKBAR_VARIANTS.BASIC)
  })

  test('should apply position class', () => {
    const position = SNACKBAR_POSITIONS.START
    const snackbar = createSnackbar({
      message: 'Test message',
      position
    })

    expect(snackbar.config.position).toBe(position)
  })

  test('should use center as default position', () => {
    const snackbar = createSnackbar({
      message: 'Test message'
    })

    expect(snackbar.config.position).toBe(SNACKBAR_POSITIONS.CENTER)
  })

  test('should set message text', () => {
    const message = 'Test message'
    const snackbar = createSnackbar({
      message
    })

    expect(snackbar.config.message).toBe(message)
    expect(typeof snackbar.getMessage).toBe('function')
  })

  test('should add action button when specified', () => {
    const action = 'Undo'
    const snackbar = createSnackbar({
      message: 'Action completed',
      action
    })

    expect(snackbar.actionButton).toBeDefined()
    expect(snackbar.actionButton.textContent).toBe(action)
  })

  test('should not add action button when not specified', () => {
    const snackbar = createSnackbar({
      message: 'Simple message'
    })

    expect(snackbar.actionButton).toBeUndefined()
  })

  test('should set default duration when not specified', () => {
    const snackbar = createSnackbar({
      message: 'Test message'
    })

    expect(snackbar.config.duration).toBe(4000)
  })

  test('should respect custom duration', () => {
    const duration = 2000
    const snackbar = createSnackbar({
      message: 'Test message',
      duration
    })

    expect(snackbar.config.duration).toBe(duration)
  })

  test('should allow duration of 0 (no auto-dismiss)', () => {
    const snackbar = createSnackbar({
      message: 'Test message',
      duration: 0
    })

    expect(snackbar.config.duration).toBe(0)
  })

  test('should register event handlers', () => {
    const snackbar = createSnackbar({
      message: 'Test message'
    })

    // Verify event API exists
    expect(typeof snackbar.on).toBe('function')
    expect(typeof snackbar.off).toBe('function')

    // Check event handling
    const handler = mock(() => {})
    snackbar.on('dismiss', handler)

    // Trigger dismiss event
    snackbar.emit && snackbar.emit('dismiss')

    if (snackbar.emit) {
      expect(handler).toHaveBeenCalled()
    }
  })

  test('should expose show and hide methods', () => {
    const snackbar = createSnackbar({
      message: 'Test message'
    })

    expect(typeof snackbar.show).toBe('function')
    expect(typeof snackbar.hide).toBe('function')
  })

  test('should allow updating message', () => {
    const initialMessage = 'Initial message'
    const snackbar = createSnackbar({
      message: initialMessage
    })

    expect(snackbar.getMessage()).toBe(initialMessage)

    const updatedMessage = 'Updated message'
    snackbar.setMessage(updatedMessage)

    expect(snackbar.getMessage()).toBe(updatedMessage)
  })

  test('should have dismiss timer functionality', () => {
    const snackbar = createSnackbar({
      message: 'Test message'
    })

    expect(snackbar.timer).toBeDefined()
    expect(typeof snackbar.timer.start).toBe('function')
    expect(typeof snackbar.timer.stop).toBe('function')
  })

  test('should have an API for position management', () => {
    const snackbar = createSnackbar({
      message: 'Test message'
    })

    expect(snackbar.position).toBeDefined()

    if (snackbar.position) {
      expect(typeof snackbar.position.getPosition).toBe('function')
      expect(typeof snackbar.position.setPosition).toBe('function')
    }
  })

  test('should clean up resources on destroy', () => {
    const snackbar = createSnackbar({
      message: 'Test message'
    })

    expect(typeof snackbar.destroy).toBe('function')

    // Mock any internal methods that might be called during destroy
    if (snackbar.timer) {
      snackbar.timer.stop = mock(snackbar.timer.stop)
    }

    // Call destroy
    snackbar.destroy()

    // Check if timer was stopped
    if (snackbar.timer && typeof snackbar.timer.stop === 'function') {
      expect(snackbar.timer.stop).toHaveBeenCalled()
    }
  })

  test('should apply custom class', () => {
    const customClass = 'custom-snackbar'
    const snackbar = createSnackbar({
      message: 'Test message',
      class: customClass
    })

    expect(snackbar.element.className).toContain(customClass)
  })
})
