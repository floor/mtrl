import build from '../module/build'
import dom from '../module/dom'

class Component {
  static defaults = {
    class: 'component',
    mixins: []
  }

  constructor (options) {
    this.options = { ...this.constructor.defaults, ...options }

    // Apply any mixins first
    const mixins = this.options.mixins || []
    mixins.forEach(mixin => Object.assign(this, mixin))

    // Build the component
    build(this)
  }

  async destroy () {
    console.log('destroy')
    if (this.options.transition && this.element) {
      this.element.classList.remove('show')
      if (this.underlay) {
        this.underlay.classList.remove('show')
      }
      await new Promise(resolve =>
        setTimeout(() => {
          dom.destroy(this.element)
          if (this.underlay) dom.destroy(this.underlay)
          resolve()
        }, this.options.transition)
      )
    } else {
      dom.destroy(this.element)
      if (this.underlay) dom.destroy(this.underlay)
    }
  }
}

export default Component
