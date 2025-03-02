// src/components/radios/radio.ts
import { RadiosConfig, RadioOptionConfig, RadioItem } from './types';

/**
 * Creates a feature that adds radio functionality to a component
 * @param {RadiosConfig} config - Configuration with radio options
 * @returns {Function} Higher-order function that adds radio to component
 */
export const withRadio = (config: RadiosConfig) => (component) => {
  const radios: RadioItem[] = [];
  const radiosClass = component.getClass('radios');
  let selectedValue = config.value || '';
  
  // Add direction class
  component.element.classList.add(
    `${radiosClass}--${config.direction || 'vertical'}`
  );
  
  // Add size class
  component.element.classList.add(
    `${radiosClass}--${config.size || 'medium'}`
  );
  
  // Setup disabled state if needed
  if (config.disabled) {
    component.element.classList.add(`${radiosClass}--disabled`);
  }
  
  /**
   * Creates a radio item DOM structure
   * @param {RadioOptionConfig} option - Radio option configuration
   * @returns {RadioItem} Radio item object
   */
  const createRadioItem = (option: RadioOptionConfig): RadioItem => {
    // Create container
    const radioContainer = document.createElement('div');
    radioContainer.classList.add(`${radiosClass}-item`);
    
    // Create input
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = config.name;
    input.value = option.value;
    input.classList.add(`${radiosClass}-input`);
    
    // Set checked state if value matches
    if (selectedValue === option.value) {
      input.checked = true;
    }
    
    // Set disabled state if needed
    if (config.disabled || option.disabled) {
      input.disabled = true;
      radioContainer.classList.add(`${radiosClass}-item--disabled`);
    }
    
    // Create label
    const label = document.createElement('label');
    label.classList.add(`${radiosClass}-label`);
    
    // Create a container for the radio visual
    const radioControl = document.createElement('span');
    radioControl.classList.add(`${radiosClass}-control`);
    
    // Create the radio circle
    const radioCircle = document.createElement('span');
    radioCircle.classList.add(`${radiosClass}-circle`);
    
    // Add ripple container if ripple is enabled
    if (config.ripple !== false) {
      const rippleContainer = document.createElement('span');
      rippleContainer.classList.add(`${radiosClass}-ripple`);
      radioControl.appendChild(rippleContainer);
    }
    
    // Add circle to control
    radioControl.appendChild(radioCircle);
    
    // Create text span
    const textSpan = document.createElement('span');
    textSpan.classList.add(`${radiosClass}-text`);
    textSpan.textContent = option.label;
    
    // Set label position
    if (option.labelBefore) {
      label.classList.add(`${radiosClass}-label--before`);
      label.appendChild(textSpan);
      label.appendChild(radioControl);
    } else {
      label.appendChild(radioControl);
      label.appendChild(textSpan);
    }
    
    // Setup ID for label-input connection
    const inputId = `${radiosClass}-${option.value}-${Math.random().toString(36).substring(2, 9)}`;
    input.id = inputId;
    label.htmlFor = inputId;
    
    // Add elements to container
    radioContainer.appendChild(input);
    radioContainer.appendChild(label);
    
    // Add change event listener
    const handleChange = (e) => {
      if (input.checked) {
        selectedValue = option.value;
        
        // Update other radio inputs
        radios.forEach(radio => {
          if (radio.input !== input) {
            radio.input.checked = false;
          }
        });
        
        // Emit change event
        component.events.emit('change', {
          value: option.value,
          originalEvent: e,
          option
        });
      }
    };
    
    input.addEventListener('change', handleChange);
    
    // Return radio item
    return {
      element: radioContainer,
      input,
      label,
      config: option,
      destroy: () => {
        input.removeEventListener('change', handleChange);
        if (radioContainer.parentNode) {
          radioContainer.parentNode.removeChild(radioContainer);
        }
      }
    };
  };
  
  /**
   * Adds a radio option to the radios component
   * @param {RadioOptionConfig} option - Radio option configuration
   * @returns {Component} The component for chaining
   */
  const addOption = (option: RadioOptionConfig) => {
    // Create radio item
    const radioItem = createRadioItem(option);
    
    // Add to DOM
    component.element.appendChild(radioItem.element);
    
    // Add to radios array
    radios.push(radioItem);
    
    return component;
  };
  
  /**
   * Removes a radio option from the radios component
   * @param {string} value - Value of the radio to remove
   * @returns {Component} The component for chaining
   */
  const removeOption = (value: string) => {
    const index = radios.findIndex(radio => radio.config.value === value);
    
    if (index !== -1) {
      // Get radio item
      const radioItem = radios[index];
      
      // Remove from DOM and cleanup
      radioItem.destroy();
      
      // Remove from array
      radios.splice(index, 1);
      
      // If we removed the selected value, reset the selection
      if (selectedValue === value) {
        selectedValue = '';
      }
    }
    
    return component;
  };
  
  // Initialize radios from config
  if (config.options && Array.isArray(config.options)) {
    config.options.forEach(option => addOption(option));
  }
  
  // Return enhanced component
  return {
    ...component,
    radios,
    
    getValue: () => selectedValue,
    
    setValue: (value: string) => {
      selectedValue = value;
      
      radios.forEach(radio => {
        radio.input.checked = radio.config.value === value;
      });
      
      return component;
    },
    
    getSelected: () => {
      const selected = radios.find(radio => radio.config.value === selectedValue);
      return selected ? selected.config : null;
    },
    
    addOption,
    removeOption,
    
    enable: () => {
      component.element.classList.remove(`${radiosClass}--disabled`);
      
      radios.forEach(radio => {
        radio.input.disabled = radio.config.disabled || false;
        if (!radio.config.disabled) {
          radio.element.classList.remove(`${radiosClass}-item--disabled`);
        }
      });
      
      return component;
    },
    
    disable: () => {
      component.element.classList.add(`${radiosClass}--disabled`);
      
      radios.forEach(radio => {
        radio.input.disabled = true;
        radio.element.classList.add(`${radiosClass}-item--disabled`);
      });
      
      return component;
    },
    
    enableOption: (value: string) => {
      const radio = radios.find(r => r.config.value === value);
      
      if (radio) {
        radio.config.disabled = false;
        radio.input.disabled = component.element.classList.contains(`${radiosClass}--disabled`);
        
        if (!radio.input.disabled) {
          radio.element.classList.remove(`${radiosClass}-item--disabled`);
        }
      }
      
      return component;
    },
    
    disableOption: (value: string) => {
      const radio = radios.find(r => r.config.value === value);
      
      if (radio) {
        radio.config.disabled = true;
        radio.input.disabled = true;
        radio.element.classList.add(`${radiosClass}-item--disabled`);
      }
      
      return component;
    }
  };
};

export default withRadio;