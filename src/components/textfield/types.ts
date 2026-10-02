// src/components/textfield/types.ts
import type { EventCallback } from "../../core/state/emitter";
import type { TextFieldTrailingPayload } from "./features/trailing-icon";

export type { TextFieldTrailingPayload };

/**
 * Available TextField variants
 */
export type TextFieldVariant = "filled" | "outlined";

/**
 * TextField variant constants
 */
export const TEXT_FIELD_VARIANTS = {
  FILLED: "filled",
  OUTLINED: "outlined",
} as const;

/**
 * Available TextField states
 */
export type TextFieldStates = "active" | "inactive" | "disabled";

/**
 * Available TextField density levels
 */
export type TextFieldDensity = "default" | "compact";

/**
 * TextField density constants
 */
export const TEXT_FIELD_DENSITY = {
  DEFAULT: "default",
  COMPACT: "compact",
} as const;

/**
 * Available TextField types
 */
export type TextFieldTypes =
  | "text"
  | "password"
  | "email"
  | "number"
  | "tel"
  | "url"
  | "search"
  | "multiline";

/**
 * TextField type constants
 */
export const TEXT_FIELD_TYPES = {
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
 * Configuration interface for the TextField component
 */
export interface TextFieldConfig {
  /** Input type (text, password, email, etc.) */
  type?: TextFieldTypes | string;

  /** Visual variant (filled, outlined) */
  variant?: TextFieldVariant | string;

  /** Density level (default, compact) */
  density?: TextFieldDensity | string;

  /** Input name attribute */
  name?: string;

  /** Label text */
  label?: string;

  /** Initial value */
  value?: string;

  /** Placeholder text */
  placeholder?: string;

  /** Whether input is required; the label gets an asterisk (FLO-301) */
  required?: boolean;

  /**
   * No asterisk on a required field: M3 lets a form whose fields are mostly
   * required mark its optional ones instead (FLO-301)
   */
  noAsterisk?: boolean;

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

  /** Leading icon HTML content. Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  leadingIcon?: string;

  /** Trailing icon HTML content. Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  trailingIcon?: string;

  /**
   * Makes the trailing icon a button with this accessible name (clear, show
   * password, …), emitting `trailing` when activated. Without it the icon is
   * decorative. M3 draws an interactive trailing icon as an icon button, as
   * Compose's trailing slot holds an `IconButton` (FLO-301).
   */
  trailingIconLabel?: string;

  /** `trailing` listener registered at creation. */
  onTrailingClick?: TextFieldEvents["trailing"];

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

/** Payload emitted by native input/change and autofill detection. */
export interface TextFieldValuePayload {
  value: string;
  isEmpty: boolean;
  isAutofilled: boolean;
}

/** Focus and blur report whether the input is empty, without a native event. */
export interface TextFieldFocusPayload {
  isEmpty: boolean;
}

/** Events emitted by the text input feature. setValue() is silent. */
export interface TextFieldEvents {
  /** The trailing icon button was activated (`trailingIconLabel`; FLO-301) */
  trailing: (payload: TextFieldTrailingPayload) => void;
  input: (payload: TextFieldValuePayload) => void;
  change: (payload: TextFieldValuePayload) => void;
  focus: (payload: TextFieldFocusPayload) => void;
  blur: (payload: TextFieldFocusPayload) => void;
}

/**
 * TextField component interface
 */
export interface TextFieldComponent {
  /** The root element of the textfield */
  element: HTMLElement;

  /**
   * The container: label, input, outline, icons and affixes, above the
   * supporting text row. Anchor popovers to it (FLO-300).
   */
  field: HTMLElement;

  /** The input element */
  input: HTMLInputElement | HTMLTextAreaElement;

  /** Gets the textfield's value */
  getValue: () => string;

  /** Sets the textfield's value */
  setValue: (value: string) => TextFieldComponent;

  /** Sets an attribute on the input element */
  setAttribute: (name: string, value: string) => TextFieldComponent;

  /** Gets an attribute from the input element */
  getAttribute: (name: string) => string | null;

  /** Removes an attribute from the input element */
  removeAttribute: (name: string) => TextFieldComponent;

  /** Sets the textfield's variant (filled or outlined) */
  setVariant: (variant: TextFieldVariant) => TextFieldComponent;

  /** Gets the textfield's current variant */
  getVariant: () => TextFieldVariant;

  /** Sets the textfield's label text */
  setLabel: (text: string) => TextFieldComponent;

  /** Gets the textfield's label text */
  getLabel: () => string;

  /** Leading icon element (if present) */
  leadingIcon: HTMLElement | null;

  /** Sets the leading icon HTML content */
  setLeadingIcon: (html: string) => TextFieldComponent;

  /** Removes the leading icon */
  removeLeadingIcon: () => TextFieldComponent;

  /** Trailing icon element (if present) */
  trailingIcon: HTMLElement | null;

  /** Sets the trailing icon HTML content */
  /**
   * Sets the trailing icon. `label` makes it a button with that accessible name,
   * an empty one makes it decorative; left out, the icon keeps what it is.
   */
  setTrailingIcon: (html: string, label?: string) => TextFieldComponent;

  /** Removes the trailing icon */
  removeTrailingIcon: () => TextFieldComponent;

  /** Makes the field required or optional, the label's asterisk with it (FLO-301) */
  setRequired: (required: boolean) => TextFieldComponent;

  /** Whether the field is required */
  isRequired: () => boolean;

  /** Supporting text element (if present) */
  supportingTextElement: HTMLElement | null;

  /** Sets the supporting text content */
  setSupportingText: (text: string, isError?: boolean) => TextFieldComponent;

  /** Removes the supporting text */
  removeSupportingText: () => TextFieldComponent;

  /** Prefix text element (if present) */
  prefixTextElement: HTMLElement | null;

  /** Sets the prefix text content */
  setPrefixText: (text: string) => TextFieldComponent;

  /** Removes the prefix text */
  removePrefixText: () => TextFieldComponent;

  /** Suffix text element (if present) */
  suffixTextElement: HTMLElement | null;

  /** Sets the suffix text content */
  setSuffixText: (text: string) => TextFieldComponent;

  /** Removes the suffix text */
  removeSuffixText: () => TextFieldComponent;

  /** Manually update element positions (useful after DOM changes) */
  updatePositions: () => TextFieldComponent;

  /** Sets the error state of the textfield */
  setError: (error: boolean, message?: string) => TextFieldComponent;

  /** Gets the current error state */
  isError: () => boolean;

  /** Sets the density of the textfield */
  setDensity: (density: TextFieldDensity | string) => TextFieldComponent;

  /** Gets the current density setting */
  getDensity: () => string;

  /** Subscribes to input state events; keyboard events use input.addEventListener. */
  on: <K extends keyof TextFieldEvents>(event: K, handler: TextFieldEvents[K]) => TextFieldComponent;

  /** Removes event listener */
  off: <K extends keyof TextFieldEvents>(event: K, handler: TextFieldEvents[K]) => TextFieldComponent;

  /** Enables the textfield */
  enable: () => TextFieldComponent;

  /** Disables the textfield */
  disable: () => TextFieldComponent;

  /** Whether the text field is disabled (FLO-384) */
  isDisabled: () => boolean;

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
    isDisabled: () => boolean;
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
  /** The prefixed class name, from createBase */
  getClass: (name: string) => string;
  input?: HTMLInputElement | HTMLTextAreaElement;
  config?: {
    prefix?: string;
    componentName?: string;
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
  setTrailingIcon?: (html: string, label?: string) => void;
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
  on?: (event: string, handler: EventCallback) => void;
  off?: (event: string, handler: EventCallback) => void;
  disabled?: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  lifecycle?: {
    destroy: () => void;
  };
  errorState?: boolean;
  setError?: (error: boolean, message?: string) => void;
  isError?: () => boolean;
}


/**
 * Registers TextFieldConfig with the global defaults map, so
 * `setComponentDefaults("textfield", ...)` is typed without core
 * importing anything from this component. FLO-115.
 */
declare module "../../core/config/global" {
  interface ComponentConfigMap {
    textfield?: Partial<TextFieldConfig>;
  }
}
