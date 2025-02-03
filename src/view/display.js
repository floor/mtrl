
export default {
  toggle () {
    this.visible ? this.hide() : this.show()

    this.emit('toggle')
    return this
  },

  show () {
    // console.log('show', this.visible)

    // if (this.options.transition) {
    //   this.element.style.display = 'initial'
    // }

    this.element.getBoundingClientRect()

    // clearTimeout(this.displayTimeout)
    // this.element.style.display = this._display

    this.element.classList.add('show')
    this.visible = true

    if (this.underlay) {
      this.underlay.classList.add('show')
    }

    this.emit('show')
    return this
  },

  hide () {
    // console.trace('hide')
    // if (this.element.style.display === 'none') return
    // clearTimeout(this.displayTimeout)
    // this._display = getComputedStyle(this.element).display

    if (!this.element) return

    this.element.classList.remove('show')
    this.visible = false

    if (this.underlay) {
      this.underlay.classList.remove('show')
    }

    // if (this.options.transition) {
    //   this.displayTimeout = setTimeout(() => {
    //     console.log('display: none', this._display)
    //     this.element.style.display = 'none'
    //   }, this.options.transition)
    // }

    this.emit('hide')
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
        this.removeChild()
      }, this.options.transition)
    } else {
      this.removeChild()
    }

    this.emit('destroy')
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
