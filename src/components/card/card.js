// src/components/card/card.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import {
  withEvents,
  withVariant,
  withRipple,
  withLifecycle
} from '../../core/compose/features'
import { withAPI } from './api'
import { CARD_VARIANTS, CARD_ELEVATIONS } from './constants'
import defaultConfig from './config'

/**
 * Creates a new Card component following Material Design 3 principles
 * @param {Object} config - Card configuration object
 * @param {string} [config.variant='elevated'] - Card variant (elevated, filled, outlined)
 * @param {boolean} [config.interactive=false] - Whether the card has hover/focus states
 * @param {boolean} [config.fullWidth=false] - Whether the card spans full width of container
 * @param {boolean} [config.clickable=false] - Whether the card is clickable with ripple effect
 * @param {boolean} [config.draggable=false] - Whether the card is draggable
 * @param {string} [config.class] - Additional CSS classes
 * @returns {Object} Card component instance
 */
const createCard = (config = {}) => {
  const baseConfig = {
    ...defaultConfig,
    ...config,
    componentName: 'card',
    prefix: PREFIX
  }

  try {
    const card = pipe(
      createBase,
      withEvents(),
      withElement({
        tag: 'div',
        componentName: 'card',
        className: [
          config.class,
          config.fullWidth ? `${PREFIX}-card--full-width` : null,
          config.interactive ? `${PREFIX}-card--interactive` : null
        ],
        forwardEvents: {
          click: (component) => config.clickable,
          mouseenter: (component) => config.interactive,
          mouseleave: (component) => config.interactive
        },
        interactive: config.interactive || config.clickable
      }),
      withVariant(baseConfig),
      config.clickable ? withRipple(baseConfig) : (c) => c,
      withLifecycle(),
      comp => {
        // Implement hover state elevation changes for interactive cards
        if (comp.config.interactive) {
          comp.element.addEventListener('mouseenter', () => {
            if (comp.config.variant === CARD_VARIANTS.ELEVATED) {
              comp.element.style.setProperty('--card-elevation', CARD_ELEVATIONS.HOVERED)
            }
          })

          comp.element.addEventListener('mouseleave', () => {
            if (comp.config.variant === CARD_VARIANTS.ELEVATED) {
              comp.element.style.setProperty('--card-elevation', CARD_ELEVATIONS.RESTING)
            }
          })
        }

        // Set up draggable
        if (comp.config.draggable) {
          comp.element.setAttribute('draggable', 'true')
          comp.element.addEventListener('dragstart', (e) => {
            comp.element.style.setProperty('--card-elevation', CARD_ELEVATIONS.DRAGGED)
            comp.emit('dragstart', { event: e })
          })

          comp.element.addEventListener('dragend', (e) => {
            comp.element.style.setProperty('--card-elevation', CARD_ELEVATIONS.RESTING)
            comp.emit('dragend', { event: e })
          })
        }

        return comp
      },
      comp => withAPI({
        lifecycle: {
          destroy: () => comp.lifecycle.destroy()
        }
      })(comp)
    )(baseConfig)

    return card
  } catch (error) {
    console.error('Card creation error:', error)
    throw new Error(`Failed to create card: ${error.message}`)
  }
}

export default createCard
