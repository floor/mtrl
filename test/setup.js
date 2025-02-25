// test/setup.js
// Setup global DOM environment for testing

// Mock the document and window objects for DOM testing
// test/setup.js

// Mock DOM environment for testing
class MockElement {
  constructor (tagName) {
    this.tagName = tagName.toUpperCase()
    this.className = ''
    this.style = {}
    this.attributes = {}
    this.children = []
    this.eventListeners = {}
    this.innerHTML = ''
    this.textContent = ''
    this.dataset = {}
  }

  appendChild (child) {
    this.children.push(child)
    return child
  }

  insertBefore (newChild, referenceChild) {
    const index = referenceChild ? this.children.indexOf(referenceChild) : 0
    this.children.splice(index, 0, newChild)
    return newChild
  }

  removeChild (child) {
    const index = this.children.indexOf(child)
    if (index !== -1) {
      this.children.splice(index, 1)
    }
    return child
  }

  getAttribute (name) {
    return this.attributes[name]
  }

  setAttribute (name, value) {
    this.attributes[name] = value
  }

  removeAttribute (name) {
    delete this.attributes[name]
  }

  hasAttribute (name) {
    return name in this.attributes
  }

  querySelector (selector) {
    // Super simple selector matching for testing
    if (selector.startsWith('.')) {
      const className = selector.substring(1)
      return this.getElementsByClassName(className)[0] || null
    }
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
    if (this.className.split(' ').includes(className)) {
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
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = []
    }
    this.eventListeners[type].push(listener)
  }

  removeEventListener (type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type]
        .filter(l => l !== listener)
    }
  }

  dispatchEvent (event) {
    if (this.eventListeners[event.type]) {
      this.eventListeners[event.type].forEach(listener => {
        listener(event)
      })
    }
    return !event.defaultPrevented
  }

  get classList () {
    const classNames = this.className.split(' ').filter(Boolean)
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
        } else {
          classNames.push(c)
        }
        this.className = classNames.join(' ')
        return index === -1
      },
      contains: (c) => classNames.includes(c)
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
}

// Set up global document object for tests
global.document = {
  createElement: (tag) => new MockElement(tag),
  createDocumentFragment: () => new MockElement('fragment'),
  body: new MockElement('body'),
  eventListeners: {},
  addEventListener: function (type, listener) {
    if (!this.eventListeners[type]) {
      this.eventListeners[type] = []
    }
    this.eventListeners[type].push(listener)
  },
  removeEventListener: function (type, listener) {
    if (this.eventListeners[type]) {
      this.eventListeners[type] = this.eventListeners[type]
        .filter(l => l !== listener)
    }
  },
  dispatchEvent: function (event) {
    if (this.eventListeners[event.type]) {
      this.eventListeners[event.type].forEach(listener => {
        listener(event)
      })
    }
    return !event.defaultPrevented
  }
}

// Set up global window object
global.window = {
  getComputedStyle: () => ({
    position: 'static'
  })
}

// Set up Event constructor
global.Event = class Event {
  constructor (type) {
    this.type = type
    this.defaultPrevented = false
  }

  preventDefault () {
    this.defaultPrevented = true
  }
}

// Set up AbortController
global.AbortController = class AbortController {
  constructor () {
    this.signal = { aborted: false }
  }

  abort () {
    this.signal.aborted = true
  }
}

// Additional DOM setup if needed

global.document = {
  createElement: (tag) => {
    const element = {
      tagName: tag.toUpperCase(),
      classList: {
        add: (...classes) => {
          element.className = (element.className || '').split(' ')
            .concat(classes)
            .filter(Boolean)
            .join(' ')
        },
        remove: (...classes) => {
          if (!element.className) return
          const currentClasses = element.className.split(' ')
          element.className = currentClasses
            .filter(cls => !classes.includes(cls))
            .join(' ')
        },
        toggle: (cls) => {
          if (!element.className) {
            element.className = cls
            return true
          }

          const currentClasses = element.className.split(' ')
          const hasClass = currentClasses.includes(cls)

          if (hasClass) {
            element.className = currentClasses
              .filter(c => c !== cls)
              .join(' ')
            return false
          } else {
            element.className = [...currentClasses, cls]
              .filter(Boolean)
              .join(' ')
            return true
          }
        },
        contains: (cls) => {
          if (!element.className) return false
          return element.className.split(' ').includes(cls)
        },
        toString: () => element.className || ''
      },
      style: {},
      dataset: {},
      attributes: {},
      children: [],
      childNodes: [],
      innerHTML: '',
      textContent: '',
      appendChild: (child) => {
        element.children.push(child)
        element.childNodes.push(child)
        child.parentNode = element
        return child
      },
      insertBefore: (newChild, refChild) => {
        const index = refChild ? element.children.indexOf(refChild) : 0
        if (index === -1) {
          element.children.push(newChild)
        } else {
          element.children.splice(index, 0, newChild)
        }
        element.childNodes = [...element.children]
        newChild.parentNode = element
        return newChild
      },
      removeChild: (child) => {
        const index = element.children.indexOf(child)
        if (index !== -1) {
          element.children.splice(index, 1)
          element.childNodes = [...element.children]
        }
        return child
      },
      remove: () => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      },
      querySelector: (selector) => {
        // Very basic selector implementation - only supports class selectors for now
        if (selector.startsWith('.')) {
          const className = selector.slice(1)
          return element.children.find(child =>
            child.className && child.className.split(' ').includes(className)
          )
        }
        return null
      },
      querySelectorAll: (selector) => {
        // Very basic selector implementation for tests
        if (selector.startsWith('.')) {
          const className = selector.slice(1)
          return element.children.filter(child =>
            child.className && child.className.split(' ').includes(className)
          )
        }
        return []
      },
      getBoundingClientRect: () => ({
        width: 100,
        height: 50,
        top: 0,
        left: 0,
        right: 100,
        bottom: 50
      }),
      setAttribute: (name, value) => {
        element.attributes[name] = value
        if (name === 'class') element.className = value
      },
      removeAttribute: (name) => {
        delete element.attributes[name]
        if (name === 'class') element.className = ''
      },
      getAttribute: (name) => element.attributes[name] || null,
      hasAttribute: (name) => name in element.attributes,
      addEventListener: (event, handler) => {
        element.__handlers = element.__handlers || {}
        element.__handlers[event] = element.__handlers[event] || []
        element.__handlers[event].push(handler)
      },
      removeEventListener: (event, handler) => {
        if (!element.__handlers?.[event]) return
        element.__handlers[event] = element.__handlers[event].filter(h => h !== handler)
      },
      dispatchEvent: (event) => {
        if (!element.__handlers?.[event.type]) return true
        element.__handlers[event.type].forEach(handler => handler(event))
        return !event.defaultPrevented
      }
    }
    return element
  },
  createDocumentFragment: () => {
    return {
      children: [],
      childNodes: [],
      appendChild: function (child) {
        this.children.push(child)
        this.childNodes.push(child)
        child.parentNode = this
        return child
      },
      hasChildNodes: function () {
        return this.childNodes.length > 0
      },
      querySelector: () => null,
      querySelectorAll: () => []
    }
  },
  body: {
    appendChild: () => {},
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    dispatchEvent: () => true,
    getAttribute: () => null,
    setAttribute: () => {}
  }
}

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

// Mock for CustomEvent
global.CustomEvent = class CustomEvent {
  constructor (type, options = {}) {
    this.type = type
    this.detail = options.detail || {}
    this.defaultPrevented = false
  }

  preventDefault () {
    this.defaultPrevented = true
  }
}

global.Event = class Event {
  constructor (type) {
    this.type = type
    this.defaultPrevented = false
  }

  preventDefault () {
    this.defaultPrevented = true
  }
}

// Mock console methods to prevent test output pollution
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
