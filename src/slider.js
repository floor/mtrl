import init from './mixin/init'
import build from './element/build'
import control from './mixin/control'

import events from './mixin/events'
import insert from './element/insert'
import offset from './element/offset'
import classify from './module/classify'
// import control from './control';
import * as css from './module/css'
import emitter from './module/emitter'

import icon from './skin/material/icon/pin.svg'

class Slider {
  static defaults = {
    class: 'slider',
    type: 'control',
    label: null,
    checked: false,
    error: false,
    value: false,
    range: [0, 100],
    step: 5,
    modules: [control, emitter],
    mixins: [],
    build: ['$root.material-slider', {},
      ['label$label.slider-label', {}],
      ['input$input'],
      ['$control.slider-control', {},
        ['$track.slider-track', {},
          ['canvas$canvas.slider-canvas', {}],
          ['$trackvalue.slider-track-value', {}],
          ['$knob.slider-knob', {}],
          ['$marker.slider-marker', {},
            ['$value.slider-value', {}]
          ]
        ]
      ]
    ],
    events: [
      ['element.input.focus', 'focus'],
      ['element.input.blur', 'blur']
    ]
  }

  constructor (options) {
    this.init(this.options)
    this.build(this.options)
    this.setup()
  }

  init (options) {
    this.options = Object.assign({}, Slider.defaults, options || {})
    init(this)
  }

  setup () {
    events.attach(this.options.events, this)
  }

  build () {
    this.element = build(this.options.build)
    this.element = this.element.root

    classify(this.element, this.options)

    if (this.options.container) {
      insert(this.element, this.options.container)
    }

    const value = this.element.marker.innerHTML
    this.element.marker.innerHTML = icon + value

    if (this.options.type) {
      css.add(this.element, 'type-' + this.options.type)
    }

    // init input
    if (this.options.disabled) {
      this.disable(true)
    }

    // if (this.options.name) {
    //   this.element.dataset.name = name
    //   this.element.input.name = name
    // }

    // init text
    const text = this.options.label || this.options.text
    this.element.label.textContent = text

    this.options.label = this.options.label || this.options.text

    this.initTrack()

    const delay = 50

    setTimeout(() => {
      this.initCanvas()
    }, delay)
  }

  initCanvas () {
    window.addEventListener('resize', () => {
      console.log('resize')
      this.drawCanvas()
    }, false)
    this.drawCanvas()
  }

  drawCanvas () {
    const width = offset(this.element.track, 'width')
    const height = offset(this.element.track, 'height')

    this.element.canvas.width = width
    this.element.canvas.height = height

    const context = this.element.canvas.getContext('2d')
    context.lineWidth = 2
    context.beginPath()

    context.moveTo(0, (height / 2) + 1)
    context.lineTo(width, (height / 2) + 1)
    context.strokeStyle = 'rgba(34, 31, 31, .26)'
    context.stroke()
  }

  /**
   * [buildControl description]
   * @return {?} [description]
   */
  initTrack () {
    this.element.track.addEventListener('mousedown', (ev) => {
      if (this.disabled === true) return
      this.initTrackSize()
      const position = ev.layerX
      this.update(position)
    })

    this.element.knob.addEventListener('click', (ev) => {
      ev.stopPropagation()
    })

    this.initDragging()

    const delay = 100

    setTimeout(() => {
      this.setValue(this.options.value)
    }, delay)
  }

  initTrackSize () {
    this._tracksize = offset(this.element.track, 'width')
    this._knobsize = offset(this.element.knob, 'width')
    this._markersize = 32 /* offset(this.element.marker, 'width') */
    this._trackleft = offset(this.element.track, 'left')
    return this
  }

  /**
   * [initDragging description]
   * @return {?} [description]
   */
  initDragging () {
    this.element.knob.onmousedown = (e) => {
      if (this.disabled === true) return

      e.stopPropagation()
      e = e || window.event

      css.add(this.element.control, 'dragging')

      let start = 0
      let position = 0

      if (e.pageX) start = e.pageX
      else if (e.clientX) start = e.clientX

      start = this._trackleft
      document.body.onmousemove = (e) => {
        if (this.disabled === true) return
        console.log('mousedown', this.disabled)

        e = e || window.event
        let end = 0
        if (e.pageX) end = e.pageX
        else if (e.clientX) end = e.clientX

        position = end - start
        this.update(position)
      }
      document.body.onmouseup = (e) => {
        document.body.onmousemove = document.body.onmouseup = null

        e = e || window.event
        let end = 0
        if (e.pageX) end = e.pageX
        else if (e.clientX) end = e.clientX

        position = end - start
        this.update(position)
        css.remove(this.element.control, 'dragging')
      }
    }
  }

  update (position) {
    const size = this._tracksize
    const range = this.options.range[1] - this.options.range[0]

    if (position > size) {
      position = size
    }

    if (position < 0) {
      position = 0
    }

    const ratio = (size / position)
    const value = Math.round((range / ratio)) + this.options.range[0]

    if (position === 0) {
      css.remove(this.element.knob, 'notnull')
    }

    this.element.knob.style.left = position - this._knobsize / 2 + 'px'
    this.element.trackvalue.style.width = (position) + 'px'
    this.element.marker.style.left = position - this._markersize / 2 + 'px'

    this.element.value.textContent = value

    this.element.input.value = value
    if (value > this.options.range[0]) {
      css.add(this.element.knob, 'notnull')
    } else {
      css.remove(this.element.knob, 'notnull')
    }
  }

  updateValue (value) {
    this.initTrackSize()

    let size = offset(this.element.track, 'width')
    size = parseInt(size)

    const range = this.options.range[1] - this.options.range[0]
    const ratio = value * 100 / range
    const position = Math.round(size * ratio / 100)

    this.update(position)

    return this
  }

  /**
   * [insert description]
   * @param  {?} container [description]
   * @param  {?} context   [description]
   * @return {?}           [description]
   */
  insert (container, context) {
    insert(this.element, container, context)
  }

  /**
   * Setter
   * @param {string} prop
   * @param {string} value
   */
  set (prop, value) {
    switch (prop) {
      case 'value':
        this.setValue(value)
        break
      case 'label':
        this.setLabel(value)
        break
      default:
        this.setValue(prop)
    }

    return this
  }

  /**
   * Getter
   * @param {string} prop
   * @param {string} value
   */
  get (prop) {
    let value

    switch (prop) {
      case 'value':
        value = this.getValue()
        break
      case 'name':
        value = this.name
        break
      default:
        return this.getValue()
    }

    return value
  }

  /**
   * [getValue description]
   * @return {Object} The class instance
   */
  getValue () {
    return this.element.input.value
  }

  /**
   * [setValue description]
   * @param {string} value [description]
   */
  setValue (value) {
    value = value || this.options.range[0]
    this.element.input.value = value
    this.updateValue(value)
  }

  /**
   * [setLabel description]
   * @param {?} text [description]
   */
  setLabel (text) {
    text = text || this.options.label || this.options.text

    if (text !== null && this.label) {
      this.label.textContent = text
    }
  }
}

export default Slider
