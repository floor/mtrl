// src/components/checkbox/types.ts
import { CHECKBOX_VARIANTS, CHECKBOX_LABEL_POSITION } from './constants';

/**
 * Configuration interface for the Checkbox component
 */
export interface CheckboxConfig {
  /** Input name attribute */
  name?: string;
  
  /** Initial checked state */
  checked?: boolean;
  
  /** Initial indeterminate state */
  indeterminate?: boolean;
  
  /** Whether input is required */
  required?: boolean;
  
  /** Whether checkbox is disabled */
  disabled?: boolean;
  
  /** Input value attribute */
  value?: string;
  
  /** Label text */
  label?: string;
  
  /** Label position (start/end) */
  labelPosition?: keyof typeof CHECKBOX_LABEL_POSITION | string;
  
  /** Visual variant */
  variant?: keyof typeof CHECKBOX_VARIANTS | string;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Prefix for class names */
  prefix?: string;
  
  /** Component name */
  componentName?: string;
}

/**
 * Checkbox component interface
 */
export interface CheckboxComponent {
  /** The root element of the checkbox */
  element: HTMLElement;
  
  /** The input element */
  input: HTMLInputElement;
  
  /** Gets the checkbox's value */
  getValue: () => string;
  
  /** Sets the checkbox's value */
  setValue: (value: string) => CheckboxComponent;
  
  /** Checks the checkbox */
  check: () => CheckboxComponent;
  
  /** Unchecks the checkbox */
  uncheck: () => CheckboxComponent;
  
  /** Toggles the checkbox's checked state */
  toggle: () => CheckboxComponent;
  
  /** Returns whether the checkbox is checked */
  isChecked: () => boolean;
  
  /** Sets the checkbox's indeterminate state */
  setIndeterminate: (state: boolean) => CheckboxComponent;
  
  /** Sets the checkbox's label text */
  setLabel: (text: string) => CheckboxComponent;
  
  /** Gets the checkbox's label text */
  getLabel: () => string;
  
  /** Adds event listener */
  on: (event: string, handler: Function) => CheckboxComponent;
  
  /** Removes event listener */
  off: (event: string, handler: Function) => CheckboxComponent;
  
  /** Enables the checkbox */
  enable: () => CheckboxComponent;
  
  /** Disables the checkbox */
  disable: () => CheckboxComponent;
  
  /** Destroys the checkbox component and cleans up resources */
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
  checkable: {
    check: () => any;
    uncheck: () => any;
    toggle: () => any;
    isChecked: () => boolean;
  };
}

/**
 * Base component interface
 */
export interface BaseComponent {
  element: HTMLElement;
  input?: HTMLInputElement;
  getValue?: () => string;
  setValue?: (value: string) => any;
  setIndeterminate?: (state: boolean) => any;
  text?: {
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
  checkable?: {
    check: () => any;
    uncheck: () => any;
    toggle: () => any;
    isChecked: () => boolean;
  };
  [key: string]: any;
}