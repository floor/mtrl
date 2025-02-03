import create from '../element/create'
import * as css from '../module/css'
import insert from '../element/insert'

const KEYCODE = {
  ENTER: 13,
  SPACE: 32
}

const control = {
  toggle () {
    if (this.disabled) return

    this.focus()

    if (this.checked) {
      this.check(false)
    } else {
      this.check(true)
    }

    return this
  },

  check (checked) {
    if (checked === true) {
      css.add(this.element, 'is-checked')
      this.element.input.checked = true
      this.checked = true
      this.emit('change', this.checked)
    } else {
      css.remove(this.element, 'is-checked')
      this.element.input.checked = false
      this.checked = false
      this.emit('change', this.checked)
    }
    return this
  },

  label (label, container) {
    if (!label) return

    this.element = this.element || {}

    if (!this.element.label) {
      this.element.label = create('label', this.options.class + '-label')
    }

    this.element.label.textContent = label

    container = container || this.element

    insert(this.element.label, container)
  },

  icon (icon, container, position) {
    if (!icon) return

    container = container || this.element

    position = position || 'top'
    if (this.options.type === 'text-icon') {
      position = 'bottom'
    }

    this.element = this.element || {}

    this.element.icon = create('i', this.options.class + '-icon')
    insert(this.element.icon, container, position)

    this.element.icon.innerHTML = icon
  },

  error (error) {
    error = error || this.options.error
    if (this.options.error === null) return

    const text = this.options.error || this.options.text

    if (!this.element.error) { this.element.error = create('error', this.options.class + '-error') }

    if (text) {
      this.element.error.textContent = text
    }

    insert(this.element.error, this.element, 'bottom')
  },

  disable () {
    this.disabled = true

    this.element.input.setAttribute('disabled', 'disabled')
    css.add(this.element, 'is-disabled')
    return this
  },

  enable () {
    this.disabled = false

    this.element.input.removeAttribute('disabled')
    css.remove(this.element, 'is-disabled')
    return this
  },

  keydown (e) {
    if (e.altKey) return

    switch (e.keyCode) {
      case KEYCODE.ENTER:
      case KEYCODE.SPACE:
        e.preventDefault()
        this.toggle(e)
        break
      default:
        break
    }
  },

  get (prop) {
    switch (prop) {
      case 'name':
        this.getName()
        break
      // case 'value':
      //   this.setValue(prop)
      //   break
      // case 'label':
      //   this.setLabel(prop)
      //   break
      default:
        this.setValue(prop)
    }

    return this
  },

  getName () {
    return this.element.dataset.name
  },

  focus () {
    if (this.disabled === true) return this

    css.add(this.element, 'is-focused')
    if (this.element.input !== document.activeElement) { this.element.input.focus() }
    return this
  },

  blur () {
    css.remove(this.element, 'is-focused')
    return this
  }
}

export default control
