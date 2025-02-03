import Control from './control'
import display from '../mixin/display'

class View extends Control {
  static defaults = {
    base: 'view',
    ...Control.defaults,
    display: {}
  }

  constructor (options) {
    // Let Control handle all the event setup
    super(options)

    // Add any View-specific initialization here
    // For example, if View needs display functionality:
    Object.assign(this, display)
  }

  // If View needs any special cleanup:
  destroy () {
    // Do View-specific cleanup first

    // Then let Control handle event cleanup
    super.destroy()
  }
}

export default View
