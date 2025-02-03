/**
 * Element style related methods
 * @module component/style
 */
import {
  isIterable,
  isLiteralObject,
  isArray,
  each
} from '../module/utils'

/**
 * Gets element's computed style
 * @param {string} prop
 * @returns {*}
 * @private
 */
function get (element, style) {
  // console.log('get', element, style);
  // get array of elements
  if (isArray(style)) {
    const css = {}
    for (const i in list) {
      css[list[i]] = this.get(element, list[i])
    }
    return css
  } else {
    let computedStyle

    if (typeof window.getComputedStyle === 'function') { // normal browsers
      computedStyle = window.getComputedStyle(element)
    } else if (typeof document.currentStyle !== undefined) { // other browsers
      computedStyle = element.currentStyle
    } else {
      computedStyle = element.style
    }

    if (style) {
      return computedStyle[style]
    } else {
      return computedStyle
    }
  }
}

/**
 * set element style
 * @param { ? } element [description]
 * @param {?} style   [description]
 */
function set (element, style) {
  if (isIterable(element) && _isLiteralObject(style)) {
    each(element, function (e) {
      set(e, style)
    })
    return element
  }

  if (isLiteralObject(style)) {
    // console.log('style', element, style);
    for (const i in style) {
      element.style[i] = style[i]
    }
    return style
  }

  return false
}

export default { get, set }
