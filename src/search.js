import EventEmitter from './mixin/emitter'

import build from './mixin/build'
import display from './mixin/display'
import events from './module/events'

import Element from './element'
import Button from './button'

class Search extends EventEmitter {
  static defaults = {
    class: 'search-input',
    minChar: 4,
    timeout: 200,
    layout: [
      [Element, 'input', { tag: 'input', class: 'input' }],
      [Button, 'clear', { class: 'clear' }]
    ],
    events: [
      ['ui.input.input', 'onInput'],
      ['ui.clear.click', 'onClear']
    ]
  }

  constructor (options) {
    super()

    this.init(options)
    this.build()
    this.setup()
  }

  init (options) {
    this.options = { ...Search.defaults, ...options }
    Object.assign(this, build, display)
  }

  setup () {
    events.attach(this.options.events, this)

    this.input = this.ui.input
  }

  set (value) {
    if (value) this.input.value = value
    else this.input.value = ''
  }

  focus () {
    this.ui.input.focus()
  }

  onInput () {
    if (this.ui.input.value.length < this.options.minChar) return

    clearTimeout(this.timeout)

    this.timeout = setTimeout(() => {
      this.emit('change', this.ui.input.value)
    }, this.options.timeout)
  }

  onClear () {
    this.set(null)
    this.focus()
    this.emit('cancel')
  }
}

export default Search
