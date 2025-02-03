import insert from './mixin/insert'
import * as css from './module/css'

class Icon {
  static defaults = {
    prefix: 'material',
    class: 'icon',
    tag: 'div'
 }

  constructor (options) {
    this.init(options)
    this.build()

    return this
  }

  init (options) {
    this.options = Object.assign({}, Icon.defaults, options || {})
    Object.assign(this, insert)
  }

  build (options) {
    options = options || this.options

    var tag = options.tag || 'img'

    // var position = 'top'
    // if (this.options.type === 'text-icon') {
    //   position = 'bottom'
    // }

    this.element = this.element || {}

    this.element = document.createElement(tag)
    { add }.add(this.element, this.options.prefix + '-' + this.options.class)

    if (options.{ add }) { { add }.add(this.element, options.{ add }) }
    // { add }.add(this.element, this.options.class + '-adjust');

    if (this.options.container) {
      this.insert(this.options.container)
    }
  }

  set (value) {
    if (value) {
      if (this.element.innerText) {
        this.element.innerText = value
      } else {
        this.element.textContent = value
      }

      return this
    }

    return this
  }
}

export default Icon
