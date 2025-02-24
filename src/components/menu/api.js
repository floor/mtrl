// src/components/menu/api.js

/**
 * Enhances menu component with API methods
 * @param {Object} options - API configuration
 * @param {Object} options.lifecycle - Lifecycle handlers
 */
export const withAPI = ({ lifecycle }) => (component) => ({
  ...component,
  element: component.element,

  /**
   * Shows the menu
   */
  show () {
    component.show()
    return this
  },

  /**
   * Hides the menu
   */
  hide () {
    component.hide()
    return this
  },

  /**
   * Positions the menu relative to a target
   */
  position (target, options) {
    component.position(target, options)
    return this
  },

  /**
   * Adds an item to the menu
   */
  addItem (config) {
    component.addItem?.(config)
    return this
  },

  /**
   * Removes an item by name
   */
  removeItem (name) {
    component.removeItem?.(name)
    return this
  },

  // Event handling
  on: component.on,
  off: component.off,

  // Cleanup
  destroy () {
    // First close any open submenus
    component.hide?.()
    // Then destroy the component
    lifecycle.destroy?.()
    // Finally remove from DOM if still attached
    if (component.element && component.element.parentNode) {
      component.element.remove()
    }
    return this
  }
})
