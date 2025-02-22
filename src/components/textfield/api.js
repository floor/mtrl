// src/components/textfield/api.js

/**
 * Enhances textfield component with API methods
 * @param {Object} options - API configuration
 * @param {Object} options.disabled - Disabled state handlers
 * @param {Object} options.lifecycle - Lifecycle handlers
 */
export const withAPI = ({ disabled, lifecycle }) => (component) => ({
  ...component,
  // Core element reference
  element: component.element,

  // Value management
  getValue: () => component.getValue(),
  setValue (value) {
    component.setValue(value)
    return this
  },

  // Attributes API
  setAttribute (name, value) {
    component.setAttribute(name, value)
    return this
  },
  getAttribute: component.getAttribute,
  removeAttribute (name) {
    component.removeAttribute(name)
    return this
  },

  // Label management
  setLabel (text) {
    component.label?.setText(text)
    return this
  },
  getLabel () {
    return component.label?.getText() || ''
  },

  // Event handling
  on: component.on,
  off: component.off,

  // State management
  enable: disabled.enable,
  disable: disabled.disable,
  destroy: lifecycle.destroy
})
