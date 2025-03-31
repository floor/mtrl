// src/components/switch/types.ts

export type SwitchPosition = 'center' | 'start' | 'end';

/**
 * Configuration interface for the Switch component
 */
export interface SwitchConfig {
  /** Input name attribute */
  name?: string;
  
  /** Initial checked state */
  checked?: boolean;
  
  /** Whether input is required */
  required?: boolean;
  
  /** Whether switch is disabled */
  disabled?: boolean;
  
  /** Input value attribute */
  value?: string;
  
  /** Label text */
  label?: string;
  
  /** Supporting text content */
  supportingText?: string;
  
  /** Whether supporting text indicates an error */
  error?: boolean;
  
  /** Additional CSS classes */
  class?: string;
  
  /** ARIA label for accessibility */
  ariaLabel?: string;
  
  /** Prefix for class names */
  prefix?: string;
  
  /** Component name */
  componentName?: string;
  
  /** Icon HTML content */
  icon?: string;
}

/**
 * Switch component interface
 */
export interface SwitchComponent {
  /** The root element of the switch */
  element: HTMLElement;
  
  /** The input element */
  input: HTMLInputElement;
  
  /** Gets the switch's value */
  getValue: () => string;
  
  /** Sets the switch's value */
  setValue: (value: string) => SwitchComponent;
  
  /** Checks/activates the switch */
  check: () => SwitchComponent;
  
  /** Unchecks/deactivates the switch */
  uncheck: () => SwitchComponent;
  
  /** Toggles the switch's checked state */
  toggle: () => SwitchComponent;
  
  /** Returns whether the switch is checked */
  isChecked: () => boolean;
  
  /** Sets the switch's label text */
  setLabel: (text: string) => SwitchComponent;
  
  /** Gets the switch's label text */
  getLabel: () => string;
  
  /** Supporting text element */
  supportingTextElement: HTMLElement | null;
  
  /** Sets supporting text content */
  setSupportingText: (text: string, isError?: boolean) => SwitchComponent;
  
  /** Removes supporting text */
  removeSupportingText: () => SwitchComponent;
  
  /** Adds event listener */
  on: (event: string, handler: Function) => SwitchComponent;
  
  /** Removes event listener */
  off: (event: string, handler: Function) => SwitchComponent;
  
  /** Enables the switch */
  enable: () => SwitchComponent;
  
  /** Disables the switch */
  disable: () => SwitchComponent;
  
  /** Destroys the switch component and cleans up resources */
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