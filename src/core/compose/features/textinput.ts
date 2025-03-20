// src/core/compose/features/textinput.ts

import { BaseComponent, ElementComponent } from '../component';

/**
 * Configuration for text input feature
 */
export interface TextInputConfig {
  /**
   * Input type (text, password, etc.)
   */
  type?: string;
  
  /**
   * Whether to use textarea instead of input
   */
  multiline?: boolean;
  
  /**
   * Input name attribute
   */
  name?: string;
  
  /**
   * Whether input is required
   */
  required?: boolean;
  
  /**
   * Whether input is disabled
   */
  disabled?: boolean;
  
  /**
   * Maximum allowed length
   */
  maxLength?: number;
  
  /**
   * Input validation pattern
   */
  pattern?: string;
  
  /**
   * Autocomplete setting
   */
  autocomplete?: string;
  
  /**
   * Initial input value
   */
  value?: string;
  
  [key: string]: any;
}

/**
 * Component with text input capabilities
 */
export interface TextInputComponent extends ElementComponent {
  /**
   * Input element
   */
  input: HTMLInputElement | HTMLTextAreaElement;
  
  /**
   * Sets the input value
   * @param value - Value to set
   * @returns Component instance for chaining
   */
  setValue: (value: string) => TextInputComponent;
  
  /**
   * Gets the current input value
   * @returns Current value
   */
  getValue: () => string;
  
  /**
   * Sets an attribute on the input
   * @param name - Attribute name
   * @param value - Attribute value
   * @returns Component instance for chaining
   */
  setAttribute: (name: string, value: string) => TextInputComponent;
  
  /**
   * Gets an attribute from the input
   * @param name - Attribute name
   * @returns Attribute value
   */
  getAttribute: (name: string) => string | null;
  
  /**
   * Removes an attribute from the input
   * @param name - Attribute name
   * @returns Component instance for chaining
   */
  removeAttribute: (name: string) => TextInputComponent;
  
  /**
   * Event emission method if available
   */
  emit?: (event: string, data: any) => TextInputComponent;
}

/**
 * Enhances a component with text input functionality
 * 
 * @param config - Text input configuration
 * @returns Function that enhances a component with text input capabilities
 */
export const withTextInput = <T extends TextInputConfig>(config: T = {} as T) => 
  <C extends ElementComponent>(component: C): C & TextInputComponent => {
    const isMultiline = config.multiline || config.type === 'multiline';
    const input = document.createElement(isMultiline ? 'textarea' : 'input') as 
      HTMLInputElement | HTMLTextAreaElement;
    
    input.className = `${component.getClass('textfield')}-input`;

    // Set input attributes
    const attributes: Record<string, string | number | boolean | undefined> = {
      name: config.name,
      required: config.required,
      disabled: config.disabled,
      maxLength: config.maxLength,
      pattern: config.pattern,
      autocomplete: config.autocomplete,
      value: config.value || ''
    };

    // Only set type attribute for input elements, not for textarea
    if (!isMultiline) {
      attributes.type = config.type || 'text';
    } else {
      // For textarea, add a data attribute to identify it as multiline
      attributes['data-type'] = 'multiline';
    }

    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'boolean') {
          if (value) {
            input.setAttribute(key, '');
          }
        } else {
          input.setAttribute(key, String(value));
        }
      }
    });

    // Handle input state changes
    const updateInputState = (): boolean => {
      const isEmpty = !input.value;
      component.element.classList.toggle(`${component.getClass('textfield')}--empty`, isEmpty);
      return isEmpty;
    };

    // Detect autofill using input events instead of animation
    // This is more compatible with our testing environment
    const handleAutofill = (): void => {
      // Check for webkit autofill background
      const isAutofilled =
        input.matches(':-webkit-autofill') ||
        // For Firefox and other browsers
        (window.getComputedStyle(input).backgroundColor === 'rgb(250, 255, 189)' ||
         window.getComputedStyle(input).backgroundColor === 'rgb(232, 240, 254)');

      if (isAutofilled) {
        component.element.classList.remove(`${component.getClass('textfield')}--empty`);
        component.emit?.('input', { value: input.value, isEmpty: false, isAutofilled: true });
      }
    };

    // Event listeners
    input.addEventListener('focus', () => {
      component.element.classList.add(`${component.getClass('textfield')}--focused`);
      component.emit?.('focus', { isEmpty: updateInputState() });
      // Also check for autofill on focus
      setTimeout(handleAutofill, 100);
    });

    input.addEventListener('blur', () => {
      component.element.classList.remove(`${component.getClass('textfield')}--focused`);
      component.emit?.('blur', { isEmpty: updateInputState() });
    });

    input.addEventListener('input', () => {
      component.emit?.('input', {
        value: input.value,
        isEmpty: updateInputState(),
        isAutofilled: false
      });
    });

    // Initial state
    updateInputState();

    // Add multiline class to the component if it's a textarea
    if (isMultiline) {
      component.element.classList.add(`${component.getClass('textfield')}--multiline`);
    }

    component.element.appendChild(input);

    // Cleanup
    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        input.remove();
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      input,
      setValue(value: string) {
        input.value = value || '';
        updateInputState();
        return this;
      },
      getValue() {
        return input.value;
      },
      setAttribute(name: string, value: string) {
        input.setAttribute(name, value);
        return this;
      },
      getAttribute(name: string) {
        return input.getAttribute(name);
      },
      removeAttribute(name: string) {
        input.removeAttribute(name);
        return this;
      }
    };
  };