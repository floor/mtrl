// src/core/state/emitter.js
/**
 * @module core/state
 */

/**
 * Creates an event emitter with subscription management
 * @memberof module:core/state
 * @function createEmitter
 * @returns {Object} Event emitter interface
 * @property {Function} on - Subscribe to an event
 * @property {Function} off - Unsubscribe from an event
 * @property {Function} emit - Emit an event
 * @property {Function} clear - Clear all subscriptions
 * @example
 * const emitter = createEmitter()
 * const unsubscribe = emitter.on('change', (data) => console.log(data))
 * emitter.emit('change', { value: 42 })
 * unsubscribe()
 */
export const createEmitter = () => {
  const events = new Map()

  return {
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Event handler
     * @returns {Function} Unsubscribe function
     */
    on: (event, callback) => {
      const callbacks = events.get(event) || []
      events.set(event, [...callbacks, callback])

      return () => {
        const callbacks = events.get(event) || []
        events.set(event, callbacks.filter(cb => cb !== callback))
      }
    },

    off (event, callback) {
      const callbacks = events.get(event) || []
      events.set(event, callbacks.filter(cb => cb !== callback))
    },

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {...any} args - Event arguments
     */
    emit: (event, ...args) => {
      const callbacks = events.get(event) || []
      callbacks.forEach(cb => cb(...args))
    },

    /**
     * Clear all event listeners
     */
    clear: () => {
      events.clear()
    }
  }
}
