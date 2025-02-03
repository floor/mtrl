import EventEmitter from './mixin/emitter'
import events from './module/events'
import build from './mixin/build'
import dataset from './module/dataset'
import attributes from './module/attributes'

class File {
  static defaults = {
    class: 'file',
    attributes: ['name', 'accept', 'required', 'disabled', 'multiple'],
    events: [
      ['input.change', 'change']

    ]
  }

  constructor (options) {
    this.init(options)
    this.build()
    this.buildInput()
    this.setup()
  }

  init (options) {
    this.options = Object.assign({}, File.defaults, options || {})
    Object.assign(this, build)
  }

  buildInput () {
    this.field = document.createElement('div')
    this.field.classList.add('field')
    this.element.appendChild(this.field)

    this.input = document.createElement('input')
    this.input.setAttribute('type', 'file')
    this.element.appendChild(this.input)

    attributes(this.input, this.options)

    this.field.appendChild(this.input)

    if (this.options.focus) {
      this.input.focus()
    }
  }

  setup () {
    events.attach(this.options.events, this)
  }

  change (e) {
    this.emit('change', e)
  }

  image (e) {
    // console.log('image', e.target)
    // if (input.files && input.files[0]) {
    //   var reader = new FileReader()

    //   reader.onload = (e) => {
    //     cover.style.backgroundImage = 'url("' + e.target.result + '")'
    //   }

    //   reader.readAsDataURL(input.files[0])
    // }
  }

  reset () {
    // console.log('reset')
    this.input.value = ''
  }

  set (image) {
    // console.log('set', image)
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
}

export default File
