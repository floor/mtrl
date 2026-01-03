// src/components/switch/api.ts
import { BaseComponent, SwitchComponent, ApiOptions } from "./types";

/**
 * Enhances switch component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI =
  ({ disabled, lifecycle, checkable }: ApiOptions) =>
  (component: BaseComponent): SwitchComponent => ({
    ...component,
    element: component.element,
    input: component.input as HTMLInputElement,

    // Value management - returns boolean checked state for form compatibility
    getValue(): boolean {
      return checkable.isChecked();
    },

    setValue(value: boolean | string): SwitchComponent {
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

    setValueAttribute(value: string): SwitchComponent {
      if (component.input) {
        component.input.value = value;
      }
      return this;
    },

    // State management
    check(): SwitchComponent {
      checkable.check();
      return this;
    },

    uncheck(): SwitchComponent {
      checkable.uncheck();
      return this;
    },

    toggle(): SwitchComponent {
      checkable.toggle();
      return this;
    },

    isChecked(): boolean {
      return checkable.isChecked();
    },

    // Label management
    setLabel(text: string): SwitchComponent {
      component.text?.setText(text);
      return this;
    },

    getLabel(): string {
      return component.text?.getText() || "";
    },

    // Supporting text management (if present)
    supportingTextElement: component.supportingTextElement || null,
    setSupportingText(text: string, isError?: boolean): SwitchComponent {
      if (component.setSupportingText) {
        component.setSupportingText(text, isError);
      }
      return this;
    },

    removeSupportingText(): SwitchComponent {
      if (component.removeSupportingText) {
        component.removeSupportingText();
      }
      return this;
    },

    // Event handling
    on(event: string, handler: Function): SwitchComponent {
      component.on?.(event, handler);
      return this;
    },

    off(event: string, handler: Function): SwitchComponent {
      component.off?.(event, handler);
      return this;
    },

    // State management
    enable(): SwitchComponent {
      disabled.enable();
      return this;
    },

    disable(): SwitchComponent {
      disabled.disable();
      return this;
    },

    destroy(): void {
      lifecycle.destroy();
    },
  });
