// base
import EventEmitter from './mixin/emitter'
// module
import build from './mixin/build'
import dataset from './module/dataset'
import events from './module/events'
import attributes from './module/attributes'
// ui
import Element from './element'

class Switch extends EventEmitter {
  static defaults = {
    class: 'switch',
    attributes: ['type', 'name', 'required', 'checked'],
    layout: [
      [Element, 'input', { class: 'input', type: 'checkbox' }],
      [Element, 'control', { class: 'control' },
        [Element, 'track', { class: 'track' },
          [Element, 'knob', { class: 'knob' }]
        ]
      ]
    ],
    events: [
      ['ui.control.click', 'toggle'],
      // ['ui.label.click', 'toggle'],
      // for accessibility purpose
      ['ui.input.click', 'toggle'],
      ['ui.input.focus', 'focus'],
      ['ui.input.blur', 'blur']
    ]
  }

  constructor (options) {
    // console.log('switch')
    super()

    this.init(options)
    this.build()
    this.setup()
    events.attach(this.options.events, this)
  }

  init (options) {
    this.options = Object.assign({}, Switch.defaults, options || {})
    Object.assign(this, build, dataset)

    this.value = this.options.value
  }

  setup () {
    this.styleAttributes()

    if (this.options.data) {
      dataset(this.element, this.options.data)
    }

    // console.log('attribute', this.ui.input, this.options)
    attributes(this.ui.input, this.options)

    if (this.options.checked) {
      this.check(true)
    }

    if (this.value) {
      this.element.input.setAttribute('checked', 'checked')
    }

    if (this.options.tooltip) {
      this.element.setAttribute('data-tooltip', this.options.tooltip)
    }

    this.ui.input.setAttribute('aria-label', this.options.name)

    if (this.options.case) {
      this.element.classList.add(this.options.case + '-case')
    }
  }

  styleAttributes () {
    if (this.options.style) {
      this.element.classList.add('style-' + this.options.style)
    }

    if (this.options.size) {
      this.element.classList.add(this.options.size + '-size')
    }

    if (this.options.color) {
      this.element.classList.add('color-' + this.options.color)
    }

    if (this.options.bold) {
      this.element.classList.add('bold')
    }
  }

  set (prop, value, silent) {
    switch (prop) {
      case 'value':
        this.setValue(value, silent)
        break
      case 'text':
        this.setText(value)
        break
      case 'disabled':
        if (value === true) {
          this.disable()
        } else if (value === false) {
          this.enable()
        }
        break
      default:
        this.setValue(prop, value)
    }

    return this
  }

  setLabel (value) {
    // console.log('setLabel', value)
    if (this.ui.label) {
      this.ui.label.innerHTML = value
    }
  }

  setText (value) {
    this.setLabel(value)
  }

  get () {
    return this.value
  }

  getValue () {
    return this.value
  }

  setValue (value, silent) {
    this.check(value, silent)
  }

  toggle () {
    if (this.disabled) return

    this.focus()

    if (this.checked) {
      this.check(false)
    } else {
      this.check(true)
    }

    return this
  }

  check (checked, silent) {
    // console.log('check', checked, silent)
    if (checked === true) {
      this.element.classList.add('is-checked')
      this.ui.input.checked = true
      this.checked = true
      this.value = true
    } else {
      this.element.classList.remove('is-checked')
      this.ui.input.checked = false
      this.checked = false
      this.value = false
    }

    if (!silent) {
      this.emit('change', this.checked)
    }
    return this
  }

  focus () {
    if (this.disabled === true) return this

    this.element.classList.add('is-focused')
    if (this.ui.input !== document.activeElement) { this.ui.input.focus() }
    return this
  }

  blur () {
    this.element.classList.remove('is-focused')
    return this
  }
}

export default Switch
