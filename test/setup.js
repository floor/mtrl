// test/setup.js
// Setup global DOM environment for testing

/**
 * Mock Element implementation for testing
 */
class MockElement {
  constructor (tagName) {
    this.tagName = tagName.toUpperCase()
    this.className = ''
    this.style = {}
    this.attributes = {}
    this.children = []
    this.childNodes = []
    this.__eventListeners = {}
    this.innerHTML = ''
    this.textContent = ''
    this.dataset = {}
    this.parentNode = null

    // Explicitly add __handlers for the tests that expect it
    this.__handlers = {}
  }

  appendChild (child) {
    this.children.push(child)
    this.childNodes.push(child)
    child.parentNode = this
    return child
  }

  insertBefore (newChild, referenceChild) {
    const index = referenceChild ? this.children.indexOf(referenceChild) : 0
    if (index === -1) {
      this.children.push(newChild)
    } else {
      this.children.splice(index, 0, newChild)
    }
    this.childNodes = [...this.children]
    newChild.parentNode = this
    return newChild
  }

  removeChild (child) {
    const index = this.children.indexOf(child)
    if (index !== -1) {
      this.children.splice(index, 1)
      this.childNodes = [...this.children]
      child.parentNode = null
    }
    return child
  }

  getAttribute (name) {
    return this.attributes[name] || null
  }

  setAttribute (name, value) {
    this.attributes[name] = value
    if (name === 'class') this.className = value
  }

  removeAttribute (name) {
    delete this.attributes[name]
    if (name === 'class') this.className = ''
  }

  hasAttribute (name) {
    return name in this.attributes
  }

  querySelector (selector) {
    // Basic selector implementation for testing
    if (selector.startsWith('.')) {
      // Class selector
      const className = selector.substring(1)
      return this.getElementsByClassName(className)[0] || null
    } else if (selector.includes(',')) {
      // Multiple selectors (comma-separated)
      const subSelectors = selector.split(',').map(s => s.trim())
      for (const subSelector of subSelectors) {
        const match = this.querySelector(subSelector)
        if (match) return match
      }
      return null
    }
    // Default
    return null
  }

  querySelectorAll (selector) {
    if (selector.startsWith('.')) {
      return this.getElementsByClassName(selector.substring(1))
    }
    return []
  }

  getElementsByClassName (className) {
    const results = []
    if (this.className && this.className.split(' ').includes(className)) {
      results.push(this)
    }
    this.children.forEach(child => {
      if (child.getElementsByClassName) {
        results.push(...child.getElementsByClassName(className))
      }
    })
    return results
  }

  addEventListener (type, listener) {
    // Support dual storage for different test expectations
    if (!this.__eventListeners[type]) {
      this.__eventListeners[type] = []
    }
    this.__eventListeners[type].push(listener)

    // Also store in __handlers for tests that expect it
    if (!this.__handlers[type]) {
      this.__handlers[type] = []
    }
    this.__handlers[type].push(listener)
  }

  removeEventListener (type, listener) {
    if (this.__eventListeners[type]) {
      this.__eventListeners[type] = this.__eventListeners[type]
        .filter(l => l !== listener)
    }

    if (this.__handlers && this.__handlers[type]) {
      this.__handlers[type] = this.__handlers[type]
        .filter(l => l !== listener)
    }
  }

  dispatchEvent (event) {
    event.target = this
    if (this.__eventListeners[event.type]) {
      this.__eventListeners[event.type].forEach(listener => {
        listener(event)
      })
    }
    return !event.defaultPrevented
  }

  get classList () {
    const classNames = this.className ? this.className.split(' ').filter(Boolean) : []
    return {
      add: (...classes) => {
        classes.forEach(c => {
          if (!classNames.includes(c)) {
            classNames.push(c)
          }
        })
        this.className = classNames.join(' ')
      },
      remove: (...classes) => {
        classes.forEach(c => {
          const index = classNames.indexOf(c)
          if (index !== -1) {
            classNames.splice(index, 1)
          }
        })
        this.className = classNames.join(' ')
      },
      toggle: (c) => {
        const index = classNames.indexOf(c)
        if (index !== -1) {
          classNames.splice(index, 1)
          this.className = classNames.join(' ')
          return false
        } else {
          classNames.push(c)
          this.className = classNames.join(' ')
          return true
        }
      },
      contains: (c) => classNames.includes(c),
      toString: () => this.className || ''
    }
  }

  getBoundingClientRect () {
    return {
      width: 100,
      height: 50,
      top: 0,
      left: 0,
      right: 100,
      bottom: 50
    }
  }

  remove () {
    if (this.parentNode) {
      this.parentNode.removeChild(this)
    }
  }

  // Support closest for navigation tests
  closest (selector) {
    // Always return an element with minimal functionality for navigation tests to work
    // In real tests this would need to be more sophisticated
    const mockClosest = new MockElement('div')
    mockClosest.className = selector.replace(/^\./, '')

    // For navigation tests, ensure the element can be queried
    mockClosest.querySelector = (childSelector) => {
      const mockChild = new MockElement('div')
      mockChild.className = childSelector.replace(/^\./, '')

      // Further support nested querying
      mockChild.querySelector = (grandchildSelector) => {
        const mockGrandchild = new MockElement('div')
        mockGrandchild.className = grandchildSelector.replace(/^\./, '')
        mockGrandchild.dataset = { id: 'mock-id' }
        return mockGrandchild
      }

      return mockChild
    }

    return mockClosest
  }

  // Simple matches implementation
  matches (selector) {
    if (selector.startsWith('.')) {
      return this.classList.contains(selector.substring(1))
    }
    return false
  }
}

// Create document fragment element
class MockDocumentFragment extends MockElement {
  constructor () {
    super('#document-fragment')
  }

  hasChildNodes () {
    return this.childNodes.length > 0
  }
}

// Set up global document object for tests
global.document = {
  createElement: (tag) => new MockElement(tag),
  createDocumentFragment: () => new MockDocumentFragment(),
  body: new MockElement('body'),
  __eventListeners: {},
  addEventListener: function (type, listener) {
    if (!this.__eventListeners[type]) {
      this.__eventListeners[type] = []
    }
    this.__eventListeners[type].push(listener)
  },
  removeEventListener: function (type, listener) {
    if (this.__eventListeners[type]) {
      this.__eventListeners[type] = this.__eventListeners[type]
        .filter(l => l !== listener)
    }
  },
  dispatchEvent: function (event) {
    if (this.__eventListeners[event.type]) {
      this.__eventListeners[event.type].forEach(listener => {
        listener(event)
      })
    }
    return !event.defaultPrevented
  },
  querySelector: (selector) => null,
  querySelectorAll: (selector) => []
}

// Set up global window object
global.window = {
  getComputedStyle: () => ({
    position: 'static',
    getPropertyValue: () => ''
  }),
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  innerWidth: 1024,
  innerHeight: 768,
  history: {
    pushState: () => {}
  },
  location: {
    pathname: '/'
  },
  navigator: {
    userAgent: 'test'
  },
  performance: {
    now: () => Date.now()
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
}

// Event constructor
global.Event = class Event {
  constructor (type, options = {}) {
    this.type = type
    this.bubbles = options.bubbles || false
    this.cancelable = options.cancelable || false
    this.defaultPrevented = false
    this.target = null
    this.currentTarget = null
    this.stopPropagation = () => {}
    this.stopImmediatePropagation = () => {}

    // Support for offsetX/Y for ripple tests
    this.offsetX = options.offsetX || 0
    this.offsetY = options.offsetY || 0
  }

  preventDefault () {
    if (this.cancelable) {
      this.defaultPrevented = true
    }
  }
}

// CustomEvent constructor
global.CustomEvent = class CustomEvent extends global.Event {
  constructor (type, options = {}) {
    super(type, options)
    this.detail = options.detail || {}
  }
}

// AbortController
global.AbortController = class AbortController {
  constructor () {
    this.signal = { aborted: false }
  }

  abort () {
    this.signal.aborted = true
  }
}

// Set up Element constructor
global.Element = MockElement

// Console mocking (preventing test output pollution)
const originalConsole = { ...console }
global.console = {
  ...console,
  log: (...args) => {
    if (process.env.DEBUG) {
      originalConsole.log(...args)
    }
  },
  warn: (...args) => {
    if (process.env.DEBUG) {
      originalConsole.warn(...args)
    }
  },
  error: (...args) => {
    // Always log errors
    originalConsole.error(...args)
  }
}
