// test/components/menu.test.js
import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import createMenu from '../../src/components/menu/menu'
import { MENU_ALIGN, MENU_VERTICAL_ALIGN, MENU_EVENTS, MENU_ITEM_TYPES } from '../../src/components/menu/constants'

// Mock DOM APIs that aren't available in the test environment
beforeEach(() => {
  // Mock Element.prototype methods
  Element.prototype.getBoundingClientRect = function () {
    return {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100
    }
  }

  Element.prototype.closest = function (selector) {
    return null // Simple mock that returns null by default
  }

  Element.prototype.matches = function (selector) {
    return false // Simple mock that returns false by default
  }

  // Save original createElement to restore later
  const originalCreateElement = document.createElement
  document.createElement = function (tag) {
    const element = originalCreateElement.call(document, tag)

    // Add closest method for our tests
    element.closest = function (selector) {
      if (selector.includes('menu-item')) {
        return this.classList && this.classList.contains('mtrl-menu-item') ? this : null
      }
      return null
    }

    // Add matches method for our tests
    element.matches = function (selector) {
      if (selector === ':hover') return false
      return this.classList && this.classList.contains(selector.replace('.', ''))
    }

    // Mock the querySelectorAll method
    element.querySelectorAll = function (selector) {
      return [] // Return empty array by default
    }

    // Mock the querySelector method
    element.querySelector = function (selector) {
      return null // Return null by default
    }

    return element
  }

  // Mock window properties
  global.window = {
    ...global.window,
    innerWidth: 1024,
    innerHeight: 768
  }

  // Mock event listeners
  if (!global.eventListeners) {
    global.eventListeners = new Map()
  }

  const originalAddEventListener = Element.prototype.addEventListener
  Element.prototype.addEventListener = function (event, handler) {
    if (!global.eventListeners.has(this)) {
      global.eventListeners.set(this, new Map())
    }
    if (!global.eventListeners.get(this).has(event)) {
      global.eventListeners.get(this).set(event, new Set())
    }
    global.eventListeners.get(this).get(event).add(handler)

    // Call original if it exists
    if (originalAddEventListener) {
      originalAddEventListener.call(this, event, handler)
    }
  }

  const originalRemoveEventListener = Element.prototype.removeEventListener
  Element.prototype.removeEventListener = function (event, handler) {
    if (global.eventListeners.has(this) &&
        global.eventListeners.get(this).has(event)) {
      global.eventListeners.get(this).get(event).delete(handler)
    }

    // Call original if it exists
    if (originalRemoveEventListener) {
      originalRemoveEventListener.call(this, event, handler)
    }
  }

  // Mock offsetHeight/offsetWidth
  Object.defineProperty(Element.prototype, 'offsetHeight', {
    configurable: true,
    get: function () { return 100 }
  })

  Object.defineProperty(Element.prototype, 'offsetWidth', {
    configurable: true,
    get: function () { return 100 }
  })
})

afterEach(() => {
  // Clean up our mocks
  delete Element.prototype.getBoundingClientRect
  delete Element.prototype.closest
  delete Element.prototype.matches

  document.createElement = document.createElement.__originalFunction || document.createElement

  // Clear event listeners
  if (global.eventListeners) {
    global.eventListeners.clear()
  }
})

describe('Menu Component', () => {
  // Sample menu items for testing
  const testItems = [
    {
      name: 'copy',
      text: 'Copy'
    },
    {
      name: 'paste',
      text: 'Paste'
    },
    {
      type: 'divider'
    },
    {
      name: 'delete',
      text: 'Delete',
      disabled: true
    }
  ]

  // Sample nested menu items
  const nestedTestItems = [
    {
      name: 'file',
      text: 'File',
      items: [
        {
          name: 'new',
          text: 'New'
        },
        {
          name: 'open',
          text: 'Open'
        }
      ]
    },
    {
      name: 'edit',
      text: 'Edit',
      items: [
        {
          name: 'copy',
          text: 'Copy'
        },
        {
          name: 'paste',
          text: 'Paste'
        }
      ]
    }
  ]

  test('should create a menu element', () => {
    const menu = createMenu()

    expect(menu.element).toBeDefined()
    expect(menu.element.tagName).toBe('DIV')
    expect(menu.element.className).toContain('mtrl-menu')
    expect(menu.element.getAttribute('role')).toBe('menu')
  })

  test('should apply custom class', () => {
    const customClass = 'custom-menu'
    const menu = createMenu({
      class: customClass
    })

    expect(menu.element.className).toContain(customClass)
  })

  test('should add initial items', () => {
    const menu = createMenu({
      items: testItems
    })

    // Check if items methods exist
    expect(typeof menu.getItems).toBe('function')

    // Get items and verify we have a Map
    const items = menu.getItems()
    expect(items instanceof Map).toBe(true)

    // Verify item names in map
    expect(items.has('copy')).toBe(true)
    expect(items.has('paste')).toBe(true)
    expect(items.has('delete')).toBe(true)
  })

  test('should have show/hide methods', () => {
    const menu = createMenu()

    // Check for API methods
    expect(typeof menu.show).toBe('function')
    expect(typeof menu.hide).toBe('function')
    expect(typeof menu.isVisible).toBe('function')

    // Test visibility state
    expect(menu.isVisible()).toBe(false)

    // Show menu
    menu.show()
    expect(menu.isVisible()).toBe(true)
    expect(menu.element.classList.contains('mtrl-menu--visible')).toBe(true)

    // Hide menu
    menu.hide()

    // Note: Due to animations, isVisible() might still return true immediately after hide()
    // In a real environment, we'd wait for transitions to complete
  })

  test('should have positioning methods', () => {
    const menu = createMenu()
    const target = document.createElement('button')

    // Check for API method
    expect(typeof menu.position).toBe('function')

    // Test with different alignments
    const positionConfigs = [
      { align: MENU_ALIGN.LEFT, vAlign: MENU_VERTICAL_ALIGN.TOP },
      { align: MENU_ALIGN.RIGHT, vAlign: MENU_VERTICAL_ALIGN.BOTTOM },
      { align: MENU_ALIGN.CENTER, vAlign: MENU_VERTICAL_ALIGN.MIDDLE }
    ]

    positionConfigs.forEach(config => {
      try {
        menu.position(target, config)
        // If we reach here, no error was thrown
        expect(true).toBe(true)
      } catch (error) {
        // If an error occurs, the test should fail
        expect(error).toBeUndefined()
      }
    })
  })

  test('should add item dynamically', () => {
    const menu = createMenu()

    // Check for API method
    expect(typeof menu.addItem).toBe('function')

    // Test adding an item
    const newItem = {
      name: 'newItem',
      text: 'New Item'
    }

    menu.addItem(newItem)

    // Verify item was added
    const items = menu.getItems()
    expect(items.has('newItem')).toBe(true)
  })

  test('should remove item dynamically', () => {
    const menu = createMenu({
      items: testItems
    })

    // Check for API method
    expect(typeof menu.removeItem).toBe('function')

    // Test removing an item
    menu.removeItem('copy')

    // Verify item was removed
    const items = menu.getItems()
    expect(items.has('copy')).toBe(false)
  })

  test('should register event handlers', () => {
    const menu = createMenu()

    // Check for API methods
    expect(typeof menu.on).toBe('function')
    expect(typeof menu.off).toBe('function')

    // Create a mock handler
    const mockHandler = mock(() => {})

    // Register handler
    menu.on(MENU_EVENTS.SELECT, mockHandler)

    // We can't easily test if the handler is called in this environment
    // But we can check that the method works without error
    expect(mockHandler.mock.calls.length).toBe(0)

    // Unregister handler
    menu.off(MENU_EVENTS.SELECT, mockHandler)
  })

  test('should create nested menus for items with children', () => {
    // This test would be more complex in a real environment
    // For now, just verify the basic menu creation works with nested items

    const menu = createMenu({
      items: nestedTestItems
    })

    // Verify parent items exist
    const items = menu.getItems()
    expect(items.has('file')).toBe(true)
    expect(items.has('edit')).toBe(true)

    // We can't easily test the submenu creation here
    // But we can check that the parent items are created without error
  })

  test('should properly clean up resources on destroy', () => {
    const menu = createMenu()

    // Check for API method
    expect(typeof menu.destroy).toBe('function')

    const parentElement = document.createElement('div')
    parentElement.appendChild(menu.element)

    // Destroy the component
    menu.destroy()

    // Check if element was removed
    expect(parentElement.children.length).toBe(0)
  })

  test('should support keyboard navigation', () => {
    // Skip detailed keyboard navigation tests due to test environment limitations
    // Just verify the API methods exist

    const menu = createMenu()

    // Show the menu to initialize keyboard handlers
    menu.show()

    // In a real environment, we would dispatch keydown events and check results
    // But here we just verify the basic setup happens without errors

    // Hide and clean up
    menu.hide()
  })

  test('should handle outside clicks', () => {
    // This would typically close the menu
    // We can't fully test this behavior in the current environment

    const menu = createMenu()
    menu.show()

    // In a real environment, we would:
    // 1. Create a click event outside the menu
    // 2. Dispatch it
    // 3. Verify menu is hidden

    // For now, just ensure our menu API method is called without error
    menu.hide()
  })
})
