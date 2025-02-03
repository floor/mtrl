import EventEmitter from './mixin/emitter'
import observer from './element/observer'
import events from './module/events'
import build from './mixin/build'
import display from './view/display'

class TabView extends EventEmitter {
  static defaults = {
    base: 'view',
    class: 'tabview',
    mode: 'style',
    events: [
      ['ui.tabs.click', 'onTabClick']
    ]
  }

  constructor (options) {
    super()

    this.init(options)
    this.build()

    let ready = false

    observer.insert(this.element, () => {
      if (!ready) {
        ready = true
        this.setup()
        events.attach(this.options.events, this)

        this.emit('ready')
      }
    })

    return this
  }

  init (options) {
    this.options = { ...TabView.defaults, ...options }
    Object.assign(this, build, display)

    this.ui = {}
  }

  setup () {
    // console.log('setup')
    this.view = {}
    this.views = []

    this.ui.tabs = this.element.querySelector('[class="tabs"]')
    this.ui.view = this.element.querySelector('[class="views"]')
    this.ui.indicator = this.element.querySelector('[class="indicator"]')

    this.ui.buttons = this.ui.tabs.childNodes
    this.ui.views = this.ui.view.childNodes

    // console.log('views', this.ui.views)

    for (let i = 0; i < this.ui.views.length; i++) {
      if (this.ui.views[i].dataset) {
        this.views.push(this.ui.views[i].dataset.view)
        this.view[this.ui.views[i].dataset.view] = this.ui.views[i]
      }
    }

    this.hideView()

    this.click(this.ui.buttons[0])
  }

  onTabClick (e) {
    e.stopPropagation()
    if (e.target === e.currentTarget) return

    if (e.target.matches('BUTTON')) {
      this.click(e.target)
    }
  }

  select (view) {
    // console.log('select', view, this.ui.tabs)
    if (this.ui && this.ui.tabs) {
      const button = this.ui.tabs.querySelector('[data-view="' + view + '"]')
      // console.log('tab', button)
      if (button) {
        this.click(button)
      }
    } else {
      this.emit('notready')
    }
  }

  disable (view) {
    // console.log('select', view)
    if (this.ui && this.ui.tabs) {
      const button = this.ui.tabs.querySelector('[data-view="' + view + '"]')
      // console.log('tab', button)
      if (button) {
        button.disabled = 'disabled'
      }
    } else {
      this.emit('notready')
    }
  }

  enable (view) {
    // console.log('select', view)

    if (this.ui && this.ui.tabs) {
      const button = this.ui.tabs.querySelector('[data-view="' + view + '"]')
      // console.log('tab', button)
      if (button) {
        button.disabled = false
      }
    } else {
      this.emit('notready')
    }
  }

  hideView () {
    // console.log('hideView')
    for (let i = 0; i < this.ui.views.length; i++) {
      // console.log('hide', this.ui.views[i])
      this.ui.views[i].classList.add('hide')
    }
  }

  click (button) {
    // console.log('click', button.dataset.view, true)
    const view = this.ui.view.querySelector('[data-view="' + button.dataset.view + '"]')
    this.hideView()

    if (this.button) {
      this.button.classList.remove('selected')
    }

    this.button = button

    button.classList.add('selected')

    this.indicator(button)

    if (view) {
      view.classList.remove('hide')
    } else {
      console.log('view ', button.dataset.view, button, this.ui.views, ' not found')
    }

    this.emit('select', button.dataset.view)

    return view
  }

  indicator (button) {
    if (!this.ui.indicator) return

    const tabs = this.ui.tabs.getBoundingClientRect()
    var button = button.getBoundingClientRect()

    // console.log('tab rect', b.height, b.height)

    this.ui.indicator.style.top = tabs.height - 2 + 'px'
    this.ui.indicator.style.left = (button.left - tabs.left) + 'px'
    this.ui.indicator.style.width = button.width + 'px'
  }
}

export default TabView
