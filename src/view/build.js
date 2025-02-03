import scrollbar from '../module/scrollbar'
import dataset from '../module/dataset'
import { create } from '../module/layout'

export default {
  build () {
    this.element = document.createElement('div')
    this.element.classList.add('view')

    if (this.options.class) {
      this.addClass(this.options.class)
    }

    if (this.options.data) {
      dataset(this.element, this.options.data)
    }

    this.container = this.options.container || document.body
    this.container.appendChild(this.element)

    if (this.options.layout) {
      this.layout = create(this.options.layout, this.element)
      this.ui = this.layout.component
    }
  },

  addClass (c) {
    const list = c.split(' ')

    for (let i = 0; i < list.length; i++) {
      this.element.classList.add(list[i])
    }
  }
}
