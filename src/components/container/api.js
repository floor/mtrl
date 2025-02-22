// src/components/container/api.js

/**
 * Enhances container component with API methods
 * @param {Object} options - API configuration
 * @param {Object} options.lifecycle - Lifecycle handlers
 */
export const withAPI = ({ lifecycle }) => (component) => ({
  ...component,
  element: component.element,

  // Attribute management
  get (prop) {
    return component.element.getAttribute(prop)
  },
  set (prop, value) {
    value === null
      ? component.element.removeAttribute(prop)
      : component.element.setAttribute(prop, value)
    return this
  },

  // Content management
  setContent (content) {
    if (content instanceof Node) {
      component.element.appendChild(content)
    } else {
      component.element.innerHTML = content
    }
    return this
  },
  getContent () {
    return component.element.innerHTML
  },

  // Event handling
  on: component.on,
  off: component.off,

  // Lifecycle
  destroy: lifecycle.destroy
})
