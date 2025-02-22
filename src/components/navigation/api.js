// src/components/navigation/api.js

/**
 * Enhances navigation component with API methods
 * @param {Object} options - API configuration
 * @param {Object} options.disabled - Disabled state handlers
 * @param {Object} options.lifecycle - Lifecycle handlers
 */
export const withAPI = ({ disabled, lifecycle }) => (component) => ({
  ...component,
  element: component.element,

  // Item management
  addItem (config) {
    component.addItem?.(config)
    return this
  },
  removeItem (id) {
    component.removeItem?.(id)
    return this
  },
  getItem (id) {
    return component.getItem?.(id)
  },

  // Active state management
  setActive (id) {
    component.setActive?.(id)
    return this
  },
  getActive () {
    return component.getActive?.()
  },

  // Event handling
  on: component.on,
  off: component.off,

  // State management
  enable: disabled.enable,
  disable: disabled.disable,
  destroy: lifecycle.destroy
})
