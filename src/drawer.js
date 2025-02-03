import init from './mixin/init'
import insert from './element/insert'
import classify from './module/classify'
import * as css from './module/css'
import events from './mixin/events'
import create from './element/create'
import emitter from './module/emitter'

// Depracted, see Navigation

class Drawer {
  static defaults = {
    prefix: 'material',
    class: 'drawer',
    modifier: 'width',
    state: 'closed',
    position: 'left',
    tag: 'div',
    width: '340',
    modules: [emitter, events]
  }

  constructor (options) {
    this.options = { ...Drawer.defaults, ...options }

    init(this)

    this.build()
    this.attach()
    this.emit('ready')
  }

  /**
   * Build Method
   * @return {Object} This class instance
   */
  build () {
    // console.log('build')
    this.wrapper = create('div')

    classify(this.wrapper, this.options)

    this.element = create('aside')

    css.add(this.element, 'drawer-panel')

    insert(this.element, this.wrapper)

    if (this.options.position) {
      css.add(this.element, 'position-' + this.options.position)
    }

    if (this.options.fixed) {
      this.wrapper.classList.add('is-fixed')
    }

    if (this.options.size) {
      if (this.options.position === 'top' || this.options.position === 'bottom') {
        this.element.style = 'height: ' + this.options.size + 'px;'
      } else {
        this.element.style = 'width: ' + this.options.size + 'px;'
      }
    }

    if (this.options.open) {
      this.open()
    }

    if (this.options.container) { insert(this.wrapper, this.options.container) }

    this.emit('built', this.element)

    return this
  }

  attach () {
    // console.log('attach', this.options.type)
    if (this.options.type === 'persistent') return
    if (this.options.type === 'permanent') return

    this.wrapper.addEventListener('click', (e) => {
      // console.log('target', e.currentTarget)
      if (this.wrapper === e.currentTarget) {
        this.close()
      }
    })
  }

  /**
   * [toggle description]
   * @return {Object} The class instance
   */

  toggle () {
    // console.log('toggle', this.element);
    if (this.wrapper.classList.contains('show')) {
      this.close()
    } else {
      this.open()
    }

    return this
  }

  /**
   * [minimize description]
   * @return {Object} The class instance
   */
  close () {
    // console.log('close');
    css.remove(this.wrapper, 'show')
    // css.remove(this.underlay, 'show')

    return this
  }

  /**
   * [normalize description]
   * @return {Object} The class instance
   */
  open () {
    // console.log('open')

    css.add(this.wrapper, 'show')

    return this
  }

  /**
   * [insert description]
   * @param  {?} container [description]
   * @return {?}           [description]
   */
  insert (container, context) {
    insert(this.wrapper, container, context)

    return this
  }
}

export default Drawer
