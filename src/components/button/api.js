// src/components/button/api.js

/**
 * Enhances a button component with API methods
 * @param {Object} options - API configuration options
 * @param {Object} options.disabled - Object containing enable/disable methods
 * @param {Object} options.lifecycle - Object containing lifecycle methods
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Button component
 */
export const withAPI = ({ disabled, lifecycle }) => (component) => ({
  ...component,
  element: component.element,
  getValue: () => component.element.value,
  setValue (value) {
    component.element.value = value
    return this
  },
  enable () {
    disabled.enable()
    return this
  },
  disable () {
    disabled.disable()
    return this
  },
  setText (content) {
    component.text.setText(content)
    this.updateCircularStyle()
    return this
  },
  getText () {
    return component.text.getText()
  },
  setIcon (icon) {
    component.icon.setIcon(icon)
    this.updateCircularStyle()
    return this
  },
  getIcon () {
    return component.icon.getIcon()
  },
  destroy () {
    lifecycle.destroy()
  },
  updateCircularStyle () {
    const hasText = component.text.getElement()
    if (!hasText && component.icon.getElement()) {
      component.element.classList.add(`${component.getClass('button')}--circular`)
    } else {
      component.element.classList.remove(`${component.getClass('button')}--circular`)
    }
  }
})
