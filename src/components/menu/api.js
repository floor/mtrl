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
   * @returns {Object} Component instance
   */
  show () {
    component.show()
    return this
  },

  /**
   * Hides the menu
   * @returns {Object} Component instance
   */
  hide () {
    component.hide()
    return this
  },

  /**
   * Positions the menu relative to a target
   * @param {HTMLElement} target - Target element
   * @param {Object} options - Position options
   * @returns {Object} Component instance
   */
  position (target, options) {
    component.position(target, options)
    return this
  },

  /**
   * Adds an item to the menu
   * @param {Object} config - Item configuration
   * @returns {Object} Component instance
   */
  addItem (config) {
    component.addItem?.(config)
    return this
  },

  /**
   * Removes an item by name
   * @param {string} name - Item name to remove
   * @returns {Object} Component instance
   */
  removeItem (name) {
    component.removeItem?.(name)
    return this
  },

  /**
   * Gets all registered items
   * @returns {Map} Map of item names to configurations
   */
  getItems () {
    return component.getItems?.()
  },

  /**
   * Checks if the menu is currently visible
   * @returns {boolean} Whether the menu is visible
   */
  isVisible () {
    return component.isVisible?.()
  },

  /**
   * Registers an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Object} Component instance
   */
  on (event, handler) {
    component.on(event, handler)
    return this
  },

  /**
   * Unregisters an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {Object} Component instance
   */
  off (event, handler) {
    component.off(event, handler)
    return this
  },

  /**
   * Destroys the menu component and cleans up resources
   * @returns {Object} Component instance
   */
  destroy () {
    // First close any open submenus
    component.hide?.()

    // Then destroy the component
    lifecycle.destroy?.()

    // Final cleanup - forcibly remove from DOM if still attached
    if (component.element && component.element.parentNode) {
      component.element.remove()
    }

    return this
  }
})
