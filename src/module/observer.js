const observer = (() => {
  const watch = function (event, fn, context = this) {
    if (typeof event !== 'string' || typeof fn !== 'function') {
      throw new Error('Invalid arguments. Event must be a string and callback must be a function.')
    }

    if (!observer.events[event]) {
      observer.events[event] = []
    }

    observer.events[event].push({
      context,
      callback: fn
    })

    return this
  }

  const unwatch = function (event, fn) {
    if (!observer.events[event]) return this

    observer.events[event] = observer.events[event].filter(subscriber => subscriber.callback !== fn)

    return this
  }

  const notify = function (event, ...args) {
    if (!this.events[event]) return this

    for (const { context, callback } of this.events[event]) {
      callback.apply(context, args)
    }

    return this
  }

  return {
    events: {},
    watch,
    unwatch,
    notify,
    init: function (obj) {
      obj.watch = watch
      obj.unwatch = unwatch
      obj.notify = notify
    }
  }
})()

export default observer
