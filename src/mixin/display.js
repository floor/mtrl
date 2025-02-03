import dom from '../module/dom'

export default {
  toggle () {
    this.visible ? this.hide() : this.show()

    this.emit?.('toggle')
    return this
  },

  show () {
    // console.log('show', this.visible)
    if (!this.element) return

    if (this.options.display !== false) {
      this.element.style.display = ''
    }

    this.element.getBoundingClientRect()

    this.element.classList.add('show')
    this.visible = true

    if (this.underlay) {
      this.underlay.classList.add('show')
    }

    this.emit?.('show')
    return this
  },

  hide () {
    // console.log('hide', this.element)
    if (!this.element) return

    this.element.classList.remove('show')
    this.visible = false

    if (this.underlay) {
      this.underlay.classList.remove('show')
    }

    if (this.options.transition && this.element) {
      setTimeout(() => {
        if (this.options.display !== false) {
          this.element.style.display = 'none'
        }
      }, this.options.transition)
    }

    this.emit?.('hide')
    return this
  },

  destroy () {
    // console.log('destroy', this.options.transition, this.element)
    if (this.options.transition && this.element) {
      this.element.classList.remove('show')

      if (this.underlay) {
        this.underlay.classList.remove('show')
      }

      setTimeout(() => {
        dom.destroy(this.element)
        if (this.underlay) dom.destroy(this.underlay)
      }, this.options.transition)
    } else {
      dom.destroy(this.element)
      if (this.underlay) dom.destroy(this.underlay)
    }

    this.emit?.('destroy')
  }
}
