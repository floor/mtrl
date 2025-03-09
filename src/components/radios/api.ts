// src/components/radios/api.ts
import { RadiosComponent } from './types';

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
  radios: any[];
  getValue: () => string;
  setValue: (value: string) => any;
  getSelected: () => any;
  addOption: (option: any) => any;
  removeOption: (value: string) => any;
  enable: () => any;
  disable: () => any;
  enableOption: (value: string) => any;
  disableOption: (value: string) => any;
  getClass: (name: string) => string;
  events: {
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    emit?: (event: string, data: any) => void;
  };
}

/**
 * Enhances a radios component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Radios component
 */
export const withAPI = ({ disabled, lifecycle }: ApiOptions) => 
  (component: ComponentWithRadio): RadiosComponent => {
    // Ensure component has events
    if (!component.events) {
      component.events = {
        on: (event, handler) => {
          component.element.addEventListener(event, (e) => handler(e.detail));
        },
        off: (event, handler) => {
          component.element.removeEventListener(event, handler);
        },
        emit: (event, data) => {
          const customEvent = new CustomEvent(event, { detail: data });
          component.element.dispatchEvent(customEvent);
        }
      };
    } else if (!component.events.emit) {
      // Add emit method if not present
      component.events.emit = (event, data) => {
        const customEvent = new CustomEvent(event, { detail: data });
        component.element.dispatchEvent(customEvent);
      };
    }
    
    return {
      ...component as any,
      element: component.element,
      radios: component.radios,
      
      getValue: () => component.getValue(),
      
      setValue(value: string) {
        component.setValue(value);
        return this;
      },
      
      getSelected: () => component.getSelected(),
      
      addOption(option) {
        component.addOption(option);
        return this;
      },
      
      removeOption(value: string) {
        component.removeOption(value);
        return this;
      },
      
      enable() {
        disabled.enable();
        return this;
      },
      
      disable() {
        disabled.disable();
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
        component.events.on(event, handler);
        return this;
      },
      
      off(event: string, handler: Function) {
        component.events.off(event, handler);
        return this;
      },
      
      destroy() {
        // First destroy all radio items
        component.radios.forEach(radio => radio.destroy());
        // Then destroy the component
        lifecycle.destroy();
      }
    };
  };