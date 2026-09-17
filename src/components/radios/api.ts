// src/components/radios/api.ts
import { RadiosComponent, RadioItem, RadioOptionConfig } from "./types";

interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithRadio {
  element: HTMLElement;
  radios: RadioItem[];
  getValue: () => string;
  setValue: (value: string) => void;
  getSelected: () => RadioOptionConfig | null;
  addOption: (option: RadioOptionConfig) => void;
  removeOption: (value: string) => void;
  enable: () => void;
  disable: () => void;
  enableOption: (value: string) => void;
  disableOption: (value: string) => void;
  getClass: (name: string) => string;
  on: (event: string, handler: Function) => void;
  off: (event: string, handler: Function) => void;
  emit?: (event: string, data: unknown) => void;
}

/**
 * Enhances a radios component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Radios component
 */
export const withAPI =
  ({ lifecycle }: ApiOptions) =>
  (component: ComponentWithRadio): RadiosComponent => {
    const radiosComponent: RadiosComponent = {
      element: component.element,
      radios: component.radios,
      lifecycle: {
        destroy: lifecycle.destroy,
      },

      getClass: component.getClass,
      getValue: () => component.getValue(),

      setValue(value: string) {
        component.setValue(value);
        return this;
      },

      getSelected: () => component.getSelected(),

      addOption(option: RadioOptionConfig) {
        component.addOption(option);
        return this;
      },

      removeOption(value: string) {
        component.removeOption(value);
        return this;
      },

      // The radio-level enable/disable reach every input and restore options
      // disabled on their own. The core disabled manager this used to call only
      // styled the root: the group looked disabled and every radio stayed usable.
      enable() {
        component.enable();
        return this;
      },

      disable() {
        component.disable();
        return this;
      },

      enableOption(value: string) {
        component.enableOption(value);
        return this;
      },

      disableOption(value: string) {
        component.disableOption(value);
        return this;
      },

      on(event: string, handler: Function) {
        component.on(event, handler);
        return this;
      },

      off(event: string, handler: Function) {
        component.off(event, handler);
        return this;
      },

      destroy() {
        // First destroy all radio items
        component.radios.forEach((radio) => radio.destroy());
        // Then destroy the component
        lifecycle.destroy();
      },
    };

    return radiosComponent;
  };
