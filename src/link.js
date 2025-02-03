import build from './mixin/build'

class Link {
  static defaults = {
    class: 'link',
    tag: 'a'
  }

  constructor (options) {
    this.init(options)
    this.build()
    this.setup()
  }

  init (options) {
    this.options = { ...Link.defaults, ...options }
    Object.assign(this, build)
  }

  setup () {
    if (this.options.link) {
      this.set(this.options.link)
    }

    if (this.options.target !== 'blank') {
      this.element.target = this.options.target
    }

    if (this.options.text) {
      this.element.innerHTML = this.options.text
    }
  }

  set (link) {
    // console.log('set', text)
    if (link === undefined) return

    if (this.options.target === 'blank') {
      this.element.href = '#'
      this.element.addEventListener('click', () => {
        window.open(link)
        return false
      })
    } else {
      this.element.href = link
    }
  }
}

export default Link
