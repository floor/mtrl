// src/components/checkbox/api.js

/**
 * Enhances checkbox component with API methods
 * @param {Object} options - API configuration
 * @param {Object} options.disabled - Disabled state handlers
 * @param {Object} options.lifecycle - Lifecycle handlers
 * @param {Object} options.checkable - Checked state handlers
 */
export const withAPI = ({ disabled, lifecycle, checkable }) => (component) => ({
  ...component,
  element: component.element,

  // Value management
  getValue: component.getValue,
  setValue (value) {
    component.setValue(value)
    return this
  },

  // State management
  check: checkable.check,
  uncheck: checkable.uncheck,
  toggle: checkable.toggle,
  isChecked: checkable.isChecked,
  setIndeterminate: component.setIndeterminate,

  // Label management
  setLabel (text) {
    component.text?.setText(text)
    return this
  },
  getLabel () {
    return component.text?.getText() || ''
  },

  // Event handling
  on: component.on,
  off: component.off,

  // State management
  enable: disabled.enable,
  disable: disabled.disable,
  destroy: lifecycle.destroy
})
