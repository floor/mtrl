import Component from './component'
import events from '../module/events'
import emitter from '../module/emitter'

class Control extends Component {
  static defaults = {
    base: 'control',
    ...Component.defaults,
    events: []
  }

  constructor (options) {
    super(options)

    // Initialize event storage
    this.events = {}

    // Mix in emitter functionality
    Object.assign(this, emitter)

    // Attach DOM events if specified in options
    if (this.options.events) {
      events.attach(this.options.events, this)
    }
  }

  destroy () {
    // First cleanup event listeners
    if (this.options.events) {
      events.detach(this.options.events, this)
    }

    // Clean up emitter subscriptions
    this.removeAll()

    // Emit destroy event before DOM removal
    this.emit('destroy')

    // Clear event storage
    this.events = null

    // Let parent handle DOM cleanup
    super.destroy()
  }
}

export default Control
