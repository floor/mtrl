// src/core/compose/features/checkable.ts

import { BaseComponent } from '../component';

/**
 * Configuration for checkable feature
 */
export interface CheckableConfig {
  checked?: boolean;
  [key: string]: any;
}

/**
 * Component with input element
 */
export interface InputComponent extends BaseComponent {
  input: HTMLInputElement;
  emit?: (event: string, data: any) => InputComponent;
}

/**
 * Checkable state manager interface
 */
export interface CheckableManager {
  /**
   * Sets the checked state to true
   * Emits change event if state changes
   * @returns CheckableManager instance for chaining
   */
  check: () => CheckableManager;
  
  /**
   * Sets the checked state to false
   * Emits change event if state changes
   * @returns CheckableManager instance for chaining
   */
  uncheck: () => CheckableManager;
  
  /**
   * Toggles the current checked state
   * Always emits change event
   * @returns CheckableManager instance for chaining
   */
  toggle: () => CheckableManager;
  
  /**
   * Gets the current checked state
   * @returns Whether component is checked
   */
  isChecked: () => boolean;
}

/**
 * Component with checkable capabilities
 */
export interface CheckableComponent extends BaseComponent {
  checkable: CheckableManager;
}

/**
 * Adds checked state management to a component with an input
 * Manages visual state and event emission for checked changes
 *
 * @param config - Checkable configuration
 * @returns Function that enhances a component with checkable functionality
 */
export const withCheckable = <T extends CheckableConfig>(config: T = {} as T) => 
  <C extends InputComponent>(component: C): C & CheckableComponent => {
    if (!component.input) return component as C & CheckableComponent;

    /**
     * Updates component classes to reflect checked state
     */
    const updateStateClasses = (): void => {
      component.element.classList.toggle(
        `${component.getClass('switch')}--checked`,
        component.input.checked
      );
    };

    // Set initial state
    if (config.checked) {
      component.input.checked = true;
      updateStateClasses();
    }

    // Update classes whenever checked state changes
    if (component.emit) {
      component.on?.('change', updateStateClasses);
    }

    const checkable: CheckableManager = {
      /**
       * Sets the checked state to true
       * Emits change event if state changes
       * @returns CheckableManager instance for chaining
       */
      check() {
        if (!component.input.checked) {
          component.input.checked = true;
          updateStateClasses();
          component.emit?.('change', {
            checked: true,
            value: component.input.value
          });
        }
        return this;
      },

      /**
       * Sets the checked state to false
       * Emits change event if state changes
       * @returns CheckableManager instance for chaining
       */
      uncheck() {
        if (component.input.checked) {
          component.input.checked = false;
          updateStateClasses();
          component.emit?.('change', {
            checked: false,
            value: component.input.value
          });
        }
        return this;
      },

      /**
       * Toggles the current checked state
       * Always emits change event
       * @returns CheckableManager instance for chaining
       */
      toggle() {
        component.input.checked = !component.input.checked;
        updateStateClasses();
        component.emit?.('change', {
          checked: component.input.checked,
          value: component.input.value
        });
        return this;
      },

      /**
       * Gets the current checked state
       * @returns Whether component is checked
       */
      isChecked() {
        return component.input.checked;
      }
    };

    return {
      ...component,
      checkable
    };
  };