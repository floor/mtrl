import extract from './extract'
import last from './last'
export default {
  remove: (events) => {
    // console.log('attach', events)
    events = events || this.options.events
    if (!events) return

    // console.log('attach', events, this)
    const instance = this
    events.map((def) => {
      const e = extract.e(instance, def[0])
      const f = extract.f(instance, def[1])
      const option = def[2]

      const keys = def[1].split('.')

      keys.pop()
      const bound = this.last(keys.join('.'))

      if (f && bound && e && e.element && e.element.addEventListener) {
        if (!f) { console.log('error') }

        if (option) {
          e.element.removeEventListener(e.name, f.bind(bound), option)
        } else {
          console.log('removeEventListener', e.name, f.bind(bound))
          e.element.removeEventListener(e.name, f.bind(bound), false)
        }
      } else if (e && e.element && e.element.off && f && bound) {
        e.element.off(e.name, f.bind(bound))
      } else {
        console.trace('can\'t be removed', def[0])
      }
    })

    return this
  }
}
