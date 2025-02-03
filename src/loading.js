import build from './mixin/build'

class Loading {
  static defaults = {
    class: 'loading',
    tag: 'div',
    delay: 1000,
    type: 'indeterminate',
    circular: `<svg class="progress" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
        <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
      </svg>`
  }

  constructor (options) {
    this.init(options)
    this.build()
    this.buildLoading()
  }

  init (options) {
    this.options = { ...Loading.defaults, ...options }
    Object.assign(this, build)
  }

  buildLoading (options) {
    if (this.options.type === 'circular') {
      this.element.innerHTML = this.options.circular
    } if (this.options.type === 'indeterminate') {
      this.bar = document.createElement(this.options.tag)
      this.bar.classList.add('bar')
      this.element.classList.add('type-indeterminate')
      this.element.appendChild(this.bar)
    }
  }

  set (progress) {
    this.bar.setAttribute('style', 'width: ' + progress)
  }

  show (delay) {
    delay = delay || this.options.delay

    clearTimeout(this.showTimeout)
    this.showTimeout = setTimeout(() => {
      this.element.classList.add('show')
    }, this.options.delay)

    this.visible = true

    return this
  }

  showNow () {
    this.element.classList.add('show')

    this.visible

    return this
  }

  hide () {
    clearTimeout(this.showTimeout)
    this.element.classList.remove('show')
    this.visible = false
    return this
  }
}

export default Loading
