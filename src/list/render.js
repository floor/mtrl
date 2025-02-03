import Element from '../element'
import { create } from '../module/layout'

import dot from '../module/dot'

export default {

  render (list) {
    // console.log('render', list)
    this.virtual.set(list)

    if (this.status && this.options.count !== true) {
      this.status('count', list.length)
    }
  },

  /**
   * [add description]
   * @param {[type]} info    [description]
   * @param {[type]} context [description]
   */
  renderItem (info, context) {
    // console.log('renderItem', info)
    info = info || {}

    const container = this.ui.body

    if (context === 'create') {
      container.scrolltop = 0
    }

    // if (context === 'search') {
    //   container = this.ui['search-list']
    // }

    const element = new Element({
      tag: 'li',
      class: 'item'
    })

    if (this.id && this.id === info[this.dataId]) {
      element.classList.add('selected')
    }

    element.dataset.id = info[this.dataId]
    element.dataset.info = this.options.info

    let layout = null

    if (this.options.itemSwitch) {
      const item = info[this.options.itemSwitch]

      if (this.options.layout.item[item]) {
        layout = create(this.options.layout.item[item], element)
      } else {
        layout = create(this.options.layout.item.base, element)
      }
    } else {
      const itemName = this.options.itemName || 'item'
      layout = create(this.options.layout[itemName], element)
    }

    // console.log('translate', layout)

    if (this.translate && this.options.item && this.options.item.translate) {
      // console.log('----')
      this.translate(layout)
    }

    this.renderInfo(layout, info)

    if (context === 'top' || context === 'create') {
      container.insertBefore(element, container.firstChild)
      this.selectCreated(info, element)
    } else {
      container.appendChild(element)
    }

    this.emit('infoRendered', info, element)

    return element
  },

  /**
   * [renderInfo description]
   * @param  {[type]} layout [description]
   * @param  {[type]} info   [description]
   * @return {[type]}        [description]
   */
  renderInfo (layout, object) {
    // console.log('renderInfo', object)
    const info = dot(object)

    const f = this.extractInfo(layout.component)

    for (const field in f) {
      if (f.hasOwnProperty(field)) {
        if (f[field] && f[field].set) {
          f[field].set(this.objectValueByDotKey(object, field))
        } else {
          // console.log('innerHTML', typeof f[field])
          f[field].innerHTML = info[field]
        }
      }
    }
  },

  objectValueByDotKey (object, dotkey) {
    const keys = dotkey.split(/\./)

    let value = Object.assign({}, object)

    for (let i = 0; i < keys.length; i++) {
      if (value !== undefined) {
        value = value[keys[i]]
      }
    }

    return value
  },

  extractInfo (object) {
    // console.log('extractField', object)

    const field = {}

    for (const property in object) {
      if (object.hasOwnProperty(property)) {
        const infos = property.split(/\./)

        if (infos[0] === 'info' && infos[1] !== undefined) {
          const name = property.substr(5, property.length)
          // console.log('field', name, property)

          field[name] = object[property]
        }
      }
    }

    return field
  }
}
