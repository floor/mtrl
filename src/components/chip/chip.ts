// src/components/chip/chip.ts
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import {
  withEvents,
  withText,
  withIcon,
  withVariant,
  withRipple,
  withDisabled,
  withLifecycle
} from '../../core/compose/features'
import { withAPI } from './api'
import { ChipConfig, ChipComponent } from './types'
import { createBaseConfig, getElementConfig, getApiConfig } from './config'

/**
 * Creates a new Chip component following Material Design 3 guidelines.
 * 
 * Chips help people enter information, make selections, filter content, or trigger actions.
 * They are small components that represent an input, attribute, or action.
 * 
 * @param {ChipConfig} config - Chip configuration options
 * @returns {ChipComponent} Chip component instance with methods to control appearance and behavior
 * 
 * @category Components
 * 
 * @example
 * // Create a basic input chip
 * const chip = fChip({
 *   text: 'Marketing',
 *   variant: 'input'
 * });
 * 
 * @example
 * // Create a filter chip with an icon
 * const filterChip = fChip({
 *   text: 'Favorites',
 *   variant: 'filter',
 *   leadingIcon: '<svg>...</svg>',
 *   selected: true
 * });
 * 
 * @example
 * // Create a suggestion chip with trailing icon and callback
 * const suggestionChip = fChip({
 *   text: 'Add to calendar',
 *   variant: 'suggestion',
 *   leadingIcon: '<svg>...</svg>',
 *   trailingIcon: '<svg>...</svg>',
 *   onTrailingIconClick: (chip) => {
 *     console.log('Trailing icon clicked');
 *   }
 * });
 */
const fChip = (config: ChipConfig = {}): ChipComponent => {
  const baseConfig = createBaseConfig(config)

  try {
    // Create base component with core features
    const chip = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withDisabled(baseConfig),
      withRipple(baseConfig),
      withLifecycle()
    )(baseConfig)
    
    // Create a container for the chip content to ensure proper ordering
    const contentContainer = document.createElement('div')
    contentContainer.className = `${chip.getClass('chip')}-content`
    contentContainer.style.display = 'flex'
    contentContainer.style.alignItems = 'center'
    contentContainer.style.justifyContent = 'center'
    contentContainer.style.width = '100%'
    chip.element.appendChild(contentContainer)
    
    // Add leading icon if provided
    if (config.leadingIcon || config.icon) {
      const leadingIconElement = document.createElement('span')
      leadingIconElement.className = `${chip.getClass('chip')}-leading-icon`
      leadingIconElement.innerHTML = config.leadingIcon || config.icon || ''
      contentContainer.appendChild(leadingIconElement)
    }

    // Add text element if provided
    if (config.text) {
      const textElement = document.createElement('span')
      textElement.className = `${chip.getClass('chip')}-text`
      textElement.textContent = config.text
      contentContainer.appendChild(textElement)
    }

    // Add trailing icon if provided
    if (config.trailingIcon) {
      const trailingIconElement = document.createElement('span')
      trailingIconElement.className = `${chip.getClass('chip')}-trailing-icon`
      trailingIconElement.innerHTML = config.trailingIcon
      
      // Add click handler for trailing icon
      if (config.onTrailingIconClick) {
        trailingIconElement.addEventListener('click', (e) => {
          e.stopPropagation() // Prevent chip click event
          config.onTrailingIconClick(chip as unknown as ChipComponent)
        })
      }
      
      contentContainer.appendChild(trailingIconElement)
    }
    
    // Add selected class if needed
    if (config.selected) {
      chip.element.classList.add(`${chip.getClass('chip')}--selected`)
      chip.element.setAttribute('aria-selected', 'true')
    }
    
    // Set data-value attribute if provided
    if (config.value) {
      chip.element.setAttribute('data-value', config.value)
    }

    // Add API methods to the component
    const enhancedChip = withAPI(getApiConfig(chip))(chip)
    
    // Initialize value if not already set
    if (!chip.element.hasAttribute('data-value') && config.text) {
      enhancedChip.getValue() // This will trigger the automatic value generation in our fixed API
    }

    // Add click handler for selection toggle
    if (config.variant === 'filter' || 
        config.variant === 'assist' ||
        config.selectable) {
      
      chip.element.addEventListener('click', () => {
        if (enhancedChip.isDisabled()) return
        
        enhancedChip.toggleSelected()
        
        // Call onChange callback if provided
        if (config.onChange) {
          config.onChange(enhancedChip as unknown as ChipComponent)
        }
        
        // Call onSelect callback if provided
        if (config.onSelect) {
          config.onSelect(enhancedChip as unknown as ChipComponent)
        }
      })
    }

    return enhancedChip as unknown as ChipComponent
  } catch (error) {
    console.error('Chip creation error:', error)
    throw new Error(`Failed to create chip: ${(error as Error).message}`)
  }
}

export default fChip