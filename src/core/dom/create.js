// src/core/dom/create.js
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

import { setAttributes } from './attributes'
import { normalizeClasses } from '../utils'

/**
 * Creates a DOM element with the specified options
 * @memberof module:core/dom
 * @param {Object} options - Element creation options
 * @param {string} [options.tag='div'] - HTML tag name
 * @param {HTMLElement} [options.container] - Container to append element to
 * @param {string} [options.html] - Inner HTML content
 * @param {string} [options.text] - Text content
 * @param {string} [options.id] - Element ID
 * @param {Object} [options.data] - Dataset attributes
 * @param {string|string[]} [options.className] - CSS classes
 * @param {Object} [options.attrs] - HTML attributes
 * @param {Object} [options.forwardEvents] - Events to forward when component has emit method
 * @param {Function} [options.onCreate] - Callback after element creation
 * @returns {HTMLElement} Created element
 */
export const createElement = (options = {}) => {
  const {
    tag = 'div',
    container = null,
    html = '',
    text = '',
    id = '',
    data = {},
    className,
    attrs = {},
    forwardEvents = {},
    onCreate,
    context,
    ...rest
  } = options

  const element = document.createElement(tag)

  // Handle content
  if (html) element.innerHTML = html
  if (text) element.textContent = text
  if (id) element.id = id

  // Handle classes
  if (className) {
    const normalizedClasses = normalizeClasses(className)
    if (normalizedClasses.length) {
      element.classList.add(...normalizedClasses)
    }
  }

  // Handle data attributes
  Object.entries(data).forEach(([key, value]) => {
    element.dataset[key] = value
  })

  // Handle all other attributes
  const allAttrs = { ...attrs, ...rest }
  Object.entries(allAttrs).forEach(([key, value]) => {
    if (value != null) element.setAttribute(key, value)
  })

  // Handle event forwarding if context has emit method
  if (context?.emit && forwardEvents) {
    Object.entries(forwardEvents).forEach(([nativeEvent, eventConfig]) => {
      const shouldForward = typeof eventConfig === 'function'
        ? eventConfig
        : () => true

      element.addEventListener(nativeEvent, (event) => {
        if (shouldForward({ ...context, element }, event)) {
          context.emit(nativeEvent, { event })
        }
      })
    })
  }

  // Append to container if provided
  if (container) {
    container.appendChild(element)
  }

  if (typeof onCreate === 'function') {
    log.info('onCreate', element, context)
    onCreate(element, context)
  }

  return element
}

/**
 * Higher-order function to add attributes to an element
 * @param {Object} attrs - Attributes to add
 * @returns {Function} Element transformer
 */
export const withAttributes = (attrs) => (element) => {
  setAttributes(element, attrs)
  return element
}

/**
 * Higher-order function to add classes to an element
 * @memberof module:core/dom
 * @param {...string} classes - Classes to add
 * @returns {Function} Element transformer
 */
export const withClasses = (...classes) => (element) => {
  const normalizedClasses = normalizeClasses(...classes)
  if (normalizedClasses.length) {
    element.classList.add(...normalizedClasses)
  }
  return element
}

/**
 * Higher-order function to add content to an element
 * @memberof module:core/dom
 * @param {Node|string} content - Content to add
 * @returns {Function} Element transformer
 */
export const withContent = (content) => (element) => {
  if (content instanceof Node) {
    element.appendChild(content)
  } else {
    element.textContent = content
  }
  return element
}
