// src/core/state/events.js
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

/**
 * Creates an event manager to handle DOM events with enhanced functionality.
 * Provides a robust interface for managing event listeners with error handling,
 * cleanup, and lifecycle management.
 *
 * @param {HTMLElement} element - DOM element to attach events to
 * @returns {Object} Event manager interface with the following methods:
 *
 * @property {Function} on - Adds an event listener with options
 * @property {Function} off - Removes an event listener
 * @property {Function} pause - Temporarily disables all event listeners
 * @property {Function} resume - Re-enables all event listeners
 * @property {Function} destroy - Removes all event listeners and cleans up
 * @property {Function} getHandlers - Gets all active handlers
 * @property {Function} hasHandler - Checks if a specific handler exists
 *
 * @example
 * const manager = createEventManager(myElement);
 *
 * // Add a listener
 * manager.on('click', (e) => console.log('clicked'), { capture: true });
 *
 * // Remove a listener
 * manager.off('click', myHandler);
 *
 * // Pause all events
 * manager.pause();
 *
 * // Resume all events
 * manager.resume();
 *
 * // Cleanup
 * manager.destroy();
 */
export const createEventManager = (element) => {
  // Store handlers with their metadata
  const handlers = new Map()

  /**
   * Private helper to create a unique handler identifier
   * @memberof module:core/dom
   * @private
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @returns {string} Unique identifier
   */
  const createHandlerId = (event, handler) =>
    `${event}_${handler.toString()}`

  /**
   * Wraps an event handler with error boundary and logging
   * @memberof module:core/dom
   * @private
   * @param {Function} handler - Original event handler
   * @param {string} event - Event name for error context
   * @returns {Function} Enhanced handler with error boundary
   */
  const enhanceHandler = (handler, event) => (e) => {
    try {
      handler(e)
    } catch (error) {
      console.error(`Error in ${event} handler:`, error)
    }
  }

  /**
   * Safely removes event listener
   * @memberof module:core/dom
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  const safeRemoveListener = (event, handler) => {
    try {
      element.removeEventListener(event, handler)
    } catch (error) {
      console.warn(`Failed to remove ${event} listener:`, error)
    }
  }

  return {
    /**
     * Adds an event listener with options
     * @memberof module:core/dom
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object} [options] - addEventListener options
     */
    on (event, handler, options = {}) {
      const enhanced = enhanceHandler(handler, event)
      const id = createHandlerId(event, handler)

      handlers.set(id, {
        original: handler,
        enhanced,
        event,
        options
      })

      element.addEventListener(event, enhanced, options)
      return this
    },

    /**
     * Removes an event listener
     * @memberof module:core/dom
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off (event, handler) {
      const id = createHandlerId(event, handler)
      const stored = handlers.get(id)

      if (stored) {
        safeRemoveListener(event, stored.enhanced)
        handlers.delete(id)
      }
      return this
    },

    /**
     * Temporarily disables all event listeners
     */
    pause () {
      handlers.forEach(({ enhanced, event, options }) => {
        safeRemoveListener(event, enhanced)
      })
      return this
    },

    /**
     * Re-enables all event listeners
     */
    resume () {
      handlers.forEach(({ enhanced, event, options }) => {
        element.addEventListener(event, enhanced, options)
      })
      return this
    },

    /**
     * Removes all event listeners and cleans up
     */
    destroy () {
      handlers.forEach(({ enhanced, event }) => {
        safeRemoveListener(event, enhanced)
      })
      handlers.clear()
    },

    /**
     * Gets all active handlers
     * @returns {Map} Map of active handlers
     */
    getHandlers () {
      return new Map(handlers)
    },

    /**
     * Checks if a specific handler exists
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @returns {boolean} Whether handler exists
     */
    hasHandler (event, handler) {
      const id = createHandlerId(event, handler)
      return handlers.has(id)
    }
  }
}
