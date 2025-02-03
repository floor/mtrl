import * as css from './module/css'

class List {
  static defaults = {
    className: 'text',
    tag: 'span',
    seprator: ' | '
  }

  constructor (options) {
    this.init(options)
    this.build()
  }

  init (otions) {
    this.options = { ...List.defaults, ...options }
  }

  build () {
    this.element = document.createElement(this.options.tag)
    css.add(this.element, this.options.class)

    if (this.options.class !== 'text') {
      this.element.classList.add('text')
    }

    if (this.options.list) {
      this.set(this.options.list)
    }

    if (this.options.container) {
      this.options.container.appendChild(this.element)
    }

    return this
  }

  set (list) {
    let text = ''

    for (let i = 0; i < list.length; i++) {
      if (i < list.length - 1) {
        text = text + list[i] + this.options.seprator
      } else {
        text = text + list[i]
      }
    }

    // console.log('set', text)
    if (text === undefined) return

    const label = this.options.label || ''

    this.element.innerHTML = label + text

    if (this.options.spaceAfter) {
      this.element.innerHTML = this.element.innerHTML + ' '
    }
  }

  setText (text) {
    // console.log('setText', text)
    this.element.innerHTML = text
  }
}

export default List
