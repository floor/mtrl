// src/core/compose/features/withEvents.js
/**
 * @module core/compose/features
 */

import { createEmitter } from '../../state/emitter'

/**
 * Adds event handling capabilities to a component
 * @memberof module:core/compose/features
 * @function withEvents
 * @param {HTMLElement} [target] - Event target element
 * @returns {Function} Component transformer
 * @example
 * const button = pipe(
 *   createBase({ componentName: 'button' }),
 *   withElement(),
 *   withEvents()
 * )({})
 *
 * button.on('click', () => console.log('clicked'))
 */

/**
 * Adds event handling capabilities to a component
 * Returns event system ready to use immediately
 */
export const withEvents = () => (component) => {
  const emitter = createEmitter()

  return {
    ...component,
    on (event, handler) {
      emitter.on(event, handler)
      return this
    },

    off (event, handler) {
      emitter.off(event, handler)
      return this
    },

    emit (event, data) {
      emitter.emit(event, data)
      return this
    }
  }
}
