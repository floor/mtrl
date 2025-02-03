import emitter from './module/emitter'
import events from './module/events'
import dataset from './module/dataset'
import attributes from './module/attributes'
import * as css from './module/css'

class Textfield {
  static isComponent () {
    return true
  }

  static defaults = {
    class: 'textfield',
    attributes: ['type', 'name', 'title', 'maxlength', 'pattern', 'min', 'max', 'placeholder', 'readonly', 'autocomplete', 'required', 'disabled'],
    events: [
      ['input.input', 'onInput'],
      ['input.focus', 'onFocus'],
      ['input.blur', 'onBlur'],
      ['input.click', 'onClick']
    ]
  }

  constructor (options) {
    this.init(options)
    this.build()
    events.attach(this.options.events, this)
  }

  init (options) {
    this.options = { ...Textfield.defaults, ...options }
    Object.assign(this, emitter, dataset)
    // console.log('options', options)
  }

  build () {
    const tag = this.options.tag || 'div'

    this.element = document.createElement(tag)
    this.element.classList.add('textfield')

    if (this.options.class !== 'textfield') {
      css.add(this.element, this.options.class)
    }

    this.buildLabel()
    this.buildInput()

    if (this.options.value) {
      this.set(this.options.value)
    }

    if (this.options.data) {
      dataset(this.element, this.options.data)
    }

    if (this.container) {
      this.container.appendChild(this.element)
    }

    return this
  }

  buildLabel () {
    if (this.options.label) {
      this.label = document.createElement('label')
      this.label.classList.add('label')
      this.label.innerHTML = this.options.label
      this.element.appendChild(this.label)
    }
  }

  buildInput () {
    let tag = 'input'
    if (this.options.type === 'multiline') {
      tag = 'textarea'
    }

    this.input = document.createElement(tag)
    this.input.classList.add('input')

    this.element.appendChild(this.input)

    attributes(this.input, this.options)

    if (this.options.focus) {
      this.input.focus()
    }
  }

  onInput (ev) {
    // console.log('onInput', this.value, this.input.value)

    this.emit('change', ev)
  }

  onFocus (ev) {
    this.element.classList.add('focused')
    this.emit('focus', ev)
  }

  onBlur (ev) {
    this.element.classList.remove('focused')
    this.emit('blur', ev)
  }

  onClick (ev) {
    // console.log('click')
    this.emit('click', ev)
  }

  /**
   * Setter
   * @param {string} prop
   * @param {string} value
   * @return {Object} The class instance
   */
  set (prop, value) {
    // console.log('set', this.element, prop, value)
    switch (prop) {
      case 'value':
        this.setValue(value)
        break
      case 'label':
        this.setLabel(value)
        break
      default:
        // console.log('prop', prop)
        this.setValue(prop)
    }

    return this
  }

  setValue (value) {
    // console.log('set', typeof value, value)
    if (value && value !== 'undefined') {
      this.value = value
      this.input.value = value
    } else {
      this.input.value = ''
    }
  }

  setLabel (value) {
    // console.log('setLabel', value)
    if (this.label) {
      this.label.innerHTML = value
    }
  }

  setText (value) {
    this.setLabel(value)

    if (this.options.placeholder) {
      this.input.placeholder = value
    }
  }

  hide () {
    this.element.classList.add('hide')
  }

  show () {
    this.element.classList.remove('hide')
  }

  get () {
    return this.input.value
  }

  getValue () {
    return this.input.value
  }
}

export default Textfield
