import * as css from '../module/css'
import dataset from '../module/dataset'

import { create } from '../module/layout'

export default {
  build () {
    this.element = document.createElement(this.options.tag || 'div')

    const defaults = this.constructor.defaults || {}

    if (defaults.base) css.add(this.element, defaults.base)
    if (defaults.class) css.add(this.element, defaults.class)

    if (this.options.class !== defaults.class) {
      css.add(this.element, this.options.class)
    }

    if (this.options.data) {
      dataset(this.element, this.options.data)
    }

    if (this.options.base === 'view' || this.options.base === 'app') {
      this.container = this.options.container || document.body
    } else {
      this.container = this.options.container
    }

    if (this.container) this.appendTo(this.container)

    if (this.options.layout) {
      this.layout = create(this.options.layout, this.element)
      this.ui = this.layout.component
    }

    this.ui = this.ui || {}

    if (this.options.icon) this.buildIcon()
    if (this.options.label) this.buildLabel()

    if (this.options.show === true && this.show) this.show()
  },

  buildLabel () {
    if (!this.options.label) return

    this.ui.label = document.createElement('label')
    this.ui.label.classList.add('label')
    this.ui.label.innerHTML = this.options.label

    this.element.appendChild(this.ui.label)
  },

  buildIcon () {
    if (!this.options.icon) return

    this.ui.icon = document.createElement('i')
    this.ui.icon.classList.add('icon')
    this.ui.icon.innerHTML = this.options.icon

    this.element.appendChild(this.ui.icon)
  },

  appendTo (container) {
    // console.log('appendTo', container)
    container.appendChild(this.element)
  }
}
