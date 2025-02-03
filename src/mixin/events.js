export default {
  addEvent (event, fn) {
    const element = this.element
    // avoid memory overhead of new anonymous functions for every event handler that's installed
    // by using local functions
    function listenHandler (e) {
      const ret = fn.apply(this, arguments)
      if (ret === false) {
        e.stopPropagation()
        e.preventDefault()
      }
      return (ret)
    }

    function attachHandler () {
      // set the this pointer same as addEventListener when fn is called
      // and make sure the event is passed to the fn also so that works the same too
      const ret = fn.call(element, window.event)
      if (ret === false) {
        window.event.returnValue = false
        window.event.cancelBubble = true
      }
      return (ret)
    }

    if (element.addEventListener) {
      element.addEventListener(event, listenHandler, false)
    } else {
      element.attachEvent('on' + event, attachHandler)
    }

    return this
  },

  removeEvent (event, fn) {
    const element = this.element

    if (element.removeEventListener) {
      element.removeEventListener(event, fn, false)
    } else if (element.detachEvent) {
      element.detachEvent('on' + event, element[fn.toString() + event])
      element[fn.toString() + event] = null
    } else {
      element['on' + event] = function () {}
    }

    return this
  }
}
