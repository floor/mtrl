// src/components/chips/features/label.ts
import { ChipsConfig } from '../types';

/**
 * Adds label functionality to chips component
 * 
 * @param config Chips configuration
 * @returns Component enhancer that adds label functionality
 */
export const withChipsLabel = (config: ChipsConfig) => component => {
  // Track current label state
  const state = {
    text: config.label || '',
    position: config.labelPosition || 'start'
  };
  
  return {
    ...component,
    
    // Label management API
    label: {
      /**
       * Sets the label text
       * @param {string} text - Label text
       * @returns Label controller for chaining
       */
      setText(text: string) {
        state.text = text || '';
        
        const labelElement = component.components?.label;
        
        if (labelElement) {
          labelElement.textContent = state.text;
          
          // Update class based on whether label exists
          if (state.text) {
            component.element.classList.add(`${component.getClass('chips')}--with-label`);
          } else {
            component.element.classList.remove(`${component.getClass('chips')}--with-label`);
          }
        } else if (state.text && component.components && component.element) {
          // Create label if it doesn't exist but we need one
          const label = document.createElement('label');
          label.className = component.getClass('chips-label');
          label.textContent = state.text;
          
          // Add to beginning if start, end if end
          if (state.position === 'end') {
            component.element.appendChild(label);
          } else {
            component.element.insertBefore(label, component.element.firstChild);
          }
          
          // Store for future reference
          component.components.label = label;
          component.element.classList.add(`${component.getClass('chips')}--with-label`);
        }
        
        return this;
      },
      
      /**
       * Gets the label text
       * @returns {string} Label text
       */
      getText() {
        return state.text;
      },
      
      /**
       * Sets the label position
       * @param {string} position - Label position ('start' or 'end')
       * @returns Label controller for chaining
       */
      setPosition(position: 'start' | 'end') {
        state.position = position || 'start';
        
        if (component.element && component.components?.label) {
          const label = component.components.label;
          
          // Update position class
          if (position === 'end') {
            component.element.classList.add(`${component.getClass('chips')}--label-end`);
          } else {
            component.element.classList.remove(`${component.getClass('chips')}--label-end`);
          }
          
          // Move label element to correct position
          if (position === 'end') {
            component.element.appendChild(label);
          } else {
            component.element.insertBefore(label, component.element.firstChild);
          }
        }
        
        return this;
      },
      
      /**
       * Gets the label position
       * @returns {string} Label position
       */
      getPosition() {
        return state.position;
      }
    }
  };
};