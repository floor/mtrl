import Control from './class/control'

import icon from './skin/material/icon/checkbox.svg'
import Element from './element'

class Checkbox extends Control {
  static defaults = {
    class: 'checkbox',
    layout: [
      [Element, 'input', { type: 'checkbox' }],
      [Element, 'control', { type: 'checkbox' }],
      [Element, 'label', { tag: 'label' }]
    ],
    events: [
      ['ui.control.click', 'click'],
      ['ui.label.click', 'check'],
      // for accessibility purpose
      // ['element.input.click', 'toggle'],
      ['ui.input.focus', 'focus'],
      ['ui.input.blur', 'blur'],
      ['ui.input.keydown', 'keydown']
    ]
  }

  constructor (options) {
    super(options)
    this.setup()
  }

  setup () {
    this.ui.control.innerHTML = icon

    const text = this.options.text || this.options.label

    this.ui.label.innerHTML = text

    this.ui.input.setAttribute('type', 'checkbox')
    this.ui.input.setAttribute('name', this.options.name)
    this.ui.input.setAttribute('aria-label', this.options.name)

    if (this.options.value) {
      this.ui.input.setAttribute('value', this.options.value)
    }

    if (this.options.disabled) {
      this.disabled = this.options.disabled
      this.ui.input.setAttribute('disabled', 'disabled')
      this.element.classList.add('is-disabled')
    }

    if (this.options.checked) {
      this.check(true)
    }

    if (this.options.value) {
      this.set('value', this.value)
    }
  }

  set (prop, value) {
    switch (prop) {
      case 'checked':
        this.check(value)
        break
      case 'value':
        this.setValue(value)
        break
      case 'label':
        this.setLabel(value)
        break
      default:
        this.check(prop)
    }

    return this
  }

  get () {
    return this.value
  }

  check (value) {
    if (value === true) {
      this.element.classList.add('is-checked')
      this.ui.input.checked = true
      this.value = true
      this.emit('change', this.value)
    } else {
      this.element.classList.remove('is-checked')
      this.ui.input.checked = false
      this.value = false
      this.emit('change', this.value)
    }
    return this
  }

  onClick (e) {
    this.ui.input.focus()
    if (this.element.classList.add('is-checked')) {
      this.check(false)
    } else {
      this.check(true)
    }

    return this
  }

  setValue (value) {
    // console.log('setValue', value)
    this.value = value
    this.ui.input.setAttribute('value', value)

    return this
  }
}

export default Checkbox
