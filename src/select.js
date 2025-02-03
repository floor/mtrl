import EventEmitter from './mixin/emitter'
// modules
import build from './mixin/build'
import events from './module/events'
import attributes from './module/attributes'
import dataset from './module/dataset'

class Select extends EventEmitter {
  static defaults = {
    type: 'list',
    class: 'select',
    first: null,
    attributes: ['type', 'name', 'autocomplete', 'required']
  }

  constructor (options) {
    super()

    this.init(options)
    this.build()
    this.buildLabel()
    this.buildInput()
    events.attach(this.options.events, this)
  }

  init (options) {
    this.options = { ...Select.defaults, ...options }
    Object.assign(this, build, dataset)
  }

  buildLabel () {
    if (this.options.label) {
      this.label = document.createElement('span')
      this.label.classList.add('label')
      this.label.innerHTML = this.options.label
      this.element.appendChild(this.label)
    }
  }

  buildInput () {
    this.input = document.createElement('select')
    this.input.classList.add('input')
    this.element.appendChild(this.input)

    this.input.addEventListener('change', () => {
      // console.log('change', this.input[this.input.selectedIndex].value)
      this.emit('change', this.input[this.input.selectedIndex].value)
    })

    if (this.options.data) {
      dataset(this.data, this.options.data)
    }

    attributes(this.input, this.options)

    if (this.options.options) {
      this.setOptions(this.options.options)
    }
  }

  setOptions (options) {
    // console.log('buildCountry', this.input)

    const first = this.options.first

    if (first && first[0] && first[1]) {
      this.input.options[0] = new Option(first[1], first[0])
    }

    for (let i = 0; i < options.length; i++) {
      this.addOption(options[i][1], options[i][0])
    }
  }

  addOption (name, value) {
    // console.log('addOption', name, value)
    this.input.options[this.input.options.length] = new Option(name, value)
  }

  set (value) {
    // console.log('set', value)
    this.input.value = value

    return this
  }

  setLabel (value) {
    // console.log('setLabel', value)
    if (this.label) {
      this.label.innerHTML = value
    }
  }

  setText (value) {
    this.setLabel(value)
  }

  get () {
    let value = null

    if (this.input[this.input.selectedIndex]) {
      value = this.input[this.input.selectedIndex].value
    }

    return value
  }
}

export default Select
