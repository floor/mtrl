// src/core/compose/features/disabled.ts

import { BaseComponent, ElementComponent } from '../component';

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
        if ('input' in component && component.input instanceof HTMLElement) {
          component.input.disabled = false;
          component.input.removeAttribute('disabled');
        } else {
          (component.element as HTMLButtonElement).disabled = false;
          component.element.removeAttribute('disabled');
        }
        return this;
      },

      disable() {
        component.element.classList.add(disabledClass);
        if ('input' in component && component.input instanceof HTMLElement) {
          component.input.disabled = true;
          component.input.setAttribute('disabled', 'true');
        } else {
          (component.element as HTMLButtonElement).disabled = true;
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
        if ('input' in component && component.input instanceof HTMLElement) {
          return component.input.disabled;
        }
        return (component.element as HTMLButtonElement).disabled;
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