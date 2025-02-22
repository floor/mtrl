// src/core/state/events.js
export const createEventManager = (element) => {
  const handlers = new Map()

  return {
    on (event, handler) {
      element.addEventListener(event, handler)
      handlers.set(handler, event)
      return this
    },

    off (event, handler) {
      element.removeEventListener(event, handler)
      handlers.delete(handler)
      return this
    },

    destroy () {
      handlers.forEach((event, handler) => {
        element.removeEventListener(event, handler)
      })
      handlers.clear()
    },

    getHandlers () {
      return handlers
    }
  }
}
