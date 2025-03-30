// src/components/switch/api.ts
import { BaseComponent, SwitchComponent, ApiOptions } from './types';

/**
 * Enhances switch component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI = ({ disabled, lifecycle, checkable }: ApiOptions) => 
  (component: BaseComponent): SwitchComponent => ({
    ...component as any,
    element: component.element,
    input: component.input as HTMLInputElement,

    // Value management
    getValue: component.getValue || (() => ''),
    setValue(value: string): SwitchComponent {
      component.setValue?.(value);
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
      return component.text?.getText() || '';
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
    }
  });