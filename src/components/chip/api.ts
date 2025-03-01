// src/components/chip/api.js

/**
 * Enhances a chip component with API methods
 * @param {Object} options - API configuration options
 * @param {Object} options.disabled - Object containing enable/disable methods
 * @param {Object} options.lifecycle - Object containing lifecycle methods
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Chip component
 */
export const withAPI = ({ disabled, lifecycle }) => (component) => {
  // Track selected state internally
  let isSelected = component.element.classList.contains(`${component.getClass('chip')}--selected`);
  
  return {
    ...component,
    element: component.element,

    /**
     * Gets the chip's value
     * @returns {string} The chip's value attribute
     */
    getValue() {
      return component.element.getAttribute('data-value') || '';
    },

    /**
     * Sets the chip's value
     * @param {string} value - Value to set
     * @returns {Object} The chip instance for chaining
     */
    setValue(value) {
      component.element.setAttribute('data-value', value || '');
      return this;
    },

    /**
     * Checks if the chip is disabled
     * @returns {boolean} True if the chip is disabled
     */
    isDisabled() {
      return component.element.getAttribute('aria-disabled') === 'true';
    },

    /**
     * Enables the chip
     * @returns {Object} The chip instance for chaining
     */
    enable() {
      disabled.enable();
      component.element.classList.remove(`${component.getClass('chip')}--disabled`);
      component.element.setAttribute('aria-disabled', 'false');
      component.element.setAttribute('tabindex', '0');
      return this;
    },

    /**
     * Disables the chip
     * @returns {Object} The chip instance for chaining
     */
    disable() {
      disabled.disable();
      component.element.classList.add(`${component.getClass('chip')}--disabled`);
      component.element.setAttribute('aria-disabled', 'true');
      component.element.setAttribute('tabindex', '-1');
      return this;
    },

    /**
     * Sets the chip's text content
     * @param {string} content - Text content
     * @returns {Object} The chip instance for chaining
     */
    setText(content) {
      const containerSelector = `.${component.getClass('chip')}-content`;
      const contentContainer = component.element.querySelector(containerSelector) || component.element;
      
      const textSelector = `.${component.getClass('chip')}-text`;
      let textElement = component.element.querySelector(textSelector);
      
      if (!textElement && content) {
        textElement = document.createElement('span');
        textElement.className = `${component.getClass('chip')}-text`;
        
        // Find the right position to insert (after leading icon if present, or as first child)
        const leadingIcon = component.element.querySelector(`.${component.getClass('chip')}-leading-icon`);
        if (leadingIcon) {
          contentContainer.insertBefore(textElement, leadingIcon.nextSibling);
        } else {
          contentContainer.insertBefore(textElement, contentContainer.firstChild);
        }
      }
      
      if (textElement) {
        textElement.textContent = content || '';
        
        // Remove the element if content is empty
        if (!content && textElement.parentNode) {
          textElement.parentNode.removeChild(textElement);
        }
      }
      
      return this;
    },

    /**
     * Gets the chip's text content
     * @returns {string} The chip's text content
     */
    getText() {
      const textElement = component.element.querySelector(`.${component.getClass('chip')}-text`);
      return textElement ? textElement.textContent : '';
    },

    /**
     * Sets the chip's leading icon (alias for setLeadingIcon)
     * @param {string} icon - Icon HTML content
     * @returns {Object} The chip instance for chaining
     */
    setIcon(icon) {
      return this.setLeadingIcon(icon);
    },

    /**
     * Gets the chip's icon content
     * @returns {string} The chip's icon HTML
     */
    getIcon() {
      const iconElement = component.element.querySelector(`.${component.getClass('chip')}-leading-icon`);
      return iconElement ? iconElement.innerHTML : '';
    },

    /**
     * Sets the chip's leading icon
     * @param {string} icon - Icon HTML content
     * @returns {Object} The chip instance for chaining
     */
    setLeadingIcon(icon) {
      const contentContainer = component.element.querySelector(`.${component.getClass('chip')}-content`) || component.element;
      const leadingIconSelector = `.${component.getClass('chip')}-leading-icon`;
      let leadingIconElement = component.element.querySelector(leadingIconSelector);

      if (!leadingIconElement && icon) {
        leadingIconElement = document.createElement('span');
        leadingIconElement.className = `${component.getClass('chip')}-leading-icon`;
        
        // Insert as first child of the content container
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
      const contentContainer = component.element.querySelector(`.${component.getClass('chip')}-content`) || component.element;
      const trailingIconSelector = `.${component.getClass('chip')}-trailing-icon`;
      let trailingIconElement = component.element.querySelector(trailingIconSelector);

      if (!trailingIconElement && icon) {
        trailingIconElement = document.createElement('span');
        trailingIconElement.className = `${component.getClass('chip')}-trailing-icon`;
        
        // Add as last child of content container
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
     * Checks if the chip is selected
     * @returns {boolean} True if the chip is selected
     */
    isSelected() {
      return isSelected;
    },
    
    /**
     * Sets the chip's selected state
     * @param {boolean} selected - Whether the chip should be selected
     * @returns {Object} The chip instance for chaining
     */
    setSelected(selected) {
      isSelected = !!selected;
      
      if (selected) {
        component.element.classList.add(`${component.getClass('chip')}--selected`);
        component.element.setAttribute('aria-selected', 'true');
      } else {
        component.element.classList.remove(`${component.getClass('chip')}--selected`);
        component.element.setAttribute('aria-selected', 'false');
      }
      
      return this;
    },
    
    /**
     * Toggles the chip's selected state
     * @returns {Object} The chip instance for chaining
     */
    toggleSelected() {
      return this.setSelected(!isSelected);
    },

    /**
     * Destroys the chip component and cleans up resources
     */
    destroy() {
      lifecycle.destroy();
    }
  };
};