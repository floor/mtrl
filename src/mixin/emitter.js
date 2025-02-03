class EventEmitter {
  constructor () {
    this.events = {}
  }

  on (event, listener) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)

    return this
  }

  emit (event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener.apply(this, args))
    }
    return this
  }
}

export default EventEmitter
