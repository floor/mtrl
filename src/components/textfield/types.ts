// src/components/textfield/types.ts

/**
 * Available Textfield variants
 */
export type TextfieldVariant = 'filled' | 'outlined';

/**
 * Available Textfield states
 */
export type TextfieldStates = 'active' | 'inactive' | 'disabled';

/**
 * Available Textfield types
 */
export type TextfieldTypes = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'multiline';

/**
 * Configuration interface for the Textfield component
 */
export interface TextfieldConfig {
  /** Input type (text, password, email, etc.) */
  type?: TextfieldTypes | string;
  
  /** Visual variant (filled, outlined) */
  variant?: TextfieldVariant | string;
  
  /** Input name attribute */
  name?: string;
  
  /** Label text */
  label?: string;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Initial value */
  value?: string;
  
  /** Whether input is required */
  required?: boolean;
  
  /** Whether textfield is disabled */
  disabled?: boolean;
  
  /** Maximum input length */
  maxLength?: number;
  
  /** Input pattern for validation */
  pattern?: string;
  
  /** Autocomplete attribute */
  autocomplete?: string;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Prefix for class names */
  prefix?: string;
  
  /** Component name */
  componentName?: string;
}

/**
 * Textfield component interface
 */
export interface TextfieldComponent {
  /** The root element of the textfield */
  element: HTMLElement;
  
  /** The input element */
  input: HTMLInputElement | HTMLTextAreaElement;
  
  /** Gets the textfield's value */
  getValue: () => string;
  
  /** Sets the textfield's value */
  setValue: (value: string) => TextfieldComponent;
  
  /** Sets an attribute on the input element */
  setAttribute: (name: string, value: string) => TextfieldComponent;
  
  /** Gets an attribute from the input element */
  getAttribute: (name: string) => string | null;
  
  /** Removes an attribute from the input element */
  removeAttribute: (name: string) => TextfieldComponent;
  
  /** Sets the textfield's label text */
  setLabel: (text: string) => TextfieldComponent;
  
  /** Gets the textfield's label text */
  getLabel: () => string;
  
  /** Adds event listener */
  on: (event: string, handler: Function) => TextfieldComponent;
  
  /** Removes event listener */
  off: (event: string, handler: Function) => TextfieldComponent;
  
  /** Enables the textfield */
  enable: () => TextfieldComponent;
  
  /** Disables the textfield */
  disable: () => TextfieldComponent;
  
  /** Destroys the textfield component and cleans up resources */
  destroy: () => void;
}

/**
 * API options interface
 */
export interface ApiOptions {
  disabled: {
    enable: () => any;
    disable: () => any;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Base component interface
 */
export interface BaseComponent {
  element: HTMLElement;
  input?: HTMLInputElement | HTMLTextAreaElement;
  getValue?: () => string;
  setValue?: (value: string) => any;
  setAttribute?: (name: string, value: string) => any;
  getAttribute?: (name: string) => string | null;
  removeAttribute?: (name: string) => any;
  label?: {
    setText: (content: string) => any;
    getText: () => string;
  };
  on?: (event: string, handler: Function) => any;
  off?: (event: string, handler: Function) => any;
  disabled?: {
    enable: () => any;
    disable: () => any;
  };
  lifecycle?: {
    destroy: () => void;
  };
  [key: string]: any;
}