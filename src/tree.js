import emitter from './module/emitter'
import * as css from './module/css'
import events from './module/events'
import insert from './mixin/insert'

class Tree {
  static defaults = {
    prefix: 'material',
    class: 'tree',
    functions: ['render', 'select'],
    target: '.item-tree',
    events: [
      ['root.click', 'onSelect']
    ]
  }

  constructor (options) {
    this.init()
    this.build()
    events.attach(this.options.events, this)

    return this
  }

  init () {
    this.options = { ...Tree.defaults, ...options }

    this.name = this.options.name
    this.filters = []
    this.data = []
    this.items = []

    // assign modules
    Object.assign(this, emitter, insert, attach)

    // init function
    this._initFunction(this.options.functions)

    return this
  }

  _initFunction (functions) {
    for (let i = 0; i < functions.length; i++) {
      const name = functions[i]
      if (this.options[name]) {
        this[name] = this.options[name]
      }
    }
  }

  build () {
    // define main tag
    const tag = this.options.tag || 'div'

    this.element = document.createElement(tag)
    css.add(this.element, this.options.prefix + '-' + this.options.class)

    if (this.options.container) {
      this.insert(this.options.container)
    }

    if (this.options.data) {
      this.buildTree(this.options.data)
    }

    // this.element.addEventListener("click", function(e) {
    //   // console.log("list", this, e);
    //   // e.target was the clicked element
    // });

    return this
  }

  buildTree (data) {
    this.element.innerHTML = ''

    // console.log('buildTree', data);

    let tree = ''

    function checkChildren (parentObj, level) {
      if (level) {
        level++
      } else {
        level = 0
      }

      level++

      // console.log('-- ', level, parentObj);
      if (parentObj.path) {
        var level = (parentObj.path.split('/').length - 1)

        if (level > 0) {
          tree += '<li class="item-tree" data-path="' + parentObj.path + '">' + parentObj.name
        }
      } else {
        if (level > 1) {
          tree += '<li class="item-tree" data-id="' + parentObj._id + '">' + parentObj.name
        }
      }

      if (parentObj.children && parentObj.children.length > 0) {
        tree += '<ul>'
        for (let i = 0; i < parentObj.children.length; i++) {
          const children = parentObj.children[i]

          checkChildren(children, level)
        }
        tree += '</ul>'
      }

      if (level > 0) {
        tree += '</li>'
      }
    }

    checkChildren(data)

    // console.log('html tree', tree);

    this.element.innerHTML = tree

    return tree
  }

  getOptions () {
    // console.log(this.options)
  }

  onSelect (e) {
    // console.log('click', e.target, this.options.target)
    if (e.target && e.target.matches(this.options.target)) {
      // console.log('item clicked: ', e.target)

      css.remove(this.item, 'is-selected')
      css.add(e.target, 'is-selected')

      this.item = e.target

      if (this.select) {
        this.select(this.item, e)
      }
    }

    return this
  }

  select (item, event) {
    // console.log('select', item, event)
    this.item = item

    this.emit('selected', item[0])
  }

  set (prop, value, options) {
    switch (prop) {
      case 'tree':
        this.setTree(value, options)
        break
      default:
        this.setTree(prop)
    }

    return this
  }

  setTree (data) {
    this.buildTree(data)
    return this
  }

  addItem (item /*, index */) {
    if (!item) {
      return
    }

    const where = 'bottom'
    this.insertElement(item.root, this.element, where)
    // item.insert(this.element, where);
    this.items.push(item)

    return item
  }

  empty () {
    // console.log('empty')
    this.element.innerHTML = ''
    this.items = []
    this.item = null
  }
}

export default Tree
