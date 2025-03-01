// src/components/chip/chip.js
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
import { CHIP_VARIANTS } from './constants'

/**
 * Creates a new Chip component
 * @param {Object} config - Chip configuration object
 * @param {string} [config.variant='filled'] - Chip variant (filled, outlined, elevated, assist)
 * @param {string} [config.size] - Chip size (small, medium, large)
 * @param {boolean} [config.disabled] - Whether the chip is initially disabled
 * @param {string} [config.text] - Initial chip text content
 * @param {string} [config.icon] - Initial chip icon HTML content
 * @param {string} [config.leadingIcon] - Optional leading icon HTML content
 * @param {string} [config.trailingIcon] - Optional trailing icon HTML content
 * @param {boolean} [config.selected] - Whether the chip is initially selected
 * @param {string} [config.class] - Additional CSS classes
 * @param {string} [config.value] - Chip value attribute
 * @returns {Object} Chip component instance
 */
const createChip = (config = {}) => {
  const baseConfig = {
    ...config,
    variant: config.variant || CHIP_VARIANTS.FILLED,
    componentName: 'chip',
    prefix: PREFIX
  }

  try {
    const chip = pipe(
      createBase,
      withEvents(),
      withElement({
        tag: 'div',
        componentName: 'chip',
        attrs: {
          role: 'button',
          tabindex: '0',
          'aria-disabled': config.disabled ? 'true' : null,
          'aria-selected': config.selected ? 'true' : null
        },
        className: [
          config.class,
          config.selected ? `${PREFIX}-chip--selected` : null
        ],
        forwardEvents: {
          click: (component) => !component.element.getAttribute('aria-disabled') === 'true',
          keydown: (component, event) => {
            // Handle space and enter key for accessibility
            if (event.key === ' ' || event.key === 'Enter') {
              event.preventDefault()
              component.element.click()
              return true
            }
            return false
          },
          focus: true,
          blur: true
        }
      }),
      withVariant(baseConfig),
      withSize(baseConfig),
      withText(baseConfig),
      withIcon({
        ...baseConfig,
        position: 'start',
        iconContent: config.leadingIcon || config.icon
      }),
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

    // Add trailing icon if provided
    if (config.trailingIcon) {
      const trailingIconElement = document.createElement('span')
      trailingIconElement.className = `${PREFIX}-chip-trailing-icon`
      trailingIconElement.innerHTML = config.trailingIcon
      chip.element.appendChild(trailingIconElement)

      // Add event listener for remove/close action if needed
      if (config.onTrailingIconClick) {
        trailingIconElement.addEventListener('click', (e) => {
          e.stopPropagation()
          config.onTrailingIconClick(chip)
        })
      }
    }

    // Set up selected state methods
    chip.isSelected = () => chip.element.classList.contains(`${PREFIX}-chip--selected`)

    chip.setSelected = (selected) => {
      if (selected) {
        chip.element.classList.add(`${PREFIX}-chip--selected`)
        chip.element.setAttribute('aria-selected', 'true')
      } else {
        chip.element.classList.remove(`${PREFIX}-chip--selected`)
        chip.element.setAttribute('aria-selected', 'false')
      }
      return chip
    }

    chip.toggleSelected = () => {
      chip.setSelected(!chip.isSelected())
      return chip
    }

    // Initialize selected state if needed
    if (config.selected) {
      chip.setSelected(true)
    }

    return chip
  } catch (error) {
    console.error('Chip creation error:', error)
    throw new Error(`Failed to create chip: ${error.message}`)
  }
}

export default createChip
