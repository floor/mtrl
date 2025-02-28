// src/components/card/content.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'

/**
 * Creates a card content component
 * @param {Object} config - Content configuration
 * @param {string} [config.text] - Text content
 * @param {string} [config.html] - HTML content
 * @param {Array<HTMLElement>} [config.children] - Child elements to append
 * @param {boolean} [config.padding=true] - Whether to apply default padding
 * @returns {HTMLElement} Card content element
 */
export const createCardContent = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'card-content',
    prefix: PREFIX
  }

  try {
    const content = pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'card-content',
        className: [
          config.class,
          config.padding === false ? `${PREFIX}-card-content--no-padding` : null
        ],
        html: config.html,
        text: config.text
      })
    )(baseConfig)

    // Add children if provided
    if (Array.isArray(config.children)) {
      config.children.forEach(child => {
        if (child instanceof HTMLElement) {
          content.element.appendChild(child)
        }
      })
    }

    return content.element
  } catch (error) {
    console.error('Card content creation error:', error)
    throw new Error(`Failed to create card content: ${error.message}`)
  }
}
