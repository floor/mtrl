// src/components/textfield/types.ts

/**
 * Available Textfield variants
 */
export type TextfieldVariant = 'filled' | 'outlined';

/**
 * Textfield variant constants
 */
export const TEXTFIELD_VARIANTS = {
  FILLED: 'filled',
  OUTLINED: 'outlined'
} as const;

/**
 * Available Textfield sizes
 */
export type TextfieldSize = 'small' | 'medium' | 'large';

/**
 * Textfield size constants
 */
export const TEXTFIELD_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;

/**
 * Available Textfield states
 */
export type TextfieldStates = 'active' | 'inactive' | 'disabled';

/**
 * Available Textfield types
 */
export type TextfieldTypes = 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'multiline';

/**
 * Textfield type constants
 */
export const TEXTFIELD_TYPES = {
  TEXT: 'text',
  PASSWORD: 'password',
  EMAIL: 'email',
  NUMBER: 'number',
  TEL: 'tel',
  URL: 'url',
  SEARCH: 'search',
  MULTILINE: 'multiline'
} as const;

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
  
  /** Leading icon HTML content */
  leadingIcon?: string;
  
  /** Trailing icon HTML content */
  trailingIcon?: string;
  
  /** Supporting text content */
  supportingText?: string;
  
  /** Whether supporting text indicates an error */
  error?: boolean;
  
  /** Prefix text to display before the input */
  prefixText?: string;
  
  /** Suffix text to display after the input */
  suffixText?: string;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Prefix for class names */
  prefix?: string;
  
  /** Component name */
  componentName?: string;
  
  /** 
   * Whether to use textarea instead of input (alternative to setting type="multiline") 
   */
  multiline?: boolean;
  
  /** 
   * Number of rows for textarea (only valid for multiline) 
   */
  rows?: number;
  
  /**
   * Whether to automatically grow the textarea as content increases
   */
  autoGrow?: boolean;
  
  /**
   * Maximum height for auto-growing textarea in pixels
   */
  maxHeight?: number;
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
  
  /** Leading icon element (if present) */
  leadingIcon: HTMLElement | null;
  
  /** Sets the leading icon HTML content */
  setLeadingIcon: (html: string) => TextfieldComponent;
  
  /** Removes the leading icon */
  removeLeadingIcon: () => TextfieldComponent;
  
  /** Trailing icon element (if present) */
  trailingIcon: HTMLElement | null;
  
  /** Sets the trailing icon HTML content */
  setTrailingIcon: (html: string) => TextfieldComponent;
  
  /** Removes the trailing icon */
  removeTrailingIcon: () => TextfieldComponent;
  
  /** Supporting text element (if present) */
  supportingTextElement: HTMLElement | null;
  
  /** Sets the supporting text content */
  setSupportingText: (text: string, isError?: boolean) => TextfieldComponent;
  
  /** Removes the supporting text */
  removeSupportingText: () => TextfieldComponent;
  
  /** Prefix text element (if present) */
  prefixTextElement: HTMLElement | null;
  
  /** Sets the prefix text content */
  setPrefixText: (text: string) => TextfieldComponent;
  
  /** Removes the prefix text */
  removePrefixText: () => TextfieldComponent;
  
  /** Suffix text element (if present) */
  suffixTextElement: HTMLElement | null;
  
  /** Sets the suffix text content */
  setSuffixText: (text: string) => TextfieldComponent;
  
  /** Removes the suffix text */
  removeSuffixText: () => TextfieldComponent;
  
  /** 
   * Updates the height of the textarea based on content (for multiline only)
   * Useful after programmatically setting content
   */
  updateHeight: () => TextfieldComponent;
  
  /**
   * Sets the number of rows for a textarea (for multiline only)
   * @param rows - Number of visible rows
   */
  setRows: (rows: number) => TextfieldComponent;
  
  /**
   * Checks if this textfield is multiline
   * @returns true if this is a multiline textfield (textarea)
   */
  isMultiline: () => boolean;
  
  /** Manually update element positions (useful after DOM changes) */
  updatePositions: () => TextfieldComponent;
  
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
  leadingIcon?: HTMLElement | null;
  setLeadingIcon?: (html: string) => any;
  removeLeadingIcon?: () => any;
  trailingIcon?: HTMLElement | null;
  setTrailingIcon?: (html: string) => any;
  removeTrailingIcon?: () => any;
  supportingTextElement?: HTMLElement | null;
  setSupportingText?: (text: string, isError?: boolean) => any;
  removeSupportingText?: () => any;
  prefixTextElement?: HTMLElement | null;
  setPrefixText?: (text: string) => any;
  removePrefixText?: () => any;
  suffixTextElement?: HTMLElement | null;
  setSuffixText?: (text: string) => any;
  removeSuffixText?: () => any;
  updateElementPositions?: () => any;
  updateHeight?: () => any;
  setRows?: (rows: number) => any;
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