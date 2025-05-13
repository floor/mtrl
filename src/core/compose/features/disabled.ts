// src/core/compose/features/disabled.ts

import { BaseComponent, ElementComponent } from '../component';

// Interface for components with input that can be disabled
interface ComponentWithInput extends ElementComponent {
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement;
}

// Type guard to check if component has a disableable input
function hasDisableableInput(component: any): component is ComponentWithInput {
  return 'input' in component && 
         component.input instanceof HTMLElement &&
         ('disabled' in component.input);
}

/**
 * Configuration for disabled feature
 */
export interface DisabledConfig {
  disabled?: boolean;
  componentName?: string;
  [key: string]: any;
}

/**
 * Disabled state manager interface
 */
export interface DisabledManager {
  /**
   * Enables the component
   * @returns DisabledManager instance for chaining
   */
  enable(): DisabledManager;
  
  /**
   * Disables the component
   * @returns DisabledManager instance for chaining
   */
  disable(): DisabledManager;
  
  /**
   * Toggles the disabled state
   * @returns DisabledManager instance for chaining
   */
  toggle(): DisabledManager;
  
  /**
   * Checks if the component is disabled
   * @returns true if disabled
   */
  isDisabled(): boolean;
}

/**
 * Component with disabled state capabilities
 */
export interface DisabledComponent extends BaseComponent {
  disabled: DisabledManager;
}

/**
 * Adds disabled state management to a component
 * 
 * @param config - Configuration object
 * @returns Function that enhances a component with disabled state management
 */
export const withDisabled = <T extends DisabledConfig>(config: T) => 
  <C extends ElementComponent>(component: C): C & DisabledComponent => {
    // Get the disabled class based on component name
    const disabledClass = `${component.getClass(config.componentName || component.componentName || 'component')}--disabled`;

    // Directly implement disabled functionality
    const disabled: DisabledManager = {
      enable() {
        component.element.classList.remove(disabledClass);
        
        if (hasDisableableInput(component)) {
          component.input.disabled = false;
          component.input.removeAttribute('disabled');
        } else {
          // If component doesn't have an input, try to disable the main element
          // This only works if the element is a button, input, etc.
          const interactiveElement = component.element as HTMLButtonElement;
          if ('disabled' in interactiveElement) {
            interactiveElement.disabled = false;
          }
          component.element.removeAttribute('disabled');
        }
        
        return this;
      },

      disable() {
        component.element.classList.add(disabledClass);
        
        if (hasDisableableInput(component)) {
          component.input.disabled = true;
          component.input.setAttribute('disabled', 'true');
        } else {
          // If component doesn't have an input, try to disable the main element
          const interactiveElement = component.element as HTMLButtonElement;
          if ('disabled' in interactiveElement) {
            interactiveElement.disabled = true;
          }
          component.element.setAttribute('disabled', 'true');
        }
        
        return this;
      },

      toggle() {
        if (this.isDisabled()) {
          this.enable();
        } else {
          this.disable();
        }
        return this;
      },

      isDisabled() {
        if (hasDisableableInput(component)) {
          return component.input.disabled;
        }
        
        // Check if element itself is disabled
        const interactiveElement = component.element as HTMLButtonElement;
        return ('disabled' in interactiveElement) && interactiveElement.disabled;
      }
    };

    // Initialize disabled state if configured
    if (config.disabled) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        disabled.disable();
      });
    }

    return {
      ...component,
      disabled
    };
  };