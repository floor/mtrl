import {
  Control,
  display,
  dataset,
  ripple
} from '../index'

const DEFAULT_TYPE = 'button'
const DEFAULT_CLASS = 'button'

class Button extends Control {
  static isComponent () {
    return true
  }

  static defaults = {
    class: 'button',
    tag: 'button',
    styles: ['style', 'color'],
    mixins: [display],
    ripple: true,
    stopPropagation: false,
    events: [
      ['element.click', 'click'],
      ['element.keydown', 'onKeyDown'],
      ['element.mousedown', 'mousedown'],
      ['element.mouseup', 'mouseup'],
      ['element.mouseleave', 'mouseup'],
      ['element.touchstart', 'mousedown'],
      ['element.touchend', 'mouseup']
    ]
  }

  constructor (options) {
    super(options)

    this.setup()
  }

  setup () {
    this.setAttributes()
    this.styleAttributes()

    if (this.options.text) {
      this.element.innerHTML = this.element.innerHTML + this.options.text
    }
  }

  setAttributes () {
    const { type, name, value, title, text, label, tooltip, data, case: caseOption } = this.options

    this.element.setAttribute('type', type ?? DEFAULT_TYPE)
    if (name) this.element.setAttribute('name', name)
    if (value) this.element.setAttribute('value', value)
    if (title) this.element.setAttribute('title', title)
    this.element.setAttribute('aria-label', text ?? label ?? DEFAULT_CLASS)
    if (tooltip) this.element.setAttribute('data-tooltip', tooltip)
    if (data) dataset(this.element, data)
    if (caseOption) this.element.classList.add(`${caseOption}-case`)
    if (this.options.ripple) ripple(this.element)

    if (this.options.disabled) this.disable()
  }

  styleAttributes () {
    const { style, size, color, bold } = this.options
    if (style) this.element.classList.add(`style-${style}`)
    if (size) this.element.classList.add(`${size}-size`)
    if (color) this.element.classList.add(`color-${color}`)
    if (bold) this.element.classList.add('bold')
  }

  set (prop, value) {
    // console.log('set', this.element, prop, value)
    switch (prop) {
      case 'value':
        this.element.value = value
        break
      case 'label':
        this.setLabel(value)
        break
      case 'text':
        this.element.innerHTML = value
        break
      case 'icon':
        if (this.ui.icon) {
          this.ui.icon.innerHTML = value
        }
        break
      case 'enable':
        this.element.disabled = false
        break
      case 'disable':
        this.element.disabled = true
        break
      default:
        // console.log('prop', prop)
        this.element.innerHTML = prop
    }

    return this
  }

  setLabel (value) {
    if (this.ui.label) {
      this.ui.label.innerHTML = value
    }
  }

  setText (value) {
    if (this.ui.label) {
      this.setLabel(value)
    } else {
      this.element.innerHTML = value
    }
  }

  get (prop) {
    switch (prop) {
      case 'value':
        return this.element.value
      case 'label':
        return this.getText()
      case 'text':
        return this.getText()
      default:
        return this.element.value
    }
  }

  getText () {
    if (this.ui.label) {
      return this.ui.label.innerHTML
    } else {
      return this.element.innerHTML
    }
  }

  disable () {
    this.element.disabled = true
  }

  enable () {
    this.element.disabled = false
  }

  click (ev) {
    if (this.options.stopPropagation === true) {
      ev.stopPropagation()
    }

    this.emit('click', ev)
  }

  focus () {
    this.element.focus()
  }

  select (select) {
    if (select === null) {
      this.element.classList.remove('selected')
      this.selected = null
    } else {
      this.element.classList.add('selected')
      this.selected = true
    }
  }

  mousedown (ev) {
    this.element.classList.add('pushed')
  }

  mouseup (ev) {
    this.element.classList.remove('pushed')
  }
}

export default Button
