// src/components/button/button.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import {
  withEvents,
  withText,
  withIcon,
  withVariant,
  withSize,
  withRipple,
  withDisabled,
  withLifecycle
} from '../../core/compose/features'
import { withAPI } from './api'
import { BUTTON_VARIANTS } from './constants'

/**
 * Creates a new Button component
 * @param {Object} config - Button configuration object
 * @param {string} [config.variant='filled'] - Button variant (filled, tonal, outlined, elevated, text)
 * @param {string} [config.size] - Button size (small, medium, large)
 * @param {boolean} [config.disabled] - Whether the button is initially disabled
 * @param {string} [config.text] - Initial button text content
 * @param {string} [config.icon] - Initial button icon HTML content
 * @param {string} [config.class] - Additional CSS classes
 * @param {string} [config.value] - Button value attribute
 */
const createButton = (config = {}) => {
  const baseConfig = {
    ...config,
    variant: config.variant || BUTTON_VARIANTS.FILLED,
    componentName: 'button',
    prefix: PREFIX
  }

  try {
    const button = pipe(
      createBase,
      withEvents(),
      withElement({
        tag: 'button',
        componentName: 'button',
        attrs: {
          type: config.type || 'button',
          disabled: config.disabled,
          value: config.value
        },
        className: config.class,
        forwardEvents: {
          click: (component) => !component.element.disabled,
          focus: true,
          blur: true
        }
      }),
      withVariant(baseConfig),
      withSize(baseConfig),
      withText(baseConfig),
      withIcon(baseConfig),
      withDisabled(baseConfig),
      withRipple(baseConfig),
      withLifecycle(),
      comp => withAPI({
        disabled: {
          enable: () => comp.disabled.enable(),
          disable: () => comp.disabled.disable()
        },
        lifecycle: {
          destroy: () => comp.lifecycle.destroy()
        }
      })(comp)
    )(baseConfig)

    return button
  } catch (error) {
    console.error('Button creation error:', error)
    throw new Error(`Failed to create button: ${error.message}`)
  }
}

export default createButton
