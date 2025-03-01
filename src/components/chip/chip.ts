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
import { CHIP_VARIANTS, CHIP_SIZES } from './constants'

/**
 * Creates a new Chip component
 * @param {Object} config - Chip configuration
 * @param {string} [config.variant='filled'] - Chip variant
 * @param {string} [config.size='medium'] - Chip size
 * @param {boolean} [config.selected=false] - Whether the chip is initially selected
 * @param {boolean} [config.disabled=false] - Whether the chip is initially disabled
 * @param {string} [config.text] - Chip text content
 * @param {string} [config.leadingIcon] - Leading icon HTML content
 * @param {string} [config.trailingIcon] - Trailing icon HTML content
 * @param {string} [config.class] - Additional CSS classes
 * @param {string} [config.value] - Chip value
 * @param {boolean} [config.ripple=true] - Whether to enable ripple effect
 * @param {Function} [config.onTrailingIconClick] - Callback when trailing icon is clicked
 * @param {Function} [config.onSelect] - Callback when chip is selected
 * @param {Function} [config.onChange] - Callback when chip selection changes
 * @returns {Object} Chip component instance
 */
const createChip = (config = {}) => {
  const baseConfig = {
    ...config,
    variant: config.variant || CHIP_VARIANTS.FILLED,
    size: config.size || CHIP_SIZES.MEDIUM,
    componentName: 'chip',
    prefix: PREFIX,
    ripple: config.ripple !== false
  }

  try {
    // Create base component with core features
    const chip = pipe(
      createBase,
      withEvents(),
      withElement({
        tag: 'div',
        componentName: 'chip',
        attrs: {
          role: 'button',
          tabindex: '0',
          'aria-disabled': config.disabled ? 'true' : 'false',
          'aria-selected': config.selected ? 'true' : 'false',
          'data-value': config.value || ''
        },
        className: config.class,
        forwardEvents: {
          click: (component) => component.element.getAttribute('aria-disabled') !== 'true',
          focus: true,
          blur: true
        }
      }),
      withLifecycle()
    )(baseConfig)
    
    // Track selected state
    let isSelectedState = !!config.selected;
    
    // Manually add the variant class
    if (config.variant) {
      chip.element.classList.add(`${chip.getClass('chip')}--${config.variant}`)
    }
    
    // Manually add the size class
    if (config.size) {
      chip.element.classList.add(`${chip.getClass('chip')}--${config.size}`)
    }
    
    // Add ripple if enabled
    if (config.ripple) {
      withRipple(baseConfig)(chip)
    }
    
    // Add disabled state if needed
    if (config.disabled) {
      withDisabled(baseConfig)(chip)
    }

    // Add selected class if needed
    if (config.selected) {
      chip.element.classList.add(`${chip.getClass('chip')}--selected`)
    }

    // Create a container for the chip content to ensure proper ordering
    const contentContainer = document.createElement('div')
    contentContainer.className = `${chip.getClass('chip')}-content`
    contentContainer.style.display = 'flex'
    contentContainer.style.alignItems = 'center'
    contentContainer.style.justifyContent = 'center'
    contentContainer.style.width = '100%'
    chip.element.appendChild(contentContainer)
    
    // Add leading icon if provided
    if (config.leadingIcon) {
      const leadingIconElement = document.createElement('span')
      leadingIconElement.className = `${chip.getClass('chip')}-leading-icon`
      leadingIconElement.innerHTML = config.leadingIcon
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
          config.onTrailingIconClick(enhancedChip)
        })
      }
      
      contentContainer.appendChild(trailingIconElement)
    }

    // Create enhanced component with API
    const enhancedChip = {
      ...chip,
      
      /**
       * Checks if the chip is disabled
       * @returns {boolean} True if the chip is disabled
       */
      isDisabled() {
        return chip.element.getAttribute('aria-disabled') === 'true';
      },
      
      /**
       * Checks if the chip is selected
       * @returns {boolean} True if the chip is selected
       */
      isSelected() {
        return isSelectedState;
      },
      
      /**
       * Sets the chip's selected state
       * @param {boolean} selected - Whether the chip should be selected
       * @returns {Object} The chip instance for chaining
       */
      setSelected(selected) {
        isSelectedState = !!selected;
        
        if (selected) {
          chip.element.classList.add(`${chip.getClass('chip')}--selected`);
          chip.element.setAttribute('aria-selected', 'true');
        } else {
          chip.element.classList.remove(`${chip.getClass('chip')}--selected`);
          chip.element.setAttribute('aria-selected', 'false');
        }
        
        return this;
      },
      
      /**
       * Toggles the chip's selected state
       * @returns {Object} The chip instance for chaining
       */
      toggleSelected() {
        return this.setSelected(!isSelectedState);
      },
      
      /**
       * Gets the chip's value
       * @returns {string} The chip's value
       */
      getValue() {
        return chip.element.getAttribute('data-value');
      },
      
      /**
       * Sets the chip's value
       * @param {string} value - Value to set
       * @returns {Object} The chip instance for chaining
       */
      setValue(value) {
        chip.element.setAttribute('data-value', value);
        return this;
      },
      
      /**
       * Enables the chip
       * @returns {Object} The chip instance for chaining
       */
      enable() {
        chip.element.classList.remove(`${chip.getClass('chip')}--disabled`);
        chip.element.setAttribute('aria-disabled', 'false');
        chip.element.setAttribute('tabindex', '0');
        return this;
      },
      
      /**
       * Disables the chip
       * @returns {Object} The chip instance for chaining
       */
      disable() {
        chip.element.classList.add(`${chip.getClass('chip')}--disabled`);
        chip.element.setAttribute('aria-disabled', 'true');
        chip.element.setAttribute('tabindex', '-1');
        return this;
      },
      
      /**
       * Sets the chip's text content
       * @param {string} content - Text content
       * @returns {Object} The chip instance for chaining
       */
      setText(content) {
        const textElement = chip.element.querySelector(`.${chip.getClass('chip')}-text`);
        
        if (textElement) {
          textElement.textContent = content;
        } else if (content) {
          const newTextElement = document.createElement('span');
          newTextElement.className = `${chip.getClass('chip')}-text`;
          newTextElement.textContent = content;
          contentContainer.appendChild(newTextElement);
        }
        
        return this;
      },
      
      /**
       * Gets the chip's text content
       * @returns {string} The chip's text content
       */
      getText() {
        const textElement = chip.element.querySelector(`.${chip.getClass('chip')}-text`);
        return textElement ? textElement.textContent : '';
      },
      
      /**
       * Sets the chip's icon
       * @param {string} icon - Icon HTML content
       * @returns {Object} The chip instance for chaining
       */
      setIcon(icon) {
        return this.setLeadingIcon(icon);
      },
      
      /**
       * Gets the chip's icon
       * @returns {string} The chip's icon HTML
       */
      getIcon() {
        const iconElement = chip.element.querySelector(`.${chip.getClass('chip')}-leading-icon`);
        return iconElement ? iconElement.innerHTML : '';
      },
      
      /**
       * Sets the chip's leading icon
       * @param {string} icon - Icon HTML content
       * @returns {Object} The chip instance for chaining
       */
      setLeadingIcon(icon) {
        const leadingIconSelector = `.${chip.getClass('chip')}-leading-icon`;
        let leadingIconElement = chip.element.querySelector(leadingIconSelector);
        
        if (!leadingIconElement && icon) {
          leadingIconElement = document.createElement('span');
          leadingIconElement.className = `${chip.getClass('chip')}-leading-icon`;
          
          // Insert at the beginning of the content container
          contentContainer.insertBefore(leadingIconElement, contentContainer.firstChild);
        }
        
        if (leadingIconElement) {
          leadingIconElement.innerHTML = icon || '';
          
          // Remove the element if icon is empty
          if (!icon && leadingIconElement.parentNode) {
            leadingIconElement.parentNode.removeChild(leadingIconElement);
          }
        }
        
        return this;
      },
      
      /**
       * Sets the chip's trailing icon
       * @param {string} icon - Icon HTML content
       * @param {Function} [onClick] - Click handler for the trailing icon
       * @returns {Object} The chip instance for chaining
       */
      setTrailingIcon(icon, onClick) {
        const trailingIconSelector = `.${chip.getClass('chip')}-trailing-icon`;
        let trailingIconElement = chip.element.querySelector(trailingIconSelector);
        
        if (!trailingIconElement && icon) {
          trailingIconElement = document.createElement('span');
          trailingIconElement.className = `${chip.getClass('chip')}-trailing-icon`;
          
          // Add at the end of the content container
          contentContainer.appendChild(trailingIconElement);
          
          // Add click handler if provided
          if (onClick) {
            trailingIconElement.addEventListener('click', (e) => {
              e.stopPropagation(); // Prevent chip click event
              onClick(this);
            });
          }
        }
        
        if (trailingIconElement) {
          trailingIconElement.innerHTML = icon || '';
          
          // Remove the element if icon is empty
          if (!icon && trailingIconElement.parentNode) {
            trailingIconElement.parentNode.removeChild(trailingIconElement);
          }
        }
        
        return this;
      },
      
      /**
       * Destroys the chip component and cleans up resources
       */
      destroy() {
        chip.lifecycle && chip.lifecycle.destroy && chip.lifecycle.destroy();
        chip.element.remove();
      },
      
      // Forward event methods from the original chip
      on: chip.on,
      off: chip.off,
      
      /**
       * Add CSS classes to the chip element
       * @param {...string} classes - CSS classes to add
       * @returns {Object} The chip instance for chaining
       */
      addClass(...classes) {
        chip.element.classList.add(...classes);
        return this;
      }
    };

    // Add click handler for selection toggle
    if (config.variant === CHIP_VARIANTS.FILTER || 
        config.variant === CHIP_VARIANTS.ASSIST ||
        config.selectable) {
      
      chip.element.addEventListener('click', () => {
        if (enhancedChip.isDisabled()) return;
        
        enhancedChip.toggleSelected();
        
        // Call onChange callback if provided
        if (config.onChange) {
          config.onChange(enhancedChip);
        }
        
        // Call onSelect callback if provided
        if (config.onSelect) {
          config.onSelect(enhancedChip);
        }
      });
    }

    return enhancedChip;
  } catch (error) {
    console.error('Chip creation error:', error);
    throw new Error(`Failed to create chip: ${error.message}`);
  }
};

export default createChip;