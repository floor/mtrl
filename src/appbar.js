import build from './mixin/build'

class AppBar {
  static defaults = {
    class: 'appbar'
  }

  constructor (options) {
    this.init(options)
    this.build()
  }

  init (options) {
    this.options = { ...AppBar.defaults, ...options }
    Object.assign(this, build)
  }
}

export default AppBar
