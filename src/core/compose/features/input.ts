// src/core/compose/features/input.ts

import { BaseComponent, ElementComponent } from '../component';

/**
 * Input configuration options
 */
export interface InputConfig {
  /**
   * Input name attribute
   */
  name?: string;
  
  /**
   * Initial checked state
   */
  checked?: boolean;
  
  /**
   * Whether input is required
   */
  required?: boolean;
  
  /**
   * Whether input is disabled
   */
  disabled?: boolean;
  
  /**
   * Input value attribute
   */
  value?: string;
  
  /**
   * Accessibility label text
   */
  label?: string;
  
  /**
   * Alternative accessibility label
   */
  ariaLabel?: string;
  
  /**
   * Component name for classes
   */
  componentName?: string;
  
  [key: string]: any;
}

/**
 * Interface for components with emit capability
 */
interface ComponentWithEmit extends ElementComponent {
  emit: (event: string, data: any) => any;
}

/**
 * Type guard to check if a component has emit capability
 */
function hasEmit(component: any): component is ComponentWithEmit {
  return 'emit' in component && typeof component.emit === 'function';
}

/**
 * Component with input element and related methods
 */
export interface InputComponent extends ElementComponent {
  /**
   * Input element
   */
  input: HTMLInputElement;
  
  /**
   * Gets the current input value
   * @returns Current value
   */
  getValue: () => string;
  
  /**
   * Sets the input value and emits a value event
   * @param value - New value to set
   * @returns Component instance for chaining
   */
  setValue: (value: string) => InputComponent;
  
  /**
   * Event emission method if available
   */
  emit?: (event: string, data: any) => InputComponent;
}

/**
 * Creates an input element and adds it to a component
 * Handles both input creation and event emission for state changes
 *
 * @param config - Input configuration
 * @returns Function that enhances a component with input functionality
 */
export const withInput = <T extends InputConfig>(config: T = {} as T) => 
  <C extends ElementComponent>(component: C): C & InputComponent => {
    const input = document.createElement('input');
    const name = component.componentName || 'component';
    input.type = 'checkbox';
    input.className = `${component.getClass(name)}-input`;

    // Ensure input can receive focus
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.cursor = 'pointer';
    // Don't use display: none or visibility: hidden as they prevent focus

    // The input itself should be focusable, not the wrapper
    component.element.setAttribute('role', 'presentation');
    input.setAttribute('role', name);

    const attributes: Record<string, string | boolean | undefined> = {
      name: config.name,
      checked: config.checked,
      required: config.required,
      disabled: config.disabled,
      value: config.value || 'on',
      'aria-label': config.label || config.ariaLabel
    };

    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'disabled' && value === true) {
          input.disabled = true;
          input.setAttribute('disabled', 'true');
          // Note: We don't add the class here because that's handled by withDisabled
        } else if (value === true) {
          input.setAttribute(key, key);
        } else {
          input.setAttribute(key, String(value));
        }
      }
    });

    // Bridge native checkbox events to our event system
    input.addEventListener('change', (event) => {
      if (hasEmit(component)) {
        component.emit('change', {
          checked: input.checked,
          value: input.value,
          nativeEvent: event
        });
      }
    });

    // Add keyboard handling
    input.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!input.disabled) {
          input.checked = !input.checked;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });

    component.element.appendChild(input);

    return {
      ...component,
      input,

      /**
       * Gets the current input value
       * @returns Current value
       */
      getValue: () => input.value,

      /**
       * Sets the input value and emits a value event
       * @param value - New value to set
       * @returns Component instance for chaining
       */
      setValue(value: string) {
        input.value = value;
        if (hasEmit(component)) {
          component.emit('value', { value });
        }
        return this;
      }
    };
  };