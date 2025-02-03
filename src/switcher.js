import EventEmitter from './mixin/emitter'
import events from './module/events'

class Switcher extends EventEmitter {
  static defaults = {
    class: 'switcher',
    tag: 'div',
    list: [],
    first: false,
    mode: 'unique',
    allowEmpty: false,
    events: [
      ['element.click', 'click']
    ]
  }

  constructor (options) {
    super()

    this.init(options)
    this.build()
    this.setup()
  }

  init (options) {
    this.options = { ...Switcher.defaults, ...options }
  }

  build () {
    this.element = document.createElement(this.options.tag)

    if (this.options.class !== 'button') {
      this.element.setAttribute('class', 'switcher ' + this.options.class)
    } else {
      this.element.classList.add('switcher')
    }

    if (this.options.label) {
      this.label = document.createElement('label')
      this.label.innerHTML = this.options.label
      this.element.appendChild(this.label)
    }

    this.knob = document.createElement('span')
    this.knob.classList.add('knob')
    this.element.appendChild(this.knob)

    if (this.options.size) {
      this.element.classList.add(this.options.size + '-size')
    }

    this.buildList(this.options.list)

    if (this.options.list) {
      this.addOptions(this.options.list)
    }

    if (this.options.container) {
      this.options.container.appendChild(this.element)
    }
  }

  buildList (list) {
    this.list = document.createElement('ul')
    this.element.appendChild(this.list)
  }

  setup () {
    // console.log('events.attach', this.options.events)
    events.attach(this.options.events, this)

    if (this.options.default) {
      this.selectByName(this.options.default, true)
    }
  }

  click (event) {
    // console.log('click', event)
    if (!event.target.dataset.switcher) return
    this.select(event.target)
  }

  select (option) {
    if (this.options.mode === 'multiple') {
      this.multiple(option)
    } else {
      this.unique(option)
    }
  }

  preselect (item) {
    // console.log('preselect', item)
    if (item) {
      item.classList.add('preselected')
    } else {
      const items = this.list.childNodes
      for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('preselected')
      }
    }
  }

  selectByName (name) {
    // console.log('selectByName', name)
    const item = this.element.querySelector('[data-switcher="' + name + '"]')
    // console.log('item', item)
    if (item) {
      this.select(item)
    }
  }

  preSelectByName (name) {
    // console.log('selectByName', name)
    const item = this.element.querySelector('[data-switcher="' + name + '"]')
    // console.log('item', item)
    this.preselect(item)
  }

  unique (option) {
    // console.log('option', option)
    if (!option.classList.contains('selected')) {
      const options = this.list.childNodes

      for (let i = 0; i < options.length; i++) {
        options[i].classList.remove('selected')
      }

      option.classList.add('selected')
      this.selected = [option.dataset.switcher]
      this.emit('change', this.selected[0])
    } else {
      if (this.options.allowEmpty) {
        option.classList.remove('selected')
        this.selected = []
        this.emit('change', this.selected[0])
      }
    }
  }

  multiple (option) {
    if (option.classList.contains('selected')) {
      if (this.selected.length === 1) return
      const i = this.selected.indexOf(option.dataset.switcher)
      this.selected.splice(i, 1)
      option.classList.remove('selected')
    } else {
      option.classList.add('selected')
      this.selected.push(option.dataset.switcher)
    }

    this.emit('change', this.selected)
  }

  set (prop, value, silent) {
    switch (prop) {
      case 'value':
        this.setValue(value)
        break
      case 'options':
        this.setOptions(value)
        break
      case 'option':
        this.addOptions(value)
        break
      default:
        this.setValue(prop, value)
    }

    return this
  }

  setValue (value, silent) {
    // console.log('value', value, this.options.list, this.element)
    const list = this.options.list
    if (this.options.mode === 'unique') {
      for (var i = 0; i < list.length; i++) {
        this.element.querySelector('[data-switcher="' + list[i] + '"]').classList.remove('selected')
        if (list[i] == value) {
          this.selected = [value]
          this.element.querySelector('[data-switcher="' + list[i] + '"]').classList.add('selected')
        }
      }
    } else {
      value = value || []
      this.selected = []
      for (var i = 0; i < list.length; i++) {
        this.element.querySelector('[data-switcher="' + list[i] + '"]').classList.remove('selected')
        if (value.indexOf(list[i]) !== -1) {
          this.selected.push(list[i])
          this.element.querySelector('[data-switcher="' + list[i] + '"]').classList.add('selected')
        }
      }
    }
  }

  get () {
    console.log('get', this.options.mode, this.selected[0])
    if (this.options.mode === 'unique') {
      return this.selected[0]
    } else {
      return this.selected
    }
  }

  getValue () {
    // console.log('get', this.selected)
    if (this.options.mode === 'unique') {
      return this.selected[0]
    } else {
      return this.selected
    }
  }

  addOptions (list) {
    // console.log('setOptions', list, this.options.list)

    if (!list) return

    for (let i = 0; i < list.length; i++) {
      this.addOption(list[i])
    }
  }

  setOptions (list) {
    // console.log('setOptions', list, this.options.list)

    if (!list) return

    if (this.options.list.length < 1) this.options.list = list

    for (let i = 0; i < list.length; i++) {
      this.addOption(list[i])
    }
  }

  addOption (value) {
    // console.log('addOption', value)
    const item = document.createElement('li')
    item.classList.add('item')
    item.dataset.switcher = value
    item.innerHTML = value
    this.list.appendChild(item)
    // this.options.list.push(list[i])
  }

  setLabel (value) {
    // console.log('setLabel', value)
    if (this.label) {
      this.label.innerHTML = value
    }
  }

  setText (value) {
    // console.log('setText', value)
    this.setLabel(value)
  }
}

export default Switcher
