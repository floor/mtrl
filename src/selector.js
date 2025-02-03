import emitter from './module/emitter'
import events from './module/events'

class Selector {
  static defaults = {
    class: 'selector',
    tag: 'div',
    styles: ['style', 'color'],
    modules: ['border', 'label', 'resizer'],
    resizer: {
      keepRatio: true,
      minWidth: 10,
      minHeight: 10
    },
    events: [
      ['resizer.pointerdown', 'onPointerDown']
    ]
  }

  constructor (options) {
    // console.log('constructor')
    this.init(options)
    this.build()
    this.setup()
  }

  init (options) {
    this.options = Object.assign({}, Selector.defaults, options || {})
    Object.assign(this, emitter, events)
  }

  /**
   * Build Method
   * @return {Object} This class instance
   */
  build () {
    this.element = document.createElement(this.options.tag)

    this.element.classList.add('selector')

    if (this.options.class !== 'selector') {
      this.element.setAttribute('class', this.options.class)
    }

    if (this.options.modules.indexOf('border') > -1) {
      this.border = document.createElement('div')
      this.border.classList.add('border')
      this.element.appendChild(this.border)
    }

    if (this.options.modules.indexOf('label') > -1) {
      this.label = document.createElement('div')
      this.label.classList.add('label')
      this.element.appendChild(this.label)
    }

    if (this.options.modules.indexOf('resizer') > -1) {
      this.resizer = document.createElement('div')
      this.resizer.classList.add('resizer')
      this.element.appendChild(this.resizer)
    }

    if (this.options.container) {
      this.options.container.appendChild(this.element)
    }
  }

  setup () {
    events.attach(this.options.events, this)

    if (!this.options.src) return
    this.setTarget(this.options.element)
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
      case 'target':
        this.setTarget(value)
        break
      default:
        // console.log('prop', prop)
        this.setTarget(prop)
    }

    return this
  }

  setTarget (target) {
    this.target = target

    this.update(this.target)

    this.element.classList.remove('hide')

    // console.log('target', this.element, this.target)
  }

  update (target) {
    target = target || this.target
    if (!target) return
    const coords = target.getBoundingClientRect()
    const pcoords = this.element.parentNode.getBoundingClientRect()

    this.element.style.top = coords.top - pcoords.top + 'px'
    this.element.style.left = coords.left - pcoords.left + 'px'
    this.element.style.width = coords.width + 'px'
    this.element.style.height = coords.height + 'px'
  }

  /**
   * Setter
   * @param {string} prop
   * @param {string} value
   * @return {Object} The class instance
   */
  get (prop, value) {
    switch (prop) {
      case 'value':
        return this.element.value
      case 'label':
        return this.label.innerHTML
      default:
        return this.element.value
    }
  }

  onPointerDown (ev) {
    // console.log('pointerdown', ev.target)
    ev = ev || window.event

    let width = 0
    let height = 0

    const offsetX = this.element.getBoundingClientRect().x
    const offsetY = this.element.getBoundingClientRect().y
    const element = document.body

    const ratio = parseInt(this.element.style.width, 10) / parseInt(this.element.style.height, 10)

    this.border.setPointerCapture(ev.pointerId)

    element.onpointermove = (e) => {
      // console.log('pointermove')

      e.stopPropagation()

      e = e || window.event

      if (e.pageX) width = e.pageX - offsetX
      else if (e.clientX) width = e.clientX - offsetX

      if (e.pageY) height = e.pageY - offsetY
      else if (e.clientY) height = e.clientY - offsetY

      if (width < this.options.resizer.minWidth) width = this.options.resizer.minWidth

      if (this.options.resizer.keepRatio) {
        // console.log('keepRatio', width, ratio)
        height = width / ratio
      } else {
        if (height < this.options.resizer.minHeight) height = this.options.resizer.minHeight
      }

      this.element.style.width = width + 'px'
      this.element.style.height = height + 'px'

      this.emit('resize', width, height)
    }

    element.onpointerup = (e) => {
      // console.log('pointerup', e.target)

      element.onpointermove = null
      element.onpointerup = null
      this.element.releasePointerCapture(e.pointerId)

      // if (e.target !== this.element) return
    }
  }

  disable () {
    this.element.disabled = true
  }

  enable () {
    this.element.disabled = false
  }

  hide () {
    this.element.classList.add('hide')
  }

  show () {
    this.element.classList.remove('hide')
  }

  destroy () {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }

  click (ev) {
    this.emit('click', ev)
  }

  mousedown (ev) {
    this.element.classList.add('pushed')
  }

  mouseup (ev) {
    this.element.classList.remove('pushed')
  }
}

export default Selector
