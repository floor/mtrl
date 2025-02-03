import {
  Element,
  Control,
  display,
  dataset
} from '../index'

class ColorPicker extends Control {
  static defaults = {
    class: 'colorpicker',
    tag: 'div',
    mixins: [display],
    layout: [
      [Element, 'input', { type: 'text' }],
      [Element, 'preview', { class: 'preview' }],
      [Element, 'panel', { class: 'panel' }, [
        [Element, 'gradient', { class: 'gradient' }],
        [Element, 'hue', { class: 'hue' }],
        [Element, 'hue-slider', { tag: 'input', type: 'range', min: '0', max: '360', step: '1' }],
        [Element, 'hue-marker', { class: 'marker' }],
        [Element, 'alpha', { class: 'alpha' }],
        [Element, 'alpha-slider', { tag: 'input', type: 'range', min: '0', max: '100', step: '1' }],
        [Element, 'alpha-marker', { class: 'marker' }],
        [Element, 'swatches', { class: 'swatches' }]
      ]]
    ],
    format: 'hex',
    alpha: true,
    defaultColor: '#000000',
    swatches: [],
    events: [
      ['ui.input.change', 'onChange'],
      ['ui.preview.click', 'toggle'],
      ['ui.gradient.mousedown', 'startPickingColor'],
      ['ui.gradient.touchstart', 'startPickingColor'],
      ['ui.hue-slider.input', 'setHue'],
      ['ui.alpha-slider.input', 'setAlpha']
    ]
  }

  constructor (options) {
    super(options)
    this.setup()
  }

  setup () {
    // Initialize internal state
    this.currentColor = {
      r: 0,
      g: 0,
      b: 0,
      h: 0,
      s: 0,
      v: 0,
      a: 1
    }

    this.ctx = document.createElement('canvas').getContext('2d')
    this.dragging = false
    this.visible = false

    // Set up DOM elements
    this.setAttributes()
    this.setupPanelElements()
    this.setupSwatches()

    // Initialize slider values
    this.ui['hue-slider'].value = 0
    this.ui['alpha-slider'].value = 100

    // Set initial color
    const defaultColor = this.options.defaultColor || '#000000'
    this.setColorFromStr(defaultColor)

    // Add document-level event listeners for drag handling
    document.addEventListener('mousemove', this.onDrag.bind(this))
    document.addEventListener('mouseup', this.stopPickingColor.bind(this))
    document.addEventListener('touchmove', this.onDrag.bind(this))
    document.addEventListener('touchend', this.stopPickingColor.bind(this))
  }

  setAttributes () {
    const { name, value, disabled } = this.options

    if (name) this.ui.input.setAttribute('name', name)
    if (value) this.setColorFromStr(value)
    if (disabled) this.disable()
  }

  setupPanelElements () {
    // Set up hue slider
    this.ui['hue-slider'].setAttribute('aria-label', 'Hue')
    this.ui['alpha-slider'].setAttribute('aria-label', 'Opacity')

    // Set up color marker
    this.marker = document.createElement('div')
    this.marker.className = 'marker'
    this.ui.gradient.appendChild(this.marker)
  }

  setupSwatches () {
    if (!Array.isArray(this.options.swatches)) return

    this.options.swatches.forEach(color => {
      const swatch = document.createElement('button')
      swatch.className = 'swatch'
      swatch.style.backgroundColor = color
      swatch.addEventListener('click', () => this.setColorFromStr(color))
      this.ui.swatches.appendChild(swatch)
    })
  }

  startPickingColor (event) {
    this.dragging = true
    this.onDrag(event)
  }

  stopPickingColor () {
    this.dragging = false
  }

  onDrag (event) {
    if (!this.dragging) return

    event.preventDefault()

    const rect = this.ui.gradient.getBoundingClientRect()
    const x = (event.touches ? event.touches[0].clientX : event.clientX) - rect.left
    const y = (event.touches ? event.touches[0].clientY : event.clientY) - rect.top

    this.setColorAtPosition(
      Math.max(0, Math.min(x, rect.width)),
      Math.max(0, Math.min(y, rect.height))
    )
  }

  setColorAtPosition (x, y) {
    const width = this.ui.gradient.offsetWidth
    const height = this.ui.gradient.offsetHeight

    const hsva = {
      h: this.ui['hue-slider'].value * 1,
      s: (x / width) * 100,
      v: 100 - ((y / height) * 100),
      a: this.ui['alpha-slider'].value / 100
    }

    this.marker.style.left = `${x}px`
    this.marker.style.top = `${y}px`

    const rgba = this.HSVAtoRGBA(hsva)
    this.updateColor(rgba, hsva)
    this.emit('change', this.getValue())
  }

  setHue () {
    if (!this.ui['hue-slider']) return

    const hue = parseFloat(this.ui['hue-slider'].value || 0)

    if (this.ui['hue-marker']) {
      this.ui['hue-marker'].style.left = `${(hue / 360) * 100}%`
    }

    if (this.ui.gradient) {
      this.ui.gradient.style.color = `hsl(${hue}, 100%, 50%)`
    }

    // Update color based on current marker position
    if (this.marker && this.ui.gradient) {
      const rect = this.ui.gradient.getBoundingClientRect()
      const x = parseFloat(this.marker.style.left || '0')
      const y = parseFloat(this.marker.style.top || '0')
      this.setColorAtPosition(x, y)
    }
  }

  setAlpha () {
    if (!this.ui['alpha-slider']) return

    const alpha = parseFloat(this.ui['alpha-slider'].value || 100) / 100

    if (this.ui['alpha-marker']) {
      this.ui['alpha-marker'].style.left = `${alpha * 100}%`
    }

    this.currentColor.a = alpha
    this.updateColor()
    this.emit('change', this.getValue())
  }

  setColorFromStr (str, silent = false) {
    const rgba = this.strToRGBA(str)
    const hsva = this.RGBAtoHSVA(rgba)

    this.updateColor(rgba, hsva)

    // Update UI elements
    this.ui['hue-slider'].value = hsva.h
    this.ui['alpha-slider'].value = hsva.a * 100
    this.setHue()

    const rect = this.ui.gradient.getBoundingClientRect()
    const x = (hsva.s / 100) * rect.width
    const y = (1 - hsva.v / 100) * rect.height
    this.marker.style.left = `${x}px`
    this.marker.style.top = `${y}px`
  }

  updateColor (rgba = {}, hsva = {}) {
    Object.assign(this.currentColor, rgba, hsva)

    const hex = this.RGBAToHex(this.currentColor)
    const color = this.getColorString()

    this.ui.preview.style.backgroundColor = color
    this.ui.input.value = color
  }

  getValue () {
    return this.ui.input.value
  }

  setValue (value, silent = false) {
    if (this.getValue() !== value) {
      this.setColorFromStr(value, silent)
    }
  }

  // Color conversion utilities
  HSVAtoRGBA (hsva) {
    const saturation = hsva.s / 100
    const value = hsva.v / 100
    let chroma = saturation * value
    const hueBy60 = hsva.h / 60
    let x = chroma * (1 - Math.abs(hueBy60 % 2 - 1))
    const m = value - chroma

    chroma = (chroma + m)
    x = (x + m)

    const index = Math.floor(hueBy60) % 6
    const red = [chroma, x, m, m, x, chroma][index]
    const green = [x, chroma, chroma, x, m, m][index]
    const blue = [m, m, x, chroma, chroma, x][index]

    return {
      r: Math.round(red * 255),
      g: Math.round(green * 255),
      b: Math.round(blue * 255),
      a: hsva.a
    }
  }

  RGBAtoHSVA (rgba) {
    const red = rgba.r / 255
    const green = rgba.g / 255
    const blue = rgba.b / 255
    const xmax = Math.max(red, green, blue)
    const xmin = Math.min(red, green, blue)
    const chroma = xmax - xmin
    const value = xmax
    let hue = 0
    let saturation = 0

    if (chroma) {
      if (xmax === red) hue = ((green - blue) / chroma)
      if (xmax === green) hue = 2 + (blue - red) / chroma
      if (xmax === blue) hue = 4 + (red - green) / chroma
      if (xmax) saturation = chroma / xmax
    }

    hue = Math.floor(hue * 60)

    return {
      h: hue < 0 ? hue + 360 : hue,
      s: Math.round(saturation * 100),
      v: Math.round(value * 100),
      a: rgba.a
    }
  }

  strToRGBA (str) {
    const regex = /^((rgba)|rgb)[\D]+([\d.]+)[\D]+([\d.]+)[\D]+([\d.]+)[\D]*?([\d.]+|$)/i
    let match, rgba

    // Default to black for invalid color strings
    this.ctx.fillStyle = '#000'

    // Use canvas to convert the string to a valid color string
    this.ctx.fillStyle = str
    match = regex.exec(this.ctx.fillStyle)

    if (match) {
      rgba = {
        r: match[3] * 1,
        g: match[4] * 1,
        b: match[5] * 1,
        a: match[6] * 1
      }
    } else {
      match = this.ctx.fillStyle.replace('#', '').match(/.{2}/g).map(h => parseInt(h, 16))
      rgba = {
        r: match[0],
        g: match[1],
        b: match[2],
        a: 1
      }
    }

    return rgba
  }

  RGBAToHex (rgba) {
    let R = rgba.r.toString(16)
    let G = rgba.g.toString(16)
    let B = rgba.b.toString(16)
    let A = ''

    if (rgba.r < 16) R = '0' + R
    if (rgba.g < 16) G = '0' + G
    if (rgba.b < 16) B = '0' + B

    if (this.options.alpha && rgba.a < 1) {
      const alpha = rgba.a * 255 | 0
      A = alpha.toString(16)
      if (alpha < 16) A = '0' + A
    }

    return '#' + R + G + B + A
  }

  getColorString () {
    switch (this.options.format) {
      case 'hex':
        return this.RGBAToHex(this.currentColor)
      case 'rgb':
        const { r, g, b, a } = this.currentColor
        return a < 1
          ? `rgba(${r}, ${g}, ${b}, ${a})`
          : `rgb(${r}, ${g}, ${b})`
      default:
        return this.RGBAToHex(this.currentColor)
    }
  }

  destroy () {
    document.removeEventListener('mousemove', this.onDrag)
    document.removeEventListener('mouseup', this.stopPickingColor)
    document.removeEventListener('touchmove', this.onDrag)
    document.removeEventListener('touchend', this.stopPickingColor)
    super.destroy()
  }
}

export default ColorPicker
