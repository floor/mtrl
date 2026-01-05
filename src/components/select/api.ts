// src/components/select/api.ts
import { SelectComponent, ApiOptions, SelectOption } from "./types";

/**
 * Enhances a select component with API methods
 * @param options - API configuration options
 * @returns Higher-order function that adds API methods to component
 * @internal
 */
export const withAPI =
  (options: ApiOptions) =>
  (component: any): SelectComponent => ({
    ...component,
    element: component.element,
    textfield: component.textfield,
    menu: component.menu,

    getValue: options.select.getValue,

    setValue(value: string | null | undefined): SelectComponent {
      options.select.setValue(value);
      return this;
    },

    clear(): SelectComponent {
      options.select.clear();
      return this;
    },

    getText: options.select.getText,

    getSelectedOption: options.select.getSelectedOption,

    getOptions: options.select.getOptions,

    setOptions(newOptions: SelectOption[]): SelectComponent {
      options.select.setOptions(newOptions);
      return this;
    },

    open(interactionType: "mouse" | "keyboard" = "mouse"): SelectComponent {
      if (component.menu && typeof component.menu.open === "function") {
        component.menu.open(undefined, interactionType);
      } else {
        options.select.open();
      }
      return this;
    },

    close(): SelectComponent {
      options.select.close();
      return this;
    },

    isOpen: options.select.isOpen,

    setDensity(density: string): SelectComponent {
      // Delegate to the textfield's setDensity method
      if (component.textfield?.setDensity) {
        component.textfield.setDensity(density);
      }
      return this;
    },

    getDensity(): string {
      // Delegate to the textfield's getDensity method
      if (component.textfield?.getDensity) {
        return component.textfield.getDensity();
      }
      return "default";
    },

    on(event, handler) {
      if (options.events?.on) {
        options.events.on(event, handler);
      } else if (component.on) {
        component.on(event, handler);
      }
      return this;
    },

    off(event, handler) {
      if (options.events?.off) {
        options.events.off(event, handler);
      } else if (component.off) {
        component.off(event, handler);
      }
      return this;
    },

    enable(): SelectComponent {
      options.disabled.enable();
      return this;
    },

    disable(): SelectComponent {
      options.disabled.disable();
      return this;
    },

    setError(error: boolean, message?: string): SelectComponent {
      // Delegate to the textfield's setError method
      if (component.textfield?.setError) {
        component.textfield.setError(error, message);
      }
      return this;
    },

    clearError(): SelectComponent {
      // Clear error state on textfield
      if (component.textfield?.setError) {
        component.textfield.setError(false);
      }
      return this;
    },

    destroy() {
      options.lifecycle.destroy();
    },
  });
