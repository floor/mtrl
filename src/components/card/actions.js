// src/components/card/actions.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'

/**
 * Creates a card actions component
 * @param {Object} config - Actions configuration
 * @param {Array<HTMLElement>} [config.actions] - Action elements to include
 * @param {boolean} [config.fullBleed=false] - Whether actions extend full width
 * @param {boolean} [config.vertical=false] - Whether to stack actions vertically
 * @param {string} [config.align='start'] - Horizontal alignment ('start', 'center', 'end', 'space-between')
 * @returns {HTMLElement} Card actions element
 */
export const createCardActions = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'card-actions',
    prefix: PREFIX
  }

  try {
    const actions = pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'card-actions',
        className: [
          config.class,
          config.fullBleed ? `${PREFIX}-card-actions--full-bleed` : null,
          config.vertical ? `${PREFIX}-card-actions--vertical` : null,
          config.align ? `${PREFIX}-card-actions--${config.align}` : null
        ]
      })
    )(baseConfig)

    // Add action elements if provided
    if (Array.isArray(config.actions)) {
      config.actions.forEach(action => {
        if (action instanceof HTMLElement) {
          actions.element.appendChild(action)
        }
      })
    }

    return actions.element
  } catch (error) {
    console.error('Card actions creation error:', error)
    throw new Error(`Failed to create card actions: ${error.message}`)
  }
}
