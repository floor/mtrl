// src/components/checkbox/types.ts

/**
 * Visual variants for checkbox styling
 * 
 * Material Design 3 checkboxes can use different visual styles
 * while maintaining the same functionality.
 * 
 * @category Components
 */
export const CHECKBOX_VARIANTS = {
  /** Checkbox with filled background when checked */
  FILLED: 'filled',
  /** Checkbox with outlined style (less prominent) */
  OUTLINED: 'outlined'
} as const;

/**
 * Label position options for the checkbox
 * 
 * Controls whether the label appears before or after the checkbox.
 * 
 * @category Components
 */
export const CHECKBOX_LABEL_POSITION = {
  /** Label appears before (to the left of) the checkbox */
  START: 'start',
  /** Label appears after (to the right of) the checkbox (default) */
  END: 'end'
} as const;

/**
 * Checkbox state classes
 * 
 * These classes are applied to the checkbox element to reflect its current state.
 * They can be used for styling or for selection in tests.
 * 
 * @category Components
 */
export const CHECKBOX_STATES = {
  /** Applied when the checkbox is checked */
  CHECKED: 'checked',
  /** Applied when the checkbox is in indeterminate state */
  INDETERMINATE: 'indeterminate',
  /** Applied when the checkbox is disabled */
  DISABLED: 'disabled',
  /** Applied when the checkbox has focus */
  FOCUSED: 'focused'
} as const;

/**
 * Checkbox element classes
 * 
 * These classes are applied to different parts of the checkbox component.
 * They follow the BEM naming convention used throughout the library.
 * 
 * @category Components
 */
export const CHECKBOX_CLASSES = {
  /** The main checkbox container element */
  ROOT: 'checkbox',
  /** The actual input element (usually hidden) */
  INPUT: 'checkbox-input',
  /** The visual checkbox icon */
  ICON: 'checkbox-icon',
  /** The text label associated with the checkbox */
  LABEL: 'checkbox-label'
} as const;

/**
 * Checkbox variant types - controls the visual style of the checkbox
 * 
 * @category Components
 * @remarks
 * - filled: Checkbox with filled background when checked (default)
 * - outlined: Checkbox with outline only, for less visual emphasis
 */
export type CheckboxVariant = 'filled' | 'outlined';

/**
 * Checkbox label position types - controls where the label appears
 * 
 * @category Components
 * @remarks
 * - start: Label appears before (to the left of) the checkbox
 * - end: Label appears after (to the right of) the checkbox (default)
 */
export type CheckboxLabelPosition = 'start' | 'end';

/**
 * Configuration interface for the Checkbox component
 * 
 * @category Components
 * @description
 * Defines the appearance and behavior of a checkbox component.
 * All properties are optional with sensible defaults.
 */
export interface CheckboxConfig {
  /** 
   * Input name attribute, used for form submission
   * @example "accept-terms"
   */
  name?: string;
  
  /** 
   * Initial checked state
   * @default false
   */
  checked?: boolean;
  
  /** 
   * Initial indeterminate state (partially checked)
   * Used when a checkbox represents a mixed selection state
   * @default false
   */
  indeterminate?: boolean;
  
  /** 
   * Whether input is required for form validation
   * @default false
   */
  required?: boolean;
  
  /** 
   * Whether checkbox is disabled (non-interactive)
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Input value attribute, used for form submission
   * @example "true" | "selected" | "1"
   */
  value?: string;
  
  /** 
   * Label text displayed next to the checkbox
   * @example "Accept terms and conditions"
   */
  label?: string;
  
  /** 
   * Label position (start/end)
   * Controls whether the label appears before or after the checkbox
   * @default "end"
   */
  labelPosition?: CheckboxLabelPosition | string;
  
  /** 
   * Visual variant (filled/outlined)
   * @default "filled"
   */
  variant?: CheckboxVariant | string;
  
  /** 
   * Additional CSS classes to apply to the checkbox
   * @example "terms-checkbox primary-checkbox"
   */
  class?: string;
  
  /** 
   * CSS class prefix for all checkbox classes
   * @default "mtrl"
   */
  prefix?: string;
  
  /** 
   * Component name used in CSS class generation
   * @default "checkbox"
   * @internal
   */
  componentName?: string;
}

/**
 * Checkbox component interface
 * 
 * Provides methods for controlling a Material Design 3 checkbox
 * 
 * @category Components
 */
export interface CheckboxComponent {
  /** 
   * The checkbox's root DOM element (container)
   */
  element: HTMLElement;
  
  /** 
   * The actual input element (native checkbox)
   */
  input: HTMLInputElement;
  
  /**
   * Gets the checkbox's current value attribute
   * @returns Current value of the checkbox
   */
  getValue: () => string;
  
  /**
   * Sets the checkbox's value attribute
   * @param value - New value to set
   * @returns Checkbox component for method chaining
   */
  setValue: (value: string) => CheckboxComponent;
  
  /**
   * Checks the checkbox (sets checked=true)
   * @returns Checkbox component for method chaining
   */
  check: () => CheckboxComponent;
  
  /**
   * Unchecks the checkbox (sets checked=false)
   * @returns Checkbox component for method chaining
   */
  uncheck: () => CheckboxComponent;
  
  /**
   * Toggles the checkbox's checked state
   * @returns Checkbox component for method chaining
   */
  toggle: () => CheckboxComponent;
  
  /**
   * Checks if the checkbox is currently checked
   * @returns True if checkbox is checked, false otherwise
   */
  isChecked: () => boolean;
  
  /**
   * Sets the checkbox's indeterminate state
   * An indeterminate checkbox appears partially checked
   * and is used to represent a mixed selection state
   * 
   * @param state - Whether to set indeterminate state
   * @returns Checkbox component for method chaining
   */
  setIndeterminate: (state: boolean) => CheckboxComponent;
  
  /**
   * Sets the checkbox's label text
   * @param text - New label text
   * @returns Checkbox component for method chaining
   */
  setLabel: (text: string) => CheckboxComponent;
  
  /**
   * Gets the checkbox's current label text
   * @returns Current label text
   */
  getLabel: () => string;
  
  /**
   * Adds an event listener to the checkbox
   * @param event - Event name ('change', 'click', etc.)
   * @param handler - Event handler function
   * @returns Checkbox component for method chaining
   * @example
   * checkbox.on('change', (e) => console.log('Checkbox state:', e.target.checked));
   */
  on: (event: string, handler: Function) => CheckboxComponent;
  
  /**
   * Removes an event listener from the checkbox
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Checkbox component for method chaining
   */
  off: (event: string, handler: Function) => CheckboxComponent;
  
  /**
   * Enables the checkbox, making it interactive
   * @returns Checkbox component for method chaining
   */
  enable: () => CheckboxComponent;
  
  /**
   * Disables the checkbox, making it non-interactive
   * @returns Checkbox component for method chaining
   */
  disable: () => CheckboxComponent;
  
  /**
   * Destroys the checkbox component and cleans up resources
   * Removes event listeners and DOM references
   */
  destroy: () => void;
}

/**
 * API options interface for internal use
 * @category Components
 * @internal
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
 * Base component interface for internal composition
 * @category Components
 * @internal
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