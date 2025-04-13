// src/components/select/api.ts
import { SelectComponent, ApiOptions, SelectOption } from './types';

/**
 * Enhances a select component with API methods
 * @param options - API configuration options
 * @returns Higher-order function that adds API methods to component
 * @internal
 */
export const withAPI = (options: ApiOptions) => 
  (component: any): SelectComponent => ({
    ...component,
    element: component.element,
    textfield: component.textfield,
    menu: component.menu,
    
    getValue: options.select.getValue,
    
    setValue(value: string): SelectComponent {
      options.select.setValue(value);
      return this;
    },
    
    getText: options.select.getText,
    
    getSelectedOption: options.select.getSelectedOption,
    
    getOptions: options.select.getOptions,
    
    setOptions(options: SelectOption[]): SelectComponent {
      options.select.setOptions(options);
      return this;
    },
    
    open(interactionType: 'mouse' | 'keyboard' = 'mouse'): SelectComponent {
      options.select.open(undefined, interactionType);
      return this;
    },
    
    close(): SelectComponent {
      options.select.close();
      return this;
    },
    
    isOpen: options.select.isOpen,
    
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
    
    destroy() {
      options.lifecycle.destroy();
    }
  });