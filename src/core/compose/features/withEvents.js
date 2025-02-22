// src/core/compose/features/withEvents.js
import { createEventManager } from '../../state/events'

/**
 * Adds event handling capabilities to a component
 * @param {HTMLElement} [target] - Optional custom event target
 * @returns {Function} Component enhancer
 */
export const withEvents = (target) => (component) => {
  const events = createEventManager(target || component.element)

  // Enhanced event methods
  const enhancedEvents = {
    /**
     * Add multiple event listeners at once
     * @param {Object} listeners - Map of event types to handlers
     */
    addListeners (listeners) {
      Object.entries(listeners).forEach(([event, handler]) => {
        events.on(event, handler)
      })
      return this
    },

    /**
     * Remove multiple event listeners at once
     * @param {Object} listeners - Map of event types to handlers
     */
    removeListeners (listeners) {
      Object.entries(listeners).forEach(([event, handler]) => {
        events.off(event, handler)
      })
      return this
    },

    /**
     * One-time event handler
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    once (event, handler) {
      const wrappedHandler = (e) => {
        handler(e)
        events.off(event, wrappedHandler)
      }
      events.on(event, wrappedHandler)
      return this
    }
  }

  // Add lifecycle integration
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy
    component.lifecycle.destroy = () => {
      events.destroy()
      originalDestroy?.call(component.lifecycle)
    }
  }

  return {
    ...component,
    events,
    on: events.on.bind(events),
    off: events.off.bind(events),
    ...enhancedEvents
  }
}
