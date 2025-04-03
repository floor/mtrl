// src/components/chip/api.ts
import { ApiOptions, ChipComponent } from './types'

interface ComponentWithElements {
  element: HTMLElement;
  text?: {
    setText: (content: string) => any;
    getText: () => string;
    getElement: () => HTMLElement | null;
  };
  icon?: {
    setIcon: (html: string) => any;
    getIcon: () => string;
    getElement: () => HTMLElement | null;
  };
  getClass: (name: string) => string;
}

/**
 * Enhances a chip component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Chip component
 */
export const withAPI = ({ disabled, lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): ChipComponent => {
    // Track selected state internally
    let isSelected = component.element.classList.contains(`${component.getClass('chip')}--selected`);
    
    // Store the value internally as well to ensure reliability
    let chipValue = component.element.getAttribute('data-value') || null;
    
    return {
      ...component as any,
      element: component.element,
      
      getValue() {
        // First try to get from the element's attribute
        const attrValue = component.element.getAttribute('data-value');
        
        // If we have an attribute value, update our internal value and return it
        if (attrValue !== null) {
          chipValue = attrValue;
          return attrValue;
        }
        
        // If we have an internal value, set it on the element and return it
        if (chipValue !== null) {
          component.element.setAttribute('data-value', chipValue);
          return chipValue;
        }
        
        // If we have text content, derive a value from it
        const textElement = component.element.querySelector(`.${component.getClass('chip')}-text`);
        if (textElement && textElement.textContent) {
          // Convert text like "Ocean Theme" to "ocean"
          const text = textElement.textContent;
          if (text.includes(' Theme')) {
            chipValue = text.replace(' Theme', '').toLowerCase();
          } else {
            chipValue = text.toLowerCase().replace(/\s+/g, '-');
          }
          
          // Set the derived value on the element
          component.element.setAttribute('data-value', chipValue);
          return chipValue;
        }
        
        return null;
      },
      
      setValue(value: string) {
        if (value !== null && value !== undefined) {
          chipValue = value;
          component.element.setAttribute('data-value', value);
        } else {
          chipValue = null;
          component.element.removeAttribute('data-value');
        }
        return this;
      },
      
      isDisabled() {
        return component.element.getAttribute('aria-disabled') === 'true';
      },
      
      enable() {
        disabled.enable();
        component.element.classList.remove(`${component.getClass('chip')}--disabled`);
        component.element.setAttribute('aria-disabled', 'false');
        component.element.setAttribute('tabindex', '0');
        return this;
      },
      
      disable() {
        disabled.disable();
        component.element.classList.add(`${component.getClass('chip')}--disabled`);
        component.element.setAttribute('aria-disabled', 'true');
        component.element.setAttribute('tabindex', '-1');
        return this;
      },
      
      setText(content: string) {
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
      
      getText() {
        const textElement = component.element.querySelector(`.${component.getClass('chip')}-text`);
        return textElement ? textElement.textContent || '' : '';
      },
      
      setIcon(icon: string) {
        return this.setLeadingIcon(icon);
      },
      
      getIcon() {
        const iconElement = component.element.querySelector(`.${component.getClass('chip')}-leading-icon`);
        return iconElement ? iconElement.innerHTML : '';
      },
      
      setLeadingIcon(icon: string) {
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
      
      setTrailingIcon(icon: string, onClick?: (chip: ChipComponent) => void) {
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
              onClick(this as unknown as ChipComponent);
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
      
      isSelected() {
        return isSelected;
      },
      
      setSelected(selected: boolean) {
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
      
      toggleSelected() {
        return this.setSelected(!isSelected);
      },
      
      destroy() {
        lifecycle.destroy();
      }
    } as unknown as ChipComponent;
  };