// src/core/compose/features/with-ripple.js

import { createRipple } from '../../build/ripple'

/**
 * Higher-order function that adds ripple effect functionality
 * @param {Object} config - Feature configuration
 * @param {boolean} [config.ripple] - Enable/disable ripple effect
 * @param {Object} [config.rippleConfig] - Ripple animation configuration
 * @returns {Function} Component enhancer
 */
export const withRipple = (config = {}) => (component) => {
  if (!config.ripple) return component

  const rippleInstance = createRipple(config.rippleConfig)

  return {
    ...component,
    ripple: rippleInstance,
    lifecycle: {
      ...component.lifecycle,
      mount: () => {
        component.lifecycle.mount()
        rippleInstance.mount(component.element)
      },
      destroy: () => {
        rippleInstance.unmount(component.element)
        component.lifecycle.destroy()
      }
    }
  }
}
