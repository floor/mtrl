// src/components/textfield/types.ts

/**
 * Available Textfield variants
 */
export type TextfieldVariant = "filled" | "outlined";

/**
 * Textfield variant constants
 */
export const TEXTFIELD_VARIANTS = {
  FILLED: "filled",
  OUTLINED: "outlined",
} as const;

/**
 * Available Textfield states
 */
export type TextfieldStates = "active" | "inactive" | "disabled";

/**
 * Available Textfield density levels
 */
export type TextfieldDensity = "default" | "compact";

/**
 * Textfield density constants
 */
export const TEXTFIELD_DENSITY = {
  DEFAULT: "default",
  COMPACT: "compact",
} as const;

/**
 * Available Textfield types
 */
export type TextfieldTypes =
  | "text"
  | "password"
  | "email"
  | "number"
  | "tel"
  | "url"
  | "search"
  | "multiline";

/**
 * Textfield type constants
 */
export const TEXTFIELD_TYPES = {
  TEXT: "text",
  PASSWORD: "password",
  EMAIL: "email",
  NUMBER: "number",
  TEL: "tel",
  URL: "url",
  SEARCH: "search",
  MULTILINE: "multiline",
} as const;

/**
 * Configuration interface for the Textfield component
 */
export interface TextfieldConfig {
  /** Input type (text, password, email, etc.) */
  type?: TextfieldTypes | string;

  /** Visual variant (filled, outlined) */
  variant?: TextfieldVariant | string;

  /** Density level (default, compact) */
  density?: TextfieldDensity | string;

  /** Input name attribute */
  name?: string;

  /** Label text */
  label?: string;

  /** Initial value */
  value?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Whether input is required */
  required?: boolean;

  /** Whether textfield is disabled */
  disabled?: boolean;

  /** Whether textfield is readonly */
  readonly?: boolean;

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

  /** Sets the textfield's variant (filled or outlined) */
  setVariant: (variant: TextfieldVariant) => TextfieldComponent;

  /** Gets the textfield's current variant */
  getVariant: () => TextfieldVariant;

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

  /** Manually update element positions (useful after DOM changes) */
  updatePositions: () => TextfieldComponent;

  /** Sets the error state of the textfield */
  setError: (error: boolean, message?: string) => TextfieldComponent;

  /** Gets the current error state */
  isError: () => boolean;

  /** Sets the density of the textfield */
  setDensity: (density: TextfieldDensity | string) => TextfieldComponent;

  /** Gets the current density setting */
  getDensity: () => string;

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
    enable: () => void;
    disable: () => void;
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
  config?: {
    prefix?: string;
    componentName?: string;
    [key: string]: string | number | boolean | undefined;
  };
  getValue?: () => string;
  setValue?: (value: string) => void;
  setAttribute?: (name: string, value: string) => void;
  getAttribute?: (name: string) => string | null;
  removeAttribute?: (name: string) => void;
  label?: {
    setText: (content: string) => void;
    getText: () => string;
  };
  leadingIcon?: HTMLElement | null;
  setLeadingIcon?: (html: string) => void;
  removeLeadingIcon?: () => void;
  trailingIcon?: HTMLElement | null;
  setTrailingIcon?: (html: string) => void;
  removeTrailingIcon?: () => void;
  supportingTextElement?: HTMLElement | null;
  setSupportingText?: (text: string, isError?: boolean) => void;
  removeSupportingText?: () => void;
  prefixTextElement?: HTMLElement | null;
  setPrefixText?: (text: string) => void;
  removePrefixText?: () => void;
  suffixTextElement?: HTMLElement | null;
  setSuffixText?: (text: string) => void;
  removeSuffixText?: () => void;
  updateElementPositions?: () => void;
  on?: (event: string, handler: Function) => void;
  off?: (event: string, handler: Function) => void;
  disabled?: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle?: {
    destroy: () => void;
  };
  errorState?: boolean;
  setError?: (error: boolean, message?: string) => void;
  isError?: () => boolean;
  [key: string]: unknown;
}
