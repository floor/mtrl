// src/components/checkbox/api.ts
import { BaseComponent, CheckboxComponent, ApiOptions } from "./types";

/**
 * Enhances checkbox component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI =
  ({ disabled, lifecycle, checkable }: ApiOptions) =>
  (component: BaseComponent): CheckboxComponent => ({
    ...(component as any),
    element: component.element,
    input: component.input as HTMLInputElement,

    // Value management - returns boolean checked state for form compatibility
    getValue(): boolean {
      return checkable.isChecked();
    },

    setValue(value: boolean | string): CheckboxComponent {
      // Handle boolean values
      if (typeof value === "boolean") {
        if (value) {
          checkable.check();
        } else {
          checkable.uncheck();
        }
      }
      // Handle string values ("true", "false", "1", "0")
      else if (typeof value === "string") {
        const shouldCheck = value === "true" || value === "1";
        if (shouldCheck) {
          checkable.check();
        } else {
          checkable.uncheck();
        }
      }
      return this;
    },

    // HTML value attribute access (for rare cases where you need the input's value attribute)
    getValueAttribute(): string {
      return component.input?.value || "";
    },

    setValueAttribute(value: string): CheckboxComponent {
      if (component.input) {
        component.input.value = value;
      }
      return this;
    },

    // State management
    check(): CheckboxComponent {
      checkable.check();
      return this;
    },

    uncheck(): CheckboxComponent {
      checkable.uncheck();
      return this;
    },

    toggle(): CheckboxComponent {
      checkable.toggle();
      return this;
    },

    isChecked(): boolean {
      return checkable.isChecked();
    },

    setIndeterminate(state: boolean): CheckboxComponent {
      component.setIndeterminate?.(state);
      return this;
    },

    // Label management
    setLabel(text: string): CheckboxComponent {
      component.text?.setText(text);
      return this;
    },

    getLabel(): string {
      return component.text?.getText() || "";
    },

    // Event handling
    on(event: string, handler: Function): CheckboxComponent {
      component.on?.(event, handler);
      return this;
    },

    off(event: string, handler: Function): CheckboxComponent {
      component.off?.(event, handler);
      return this;
    },

    // State management
    enable(): CheckboxComponent {
      disabled.enable();
      return this;
    },

    disable(): CheckboxComponent {
      disabled.disable();
      return this;
    },

    destroy(): void {
      lifecycle.destroy();
    },
  });
