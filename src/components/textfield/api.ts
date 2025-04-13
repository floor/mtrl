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
    
    // Leading icon management (if present)
    leadingIcon: component.leadingIcon || null,
    setLeadingIcon(html: string): TextfieldComponent {
      if (component.setLeadingIcon) {
        component.setLeadingIcon(html);
      }
      return this;
    },
    
    removeLeadingIcon(): TextfieldComponent {
      if (component.removeLeadingIcon) {
        component.removeLeadingIcon();
      }
      return this;
    },
    
    // Trailing icon management (if present)
    trailingIcon: component.trailingIcon || null,
    setTrailingIcon(html: string): TextfieldComponent {
      if (component.setTrailingIcon) {
        component.setTrailingIcon(html);
      }
      return this;
    },
    
    removeTrailingIcon(): TextfieldComponent {
      if (component.removeTrailingIcon) {
        component.removeTrailingIcon();
      }
      return this;
    },
    
    // Supporting text management (if present)
    supportingTextElement: component.supportingTextElement || null,
    setSupportingText(text: string, isError?: boolean): TextfieldComponent {
      if (component.setSupportingText) {
        component.setSupportingText(text, isError);
      }
      return this;
    },
    
    removeSupportingText(): TextfieldComponent {
      if (component.removeSupportingText) {
        component.removeSupportingText();
      }
      return this;
    },
    
    // Prefix text management (if present)
    prefixTextElement: component.prefixTextElement || null,
    setPrefixText(text: string): TextfieldComponent {
      if (component.setPrefixText) {
        component.setPrefixText(text);
      }
      return this;
    },
    
    removePrefixText(): TextfieldComponent {
      if (component.removePrefixText) {
        component.removePrefixText();
      }
      return this;
    },
    
    // Suffix text management (if present)
    suffixTextElement: component.suffixTextElement || null,
    setSuffixText(text: string): TextfieldComponent {
      if (component.setSuffixText) {
        component.setSuffixText(text);
      }
      return this;
    },
    
    removeSuffixText(): TextfieldComponent {
      if (component.removeSuffixText) {
        component.removeSuffixText();
      }
      return this;
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