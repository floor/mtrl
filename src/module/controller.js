const controller = {
  register (instance, group) {
    group = group || 'component'
    this[group + 's'] = this[group + 's'] || []
    this[group] = this[group] || {}
    // console.log('register', component.class);
    this[group + 's'].push(instance)

    this[group][instance.name] = this[group][instance.name] || []

    this[group][instance.name].push(instance)

    return this
  },

  subscribe (topic, callback) {
    this._topics = this._topics || {}

    // _log.debug('subscribe', topic);
    if (!this._topics.hasOwnProperty(topic)) {
      this._topics[topic] = []
    }

    this._topics[topic].push(callback)
    return true
  },

  unsunscribe (topic, callback) {
    this._topics = this._topics || {}
    // _log.debug('unsubscribe', topic);
    if (!this._topics.hasOwnProperty(topic)) {
      return false
    }

    for (let i = 0, len = this._topics[topic].length; i < len; i++) {
      if (this._topics[topic][i] === callback) {
        this._topics[topic].splice(i, 1)
        return true
      }
    }

    return false
  },

  publish () {
    this._topics = this._topics || {}

    const args = Array.prototype.slice.call(arguments)
    const topic = args.shift()
    // _log.debug('publish', topic);
    if (!this._topics.hasOwnProperty(topic)) {
      return false
    }

    for (let i = 0, len = this._topics[topic].length; i < len; i++) {
      this._topics[topic][i].apply(undefined, args)
    }
    return true
  }
}

export default controller
