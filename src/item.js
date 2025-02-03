import build from './mixin/build'

// Depracated

class Item {
  static defaults = {
    prefix: 'material',
    class: 'item',
    type: 'default',
    tag: 'span',
    types: {
      default: 'span',
      display4: 'h1',
      display3: 'h1',
      display2: 'h1',
      display1: 'h1',
      headline: 'h1',
      title: 'h2',
      subheading2: 'h3',
      subheading1: 'h4',
      body: 'p',
      body2: 'aside',
      caption: 'span'
    }
  }

  constructor (options) {
    this.init(options)
    this.build()
    this.setup()
  }

  setup () {
    if (this.options.text) this.set(this.options.text)
    if (this.options.name) this.element.setAttribute('name', this.options.name)
  }

  init (options) {
    this.options = Object.assign({}, Item.defaults, options || {})
    Object.assign(this, build)

    this.options.tag = this.options.tag || this.options.types[this.options.type]
  }

  set (value) {
    if (value) {
      if (this.element.innerText) {
        this.element.innerText = value
      } else {
        this.element.textContent = value
      }
    }

    return this
  }
}

export default Item
