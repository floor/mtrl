'use strict'

import dom from '../module/dom'

export default {

  insert (container, context) {
    const element = this.element

    this.insertElement(element, container, context)

    return this
  },

  insertElement (element, container, context) {
    if (container && container.element) {
      container = container.element
    }

    this.container = container

    // if (debug) {
    // console.log('insert', container);
    // }

    // this.emit('insert');

    context = context || 'bottom'

    const contexts = ['top', 'bottom', 'after', 'before']
    const methods = ['prepend', 'append', 'after', 'before']

    const index = contexts.indexOf(context)
    if (index === -1) {
      return
    }

    const method = methods[index]

    // this.emit('insert');

    // insert component element to the dom tree using Dom
    // console.log('dom', method, element);
    dom[method](container, element)
    // this.emit('injected');
    //
    return element
  }
}
