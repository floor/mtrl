
export default {
  toggle () {
    this.visible ? this.hide() : this.show()

    this.emit('toggle')
    return this
  },

  show () {
    // console.log('show', this.visible)

    this.element.getBoundingClientRect()

    this.element.classList.add('show')
    this.visible = true

    if (this.underlay) {
      this.underlay.classList.add('show')
    }

    this.virtual.setOffset('onShow')

    this.emit('show')
    return this
  },

  hide () {
    // console.log('hide', this.element.style.display)

    if (!this.element) return

    this.element.classList.remove('show')
    this.visible = false

    if (this.underlay) {
      this.underlay.classList.remove('show')
    }

    this.emit('hide')
    return this
  },

  destroy () {
    // console.log('destroy', this.options.transition)
    if (this.options.transition && this.element) {
      this.element.classList.remove('show')

      if (this.underlay) {
        this.underlay.classList.remove('show')
      }

      setTimeout(() => {
        this.removeChild()
      }, this.options.transition)
    } else {
      this.removeChild()
    }

    this.emit('destroy')

    return this
  },

  removeChild () {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
      this.element = null
    }

    if (this.underlay && this.underlay.parentNode) {
      this.underlay.parentNode.removeChild(this.underlay)
    }

    this.emit('remove')
    return this
  }
}
