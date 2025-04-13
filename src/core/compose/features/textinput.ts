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
   * Minimum number of rows for textarea
   */
  rows?: number;
  
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
 * Creates either an input or textarea element based on config
 * 
 * @param config - Text input configuration
 * @returns Function that enhances a component with text input capabilities
 */
export const withTextInput = <T extends TextInputConfig>(config: T = {} as T) => 
  <C extends ElementComponent>(component: C): C & TextInputComponent => {
    const isMultiline = config.multiline || config.type === 'multiline';
    const input = document.createElement(isMultiline ? 'textarea' : 'input') as 
      HTMLInputElement | HTMLTextAreaElement;
    
    const prefix = config.prefix || 'mtrl';
    const componentName = config.componentName || 'component';
    input.className = `${prefix}-${componentName}-input`;

    // Set input attributes
    const attributes: Record<string, string | number | boolean | undefined> = {
      name: config.name,
      required: config.required,
      disabled: config.disabled,
      maxLength: config.maxLength,
      autocomplete: config.autocomplete,
      value: config.value || ''
    };

    // Only set type attribute for input elements, not for textarea
    if (!isMultiline) {
      attributes.type = config.type || 'text';
    } else {
      // For textarea, add rows attribute if specified
      if (config.rows) {
        (input as HTMLTextAreaElement).rows = config.rows;
      }
      
      // For textarea, set data-type attribute to identify it as multiline
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
      component.element.classList.toggle(`${prefix}-${componentName}--empty`, isEmpty);
      return isEmpty;
    };

    // Detect autofill using input events
    const handleAutofill = (): void => {
      // Check for webkit autofill background
      const isAutofilled =
        input.matches(':-webkit-autofill') ||
        // For Firefox and other browsers
        (window.getComputedStyle(input).backgroundColor === 'rgb(250, 255, 189)' ||
         window.getComputedStyle(input).backgroundColor === 'rgb(232, 240, 254)');

      if (isAutofilled) {
        component.element.classList.remove(`${prefix}-${componentName}--empty`);
        component.emit?.('input', { value: input.value, isEmpty: false, isAutofilled: true });
      }
    };

    // Event listeners
    input.addEventListener('focus', () => {
      component.element.classList.add(`${prefix}-${componentName}--focused`);
      component.emit?.('focus', { isEmpty: updateInputState() });
      // Also check for autofill on focus
      setTimeout(handleAutofill, 100);
    });

    input.addEventListener('blur', () => {
      component.element.classList.remove(`${prefix}-${componentName}--focused`);
      component.emit?.('blur', { isEmpty: updateInputState() });
    });

    input.addEventListener('input', () => {
      // Special handling for multiline with preserving line breaks
      const value = isMultiline ? input.value : input.value;
      
      component.emit?.('input', {
        value,
        isEmpty: updateInputState(),
        isAutofilled: false
      });
    });

    // Initial state
    updateInputState();

    // Add multiline class to the component if it's a textarea
    if (isMultiline) {
      component.element.classList.add(`${prefix}-${componentName}--multiline`);
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
        if (isMultiline && input instanceof HTMLTextAreaElement) {
          // For textarea, preserve line breaks
          input.value = value || '';
        } else {
          input.value = value || '';
        }
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