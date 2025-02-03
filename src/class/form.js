import Component from './component'
import events from '../module/events'
import build from '../form/build'
import emitter from '../module/emitter'

class Form {
  static defaults = {
    base: 'form',
    events: []
  }

  constructor (options) {
    this.options = { ...this.constructor.defaults, ...options }

    const mixins = this.options.mixins || []
    mixins.forEach(mixin => Object.assign(this, mixin))

    Object.assign(this, build, emitter)

    this.build(this)

    this.events = {}

    if (this.options.events) {
      events.attach(this.options.events, this)
    }
  }
}

export default Form
