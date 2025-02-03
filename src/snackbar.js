import Control from './class/control'
import display from './mixin/display'
import Element from './element'
import Text from './text'
import Button from './button'

class Snackbar extends Control {
  static defaults = {
    class: 'snackbar',
    mixins: [display],
    transition: 225,
    duration: 4000,
    stack: false,
    close: false,
    layout: [
      [Text, 'message', { tag: 'span', class: 'message' }],
      [Element, 'action', { tag: 'span', class: 'action' },
        [Button, 'callback', { class: 'callback', type: 'link' }],
        [Button, 'close', { class: 'close', type: 'action' }]
      ]
    ],
    events: [
      ['ui.callback.click', 'action'],
      ['ui.close.click', 'destroy']
    ]
  }

  constructor (options) {
    super(options)
    this.init(options)
    this.render()
    this.show()

    if (this.options.duration) {
      setTimeout(() => {
        this.destroy()
      }, this.options.duration)
    }
  }

  init (options) {
    this.buildSnackbarContainer(this.options.container)
  }

  buildSnackbarContainer (container = document.body) {
    const snackbarContainer = container.querySelector('.snackbars')

    if (!snackbarContainer) {
      this.options.container = document.createElement('div')
      this.options.container.classList.add('snackbars')
      container.appendChild(this.options.container)
    } else {
      if (this.options.stack === false) snackbarContainer.innerHTML = ''
      this.options.container = snackbarContainer
    }

    this.options.container.appendChild(this.element)
  }

  render () {
    if (!this.ui) {
      console.error('UI elements not initialized properly.')
      return
    }

    const { message, callback, close, action } = this.ui

    if (message) {
      message.set(this.options.message)
    } else {
      console.error('Message UI element not initialized.')
    }

    if (this.options.action && callback && callback.element) {
      callback.set(this.options.action)
      callback.element.classList.add('show')
      if (action) {
        action.classList.add('show')
      }
    }

    if (this.options.close && close && close.element) {
      close.element.classList.add('show')
      if (action) {
        action.classList.add('show')
      }
    }
  }

  action () {
    this.emit('action')
    this.destroy()
  }

  close () {
    this.destroy()
  }
}

export default Snackbar
