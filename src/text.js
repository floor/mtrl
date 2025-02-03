import Component from './class/component'

class Text extends Component {
  static defaults = {
    class: 'text',
    tag: 'span'
  }

  constructor (options) {
    super(options)
    this.setup()
  }

  setup () {
    if (this.options.text) {
      this.set(this.options.text)
    }
  }

  set (text) {
    // console.log('set', text)
    if (text === 'undefined' || !text) text = ''

    const label = this.options.label || ''

    if (this.options.textFirst) {
      this.element.innerHTML = text + label
    } else {
      this.element.innerHTML = label + text
    }

    if (this.options.spaceAfter) {
      this.element.innerHTML = this.element.innerHTML + ' '
    }
  }

  setText (text) {
    if (text === 'undefined') text = ''
    this.element.innerHTML = text
  }

  get () {
    if (this.element.innerHTML) {
      return this.element.innerHTML
    } else {
      return ''
    }
  }
}

export default Text
