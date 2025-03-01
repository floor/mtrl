// src/components/textfield/api.ts
import { BaseComponent, TextfieldComponent, ApiOptions } from './types';

/**
 * Enhances textfield component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI = ({ disabled, lifecycle }: ApiOptions) => 
  (component: BaseComponent): TextfieldComponent => ({
    ...component as any,
    element: component.element,
    input: component.input as HTMLInputElement | HTMLTextAreaElement,

    // Value management
    getValue: component.getValue || (() => ''),
    setValue(value: string): TextfieldComponent {
      component.setValue?.(value);
      return this;
    },

    // Attributes API
    setAttribute(name: string, value: string): TextfieldComponent {
      component.setAttribute?.(name, value);
      return this;
    },
    
    getAttribute(name: string): string | null {
      return component.getAttribute?.(name) || null;
    },
    
    removeAttribute(name: string): TextfieldComponent {
      component.removeAttribute?.(name);
      return this;
    },

    // Label management
    setLabel(text: string): TextfieldComponent {
      component.label?.setText(text);
      return this;
    },
    
    getLabel(): string {
      return component.label?.getText() || '';
    },

    // Event handling
    on(event: string, handler: Function): TextfieldComponent {
      component.on?.(event, handler);
      return this;
    },
    
    off(event: string, handler: Function): TextfieldComponent {
      component.off?.(event, handler);
      return this;
    },

    // State management
    enable(): TextfieldComponent {
      disabled.enable();
      return this;
    },
    
    disable(): TextfieldComponent {
      disabled.disable();
      return this;
    },
    
    destroy(): void {
      lifecycle.destroy();
    }
  });