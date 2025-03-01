// src/core/state/disabled.ts

/**
 * Disabled state manager interface
 */
export interface DisabledState {
  /**
   * Enables the element
   * @returns DisabledState instance for chaining
   */
  enable(): DisabledState;
  
  /**
   * Disables the element
   * @returns DisabledState instance for chaining
   */
  disable(): DisabledState;
  
  /**
   * Toggles the disabled state
   * @returns DisabledState instance for chaining
   */
  toggle(): DisabledState;
  
  /**
   * Checks if the element is disabled
   * @returns true if disabled
   */
  isDisabled(): boolean;
}

/**
 * Creates a controller for managing the disabled state of an element
 * 
 * @param element - The element to control
 * @returns Disabled state controller
 */
export const createDisabled = (element: HTMLElement): DisabledState => {
  return {
    /**
     * Enables the element
     * @returns DisabledState instance for chaining
     */
    enable() {
      (element as HTMLButtonElement | HTMLInputElement).disabled = false;
      element.removeAttribute('disabled');
      return this;
    },

    /**
     * Disables the element
     * @returns DisabledState instance for chaining
     */
    disable() {
      (element as HTMLButtonElement | HTMLInputElement).disabled = true;
      element.setAttribute('disabled', 'true');
      return this;
    },

    /**
     * Toggles the disabled state
     * @returns DisabledState instance for chaining
     */
    toggle() {
      if ((element as HTMLButtonElement | HTMLInputElement).disabled) {
        this.enable();
      } else {
        this.disable();
      }
      return this;
    },

    /**
     * Checks if the element is disabled
     * @returns true if disabled
     */
    isDisabled() {
      return (element as HTMLButtonElement | HTMLInputElement).disabled === true;
    }
  };
};