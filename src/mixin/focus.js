import * as css from '../module/css'

export default {
  /**
   * focus method
   * @return {?} [description]
   */
  focus () {
    if (this.disabled === true) return this

    css.add(this.element, 'is-focused')
    if (this.element.input !== document.activeElement) { this.element.input.focus() }
    return this
  },

  /**
   * blur method
   * @return {?} [description]
   */
  blur () {
    css.remove(this.element, 'is-focused')
    return this
  }
}
