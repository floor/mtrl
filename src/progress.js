// import Component from './component';
import create from './element/create'
import classify from './module/classify'
import insert from './element/insert'

class Spinner {
  static defaults = {
    prefix: 'material',
    class: 'progress',
    tag: 'div',
    progress: '0%',
    circular: `<svg class="progress" width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
      <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
    </svg>`
  }

  constructor (options) {
    this.init(options)
    this.build()

    return this
  }

  init (options) {
    // merge options
    this.options = { ...Spinner.defaults, ...options }

    // define class

    // assign modules
    Object.assign(this, insert)
  }

  build (options) {
    this.element = create(this.options.tag)
    classify(this.element, this.options)

    if (this.options.type === 'circular') {
      this.element.innerHTML = this.options.circular
    } if (this.options.type === 'indeterminate') {
      this.bar = create('div', 'bar')
      insert(this.bar, this.element)
    } else {
      this.bar = create('div', 'bar')
      insert(this.bar, this.element)

      this.set(this.options.progress)
    }

    if (this.options.container) {
      insert(this.element, this.options.container)
    }

    return this
  }

  set (progress) {
    this.bar.setAttribute('style', 'width: ' + progress)
  }
};

export default Spinner
