import extract from './extract'
import last from './last'

const events = {
  eventHandlers: {}, // Use an array to store events and handlers

  attach (eventsArray, context) {
    if (!eventsArray) return

    // Ensure each context has a unique UID
    const uid = context._uid || (context._uid = context.options.class + Math.random().toString(36).substr(2, 9))

    // Initialize storage for this context if it doesn't already exist
    this.eventHandlers[uid] = this.eventHandlers[uid] || {}

    eventsArray.forEach(([eventDef, funcDef, option]) => {
      const e = extract.e(context, eventDef)
      const isFunction = typeof funcDef === 'function'
      let f = null
      let keys = []

      if (!isFunction) {
        f = extract.f(context, funcDef)
        keys = funcDef.split('.')
        keys.pop()
      }

      const bound = last(keys.join('.'), context)
      let handler = null

      if (isFunction) {
        handler = funcDef.bind(context)
      } else if (f && bound) {
        handler = f.bind(bound)
      } else {
        // throw new Error('Cannot bind function for eventDef')
        // console.trace('Cannot bind function for eventDef')
        return // Cannot bind function for eventDef
      }

      let isPassive = false
      if (e.name === 'touchstart' || e.name === 'touchmove') {
        isPassive = true
        option = { ...option, passive: true }
      }

      if (!this.eventHandlers[uid][eventDef]) {
        if (handler && e && e.element?.addEventListener) {
          e.element.addEventListener(e.name, handler, isPassive ? { passive: true } : option)
          this.eventHandlers[uid][eventDef] = handler
        } else if (e && e.element?.on && handler) {
          e.element.on(e.name, handler)
          this.eventHandlers[uid][eventDef] = handler
        }
      }
    })

    return this
  },

  detach (eventsArray, context) {
    const uid = context._uid
    if (!this.eventHandlers[uid]) return

    eventsArray.forEach(([eventDef, funcDef, option]) => {
      const e = extract.e(context, eventDef)
      const handler = this.eventHandlers[uid][eventDef]
      if (handler) {
        e.element.removeEventListener(e.name, handler)
      } else if (e.element.off) {
        e.element.off(e.name, handler)
      }

      delete this.eventHandlers[uid][eventDef]
    }
    )
  },

  list (context) {
    const uid = context?._uid
    return uid ? this.eventHandlers[uid] || {} : this.eventHandlers
  }
}

export default events
