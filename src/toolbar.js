'use strict'

import create from './mixin/create'
import insert from './mixin/insert'
import offset from './element/offset'

class Toolbar {
  static defaults = {
    prefix: 'material',
    class: 'toolbar',
    tag: 'div'
  }

  constructor (options) {
    this.init(options)
    this.build()
    this.attach()
  }

  init (options) {
    this.options = { ...Toolbar.defaults, ...options }
    Object.assign(this, insert)

    this.waterfall = this.options.waterfall
  }

  build () {
    this.element = create(this.options)

    // console.log(this.options.height, this.options.fixed)

    if (this.options.height) {
      this.element.style.height = this.options.height + 'px'
    }

    if (this.options.fixed) {
      // console.log('is-fixed')
      this.element.classList.add('is-fixed')
    }

    if (this.options.flexible) {
      this.element.classList.add('is-flexible')
    }

    // if (this.options.container) {
    //   this.insert(this.options.container)
    // }

    return this
  }

  attach () {
    this.element.addEventListener('DOMNodeInserted', (e) => {
      const textNode = e.target
      if (textNode !== this.element) return

      const size = this.size = offset(this.element, 'height')

      const view = this.view = this.element.parentNode

      // console.log('view', view)

      let padding = window.getComputedStyle(view)['padding-top']
      // console.log('paddingTop', padding)
      // if (!padding) padding = window.getComputedStyle(this.element.parentNode, 'padding')
      // console.log('padding', padding)

      padding = parseInt(padding, 10)
      // size = parseInt(size, 10)

      this.padding = padding

      // console.log(' toolbar inserted in', size, 'padding', padding)
      const ptop = this.ptop = size + padding

      // console.log('ptop', ptop)

      if (document.body == view) {
        // console.log('toolbar container body')
        this.element.classList.add('toolbar-body')
      }

      // view.setAttribute('style', 'padding-top: ' + ptop + 'px')

      this.scroll(view)
    })
  }

  /**
   * Setter
   * @param {string} prop
   * @param {string} value
   * @return {Object} The class instance
   */
  set (prop, value) {
    switch (prop) {
      case 'minimize':
        this.element.setAttribute('style', 'height: 64px')
        break
      case 'value':
        this.setValue(value)
        break
      case 'label':
        this.setLabel(value)
        break
      default:
        this.check(prop)
    }

    return this
  }

  scroll (view) {
    // console.log('initScroll')

    let isBody = false

    let element = view

    this.scrolling = view

    if (view === document.body) {
      isBody = true
      element = document
      this.scrolling = document.body
    }

    view.classList.add()

    element.addEventListener('scroll', (e) => {
      let scrollTop
      if (isBody) {
        scrollTop = (document.documentElement ||
       document.body.parentNode ||
       document.body).scrollTop
      } else {
        scrollTop = view.scrollTop
      }

      if (scrollTop > 0) {
        this.element.classList.add('is-scrolled')
      } else {
        this.element.classList.remove('is-scrolled')
      }

      // console.log('scroll', scrollTop)

      this.update(e, scrollTop)
    })
  }

  update (e, scrollTop) {
    if (this.options.fixed) { this.fixed(e, scrollTop) }
    if (this.options.flexible) { this.flexible(e, scrollTop) }
  }

  flexible (e, scrollTop) {
    const size = offset(this.element, 'height')
    // console.log('flexible', size, this.element.offsetHeight, scrollTop)
    // if (scrollTop < this.size) {
    //
    let height = '64'
    if (size < height) {
      this.element.style.height = height + 'px'
    } else {
      height = this.size - scrollTop
      if (height < 64) height = 64
      this.element.style.height = height + 'px'
    }

    // console.log('scroll', this.element.style.top, scrollTop)

    // if (scrollTop > 50) {
    //   this.element.style.trans = scrollTop + 'px'
    // } else {
    //   this.element.style.top = scrollTop + 'px'
    // }
    // }
    // this.element.style.top = scrollTop + 'px'
    // this.element.style.height = this.size - scrollTop
    // } else {
    //   console.log('size scroll', this.size, scrollTop)

    //   this.element.style.height = this.size - scrollTop + 'px'
    //   // this.element.style.top = scrollTop + 'px'
    // }
  }

  fixed (e, scrollTop) {
    if (scrollTop > 0) {
      this.element.style.transform = 'translateY(' + scrollTop + 'px)'
    } else {
      this.element.style.transform = 'translateY(' + scrollTop + 'px)'
    }
  }

  waterfall$ (e) {}
}

export default Toolbar
