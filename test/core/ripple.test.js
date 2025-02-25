// test/core/build/ripple.test.js
import { describe, test, expect, mock, spyOn } from 'bun:test'
import { createRipple } from '../../src/core/build/ripple'
import '../setup'

describe('Ripple Effect', () => {
  test('should create a ripple controller', () => {
    const ripple = createRipple()
    expect(ripple).toBeDefined()
    expect(ripple.mount).toBeInstanceOf(Function)
    expect(ripple.unmount).toBeInstanceOf(Function)
  })

  test('should mount ripple effect to an element', () => {
    const ripple = createRipple()
    const element = document.createElement('div')

    // Element should start with static position
    element.style.position = 'static'

    ripple.mount(element)

    // Position should now be relative for proper ripple positioning
    expect(element.style.position).toBe('relative')
    expect(element.style.overflow).toBe('hidden')

    // Should have added mousedown event listener
    expect(element.__handlers).toBeDefined()
    expect(element.__handlers.mousedown).toBeDefined()
  })

  test('should not fail when mounting to a null element', () => {
    const ripple = createRipple()
    expect(() => ripple.mount(null)).not.toThrow()
  })

  test('should create ripple element on mousedown', () => {
    const ripple = createRipple()
    const element = document.createElement('div')

    // Spy on appendChild to verify ripple element creation
    const appendChildSpy = spyOn(element, 'appendChild')

    ripple.mount(element)

    // Simulate mousedown event
    const mouseEvent = {
      type: 'mousedown',
      offsetX: 10,
      offsetY: 20,
      target: element
    }
    element.__handlers.mousedown[0](mouseEvent)

    // Should have created and appended a ripple element
    expect(appendChildSpy).toHaveBeenCalled()
    expect(appendChildSpy.mock.calls[0][0].className).toBe('ripple')
  })

  test('should add document cleanup event listeners', () => {
    const ripple = createRipple()
    const element = document.createElement('div')

    // Mock document event listeners
    const docAddEventListener = mock(() => {})
    const originalDocAddEventListener = document.addEventListener
    document.addEventListener = docAddEventListener

    ripple.mount(element)

    // Simulate mousedown event
    const mouseEvent = {
      type: 'mousedown',
      offsetX: 10,
      offsetY: 20,
      target: element
    }
    element.__handlers.mousedown[0](mouseEvent)

    // Should have added mouseup and mouseleave event listeners to document
    expect(docAddEventListener).toHaveBeenCalledTimes(2)
    expect(docAddEventListener.mock.calls[0][0]).toBe('mouseup')
    expect(docAddEventListener.mock.calls[1][0]).toBe('mouseleave')

    // Restore original
    document.addEventListener = originalDocAddEventListener
  })

  test('should remove ripple elements on unmount', () => {
    const ripple = createRipple()
    const element = document.createElement('div')

    // Add a few ripple elements
    const ripple1 = document.createElement('div')
    ripple1.className = 'ripple'
    const ripple2 = document.createElement('div')
    ripple2.className = 'ripple'

    element.appendChild(ripple1)
    element.appendChild(ripple2)

    // Mock the querySelectorAll and forEach methods
    element.querySelectorAll = (selector) => {
      if (selector === '.ripple') {
        return [ripple1, ripple2]
      }
      return []
    }

    const removeSpy1 = spyOn(ripple1, 'remove')
    const removeSpy2 = spyOn(ripple2, 'remove')

    ripple.unmount(element)

    // Should have removed both ripple elements
    expect(removeSpy1).toHaveBeenCalled()
    expect(removeSpy2).toHaveBeenCalled()
  })

  // test('should handle custom config options', () => {
  //   const customConfig = {
  //     duration: 500,
  //     timing: 'ease-out',
  //     opacity: ['0.8', '0.2']
  //   }

  //   const ripple = createRipple(customConfig)
  //   const element = document.createElement('div')

  //   // Spy on appendChild to capture the ripple element
  //   let capturedRipple
  //   const originalAppendChild = element.appendChild
  //   element.appendChild = (child) => {
  //     capturedRipple = child
  //     return originalAppendChild.call(element, child)
  //   }

  //   ripple.mount(element)

  //   // Simulate mousedown event
  //   const mouseEvent = {
  //     type: 'mousedown',
  //     offsetX: 10,
  //     offsetY: 20,
  //     target: element
  //   }
  //   element.__handlers.mousedown[0](mouseEvent)

  //   // Verify custom config was applied
  //   expect(capturedRipple.style.transition).toContain(`${customConfig.duration}ms`)
  //   expect(capturedRipple.style.transition).toContain(customConfig.timing)
  //   expect(capturedRipple.style.opacity).toBe(customConfig.opacity[0])

  //   // Force reflow simulation
  //   capturedRipple.offsetHeight

  //   // Check end opacity is applied after animation
  //   expect(capturedRipple.style.opacity).toBe(customConfig.opacity[1])
  // })

  test('should not fail when unmounting a null element', () => {
    const ripple = createRipple()
    expect(() => ripple.unmount(null)).not.toThrow()
  })
})
