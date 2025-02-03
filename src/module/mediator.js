const mediator = ((() => {
  const subscribe = function (store, fn) {
    if (!mediator.stores[store]) {
      mediator.stores[store] = []
    }

    mediator.stores[store].push({
      context: this,
      callback: fn
    })

    return this
  }

  const unsubscribe = function (store, fn) {
    if (!mediator.stores[store]) {
      return this
    }

    mediator.stores[store] = mediator.stores[store].filter(subscription => subscription.callback !== fn)

    return this
  }

  const publish = function (store, ...args) {
    // console.log('publish', store, args)
    if (!mediator.stores[store]) {
      return false
    }

    for (const value of mediator.stores[store]) {
      const subscription = value
      subscription.callback.apply(subscription.context, args)
    }

    return this
  }

  return {
    stores: {},
    publish,
    subscribe,
    unsubscribe,
    installTo: function (obj) {
      obj.subscribe = subscribe
      obj.publish = publish
    },

    init: function (obj) {
      obj.subscribe = subscribe
      obj.publish = publish
    }
  }
})())

export default mediator
