// dialog related modules
import emitter from './module/emitter'
import events from './module/events'
import display from './mixin/display'
import * as css from './module/css'

import Element from './element'
import Text from './text'
import Button from './button'
import { create } from './module/layout'

class Dialog {
  static defaults = {
    class: 'dialog',
    close: true,
    layout: [
      [Element, 'head', { class: 'head' },
        [Text, 'title', { class: 'title' }],
        [Button, 'close', { class: 'close' }]
      ],
      [Element, 'body', { class: 'body' },
        [Text, 'content', { class: 'content' }]
      ],
      [Element, 'foot', { class: 'foot' },
        [Element, { class: 'divider' }],
        [Button, 'ok', { class: 'ok', text: 'Ok', color: 'primary' }]
      ]
    ],
    events: [
      ['element.click', 'onClickRoot'],
      ['surface.click', 'onClick'],
      ['element.keydown', 'onKeyDown'],
      ['ui.ok.click', 'ok'],
      ['ui.cancel.click', 'cancel'],
      ['ui.close.click', 'close']
    ]
  }

  constructor (options) {
    this.init(options)
    this.build()
    this.render()
    this.setup()

    return this
  }

  init (options) {
    this.options = { ...Dialog.defaults, ...options }
    Object.assign(this, emitter, display)
  }

  build () {
    this.element = document.createElement('div')
    this.element.classList.add('dialog')

    this.element = this.element

    if (this.options.class !== 'dialog') {
      // console.log('css add', this.options.class)
      css.add(this.element, this.options.class)
    }

    if (this.options.position) {
      this.element.classList.add('position-' + this.options.position)
    }

    this.surface = document.createElement('div')
    this.surface.classList.add('surface')
    this.element.appendChild(this.surface)

    this.layout = create(this.options.layout, this.surface)
    this.ui = this.layout.component

    if (this.options.container) {
      this.options.container.appendChild(this.element)
    }

    if (this.options.display === 'show') {
      this.show()
    }
  }

  render () {
    if (this.options.title && this.ui.title) {
      this.ui.title.set(this.options.title)
    }

    if (this.options.content && this.ui.content) {
      this.ui.content.set(this.options.content)
    }

    if (this.options.cancel && this.ui.cancel) {
      this.ui.cancel.set('text', this.options.cancel)
    }

    if (this.options.ok && this.ui.ok) {
      this.ui.ok.set('text', this.options.ok)
    }

    if (this.options.target) {
      this.setPosition()
    }
  }

  setup () {
    events.attach(this.options.events, this)

    this.surface.setAttribute('tabindex', '-1')

    if (this.options.focus && this.ui[this.options.focus]) {
      this.ui[this.options.focus].focus()
    }
  }

  setPosition () {
    const coord = this.options.target.getBoundingClientRect()
    const surface_coord = this.surface.getBoundingClientRect()

    if (this.options.position === 'right') {
      this.surface.style.top = coord.top + 'px'
      this.surface.style.left = coord.left + coord.width // surface_coord.width + 'px'
    } else {
      this.surface.style.top = coord.top + 'px'
      this.surface.style.left = coord.left - surface_coord.width + 'px'
    }
  }

  ok () {
    this.emit('ok')
    if (this.options.close) {
      this.destroy()
    }
  }

  cancel () {
    this.emit('cancel')

    if (this.options.close) {
      this.destroy()
    }
  }

  close () {
    // this.hide()

    if (this.options.close) {
      this.destroy()
    }
  }

  onClick (e) {
    e.stopPropagation()
  }

  onKeyDown (event) {
    if (event.key === 'Enter') {
      // If a specific button has focus, let its own click handler work
      const focusedElement = document.activeElement
      if (focusedElement && focusedElement.tagName === 'BUTTON') {
        event.preventDefault()
        this.emit('ok')
        if (this.options.close) {
          this.destroy()
        }
        return
      }

      // Otherwise, trigger the primary action (usually 'ok')
      if (this.ui.ok) {
        event.preventDefault()
        this.emit('ok')
        if (this.options.close) {
          this.destroy()
        }
      }
    } else if (event.key === 'Escape' && !this.options.modal) {
      event.preventDefault()
      this.destroy()
    }
  }

  onClickRoot (e) {
    // console.log('onClickRoot')
    e.stopPropagation()
    if (!this.options.modal) {
      this.destroy()
    }
  }

  emphase () {
    this.element.classList.add('emphase')
    let it
    it = setTimeout(() => {
      clearTimeout(it)
      this.element.classList.remove('emphase')
    }, 100)
  }

  set (prop, value) {
    if (this.ui[prop]) {
      this.ui[prop].set(value)
    }
  }
}

export default Dialog
