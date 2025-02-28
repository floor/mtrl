// src/components/card/media.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'

/**
 * Creates a card media component
 * @param {Object} config - Media configuration
 * @param {string} [config.src] - Image source URL
 * @param {string} [config.alt] - Image alt text
 * @param {HTMLElement} [config.element] - Custom media element
 * @param {string} [config.aspectRatio='16:9'] - Media aspect ratio
 * @param {boolean} [config.contain=false] - Whether to use object-fit: contain
 * @returns {HTMLElement} Card media element
 */
export const createCardMedia = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'card-media',
    prefix: PREFIX
  }

  try {
    const media = pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'card-media',
        className: [
          config.class,
          config.aspectRatio ? `${PREFIX}-card-media--${config.aspectRatio.replace(':', '-')}` : null,
          config.contain ? `${PREFIX}-card-media--contain` : null
        ]
      })
    )(baseConfig)

    // If custom element is provided, use it
    if (config.element instanceof HTMLElement) {
      media.element.appendChild(config.element)
    }

    // Otherwise create an image if src is provided
    else if (config.src) {
      const img = document.createElement('img')
      img.src = config.src
      if (config.alt) img.alt = config.alt
      img.className = `${PREFIX}-card-media-img`
      media.element.appendChild(img)
    }

    return media.element
  } catch (error) {
    console.error('Card media creation error:', error)
    throw new Error(`Failed to create card media: ${error.message}`)
  }
}
