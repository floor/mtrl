// Event emitter mixin that can be extended into other objects
export default {
  // Initialize the events storage if needed
  _initEvents () {
    this.events = this.events || {}
  },

  // Add an event listener
  on (event, listener) {
    this._initEvents()
    // Use nullish coalescing assignment for array initialization
    this.events[event] ??= []
    this.events[event].push(listener)
    return this
  },

  // Emit an event with optional arguments
  emit (event, ...args) {
    this._initEvents()
    // Use optional chaining to safely access and iterate events
    this.events[event]?.forEach(listener => {
      try {
        listener.apply(this, args)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
    return this
  },

  // Remove a specific listener for an event
  off (event, listener) {
    this._initEvents()
    const listeners = this.events[event]
    if (listeners?.length) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
    return this
  },

  // Remove all listeners for an event or all events
  removeAll (event) {
    this._initEvents()
    if (event) {
      delete this.events[event]
    } else {
      this.events = {}
    }
    return this
  }
}
