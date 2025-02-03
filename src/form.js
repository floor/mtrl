import insert from './element/insert'
import * as css from './module/css'
import emitter from './module/emitter'
import events from './module/events'
import controller from './mixin/controller'

// import component
import { create } from './module/layout'

class Form {
  static defaults = {
    prefix: 'material',
    class: 'form',
    tag: 'div',
    controls: ['textfield', 'checkbox', 'slider', 'switch']
  }

  constructor (options) {
    this.options = Object.assign({}, Form.defaults, options || {})

    this.init()
    this.build()
    events.attach(this.options.events, this)

    return this
  }

  /**
   * Initialize View
   * @return {void}
   */
  init () {
    // init intanciate name

    // implement module
    Object.assign(this,
      emitter,
      attach,
      insert
    )

    this.document = window.document
    this.controller = controller

    // need to remove the options template to have a reference
    if (this.options.render) {
      this.render = this.options.render
    }

    // this.key = {};

    return this
  }

  /**
   * [_initForm description]
   * @return {Object} This class instance
   */
  build () {
    const tag = this.options.tag || 'div'

    this.element = document.createElement(tag)
    css.add(this.element, this.options.prefix + '-' + this.options.class)

    // complete layout options
    this.options.root = this.element

    this.layout = create(this.options.layout, this.element)

    this._initControls(this.layout.controls)

    return this
  }

  insert (container, context) {
    insert(this.element, container, context)

    return this
  }

  /**
   * [_initControls description]
   * @param  {?} controls [description]
   * @return {?}          [description]
   */
  _initControls (controls) {
    if (!controls) return

    this.key = this.key || {}

    for (let i = 0; i < controls.length; i++) {
      const control = controls[i]
      // control.setAttribute('data-key', control.name);

      this.key[control.name] = control

      control.on('change', function (/* value */) {
        // console.log('change', this.name, value);
      })
    }
  }

  /**
   * [_onSubmit description]
   * @return {void}
   */
  _onSubmit (e) {
    e.preventDefault()
  }

  /**
   * [initControl description]
   * @param  {?} key     [description]
   * @param  {?} section [description]
   * @return {?}         [description]
   */
  initControl (key, section) {
    const name = key.name || 'undefined'

    const control = this.render(key)

    if (control) {
      this.key[name] = control
      control.insert(section)
      control.addEvent('keyup', function () {
        // console.log('change', name, control.get('value'));
      })

      control.setAttribute('data-key', name)
    }
    return this
  }

  /**
   * Getter
   *
   * @param {string} prop
   * @param {string} value
   * @return {Object|void}
   */
  set (prop, value) {
    switch (prop) {
      case 'info':
        return this.setInfo(value)
      case 'schema':
        return this.setSchema(value)
      default:
        return this.setInfo(prop)
    }
  }

  /**
   * [setInfo description]
   * @param {?} info [description]
   */
  setInfo (info) {
    this.info = this.original = info

    this.parseInfo(info)
  }

  /**
   * [parseInfo description]
   * @param  {?} obj  [description]
   * @param  {?} name [description]
   * @param  {?} i    [description]
   * @return {?}      [description]
   */
  parseInfo (obj, name, i) {
    // console.log('parseInfo', obj, name, 'level ' + i);
    let level = i || 0
    level = level + 1
    let key

    if (obj instanceof Object) {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          // recursive call to scan property
          let n = null
          if (name) {
            n = name + '.' + key
          } else {
            n = key
          }

          this.parseInfo(obj[key], n, level)
        }
      }
    } else {
      if (this.key[name] && this.key[name].set) {
        this.key[name].set(obj)
      }
    }
  }

  /**
   * Getter
   *
   * @param {string} prop
   * @param {string} value
   * @return {Object|void}
   */
  get (prop, value) {
    switch (prop) {
      case 'key':
        return this.getValue(value)
      case 'info':
        return this.getInfo()
      case 'original':
        return this.original
      case 'options':
        return this.options
      default: // default will replace the old method see up
        return this.getInfo()
    }
  }

  // /**
  //  * Get Value for the given key
  //  * @param  {string} name defined in dot notation
  //  * @param  {Object} info
  //  * @return {Mixin} The Value of the given key
  //  */
  // getValue(name, info) {
  //   var keys = name.split(/\./);
  //   var value = null;

  //   if (!name || !info) {
  //     return;
  //   }

  //   //_log.debug('getValueFromKey', name, info);

  //   if (keys.length === 1) {
  //     value = info[keys[0]];
  //   }
  //   if (keys.length === 2 && info[keys[0]]) {
  //     if (info[keys[0]]) {
  //       value = info[keys[0]][keys[1]];
  //     }
  //   }
  //   if (keys.length === 3) {
  //     if (info[keys[0]]) {
  //       if (info[keys[0]][keys[1]]) {
  //         value = info[keys[0]][keys[1]][keys[2]];
  //       }
  //     }
  //   }

  //   return value;
  // }

  getInfo () {
    return this.info
  }
}

export default Form
