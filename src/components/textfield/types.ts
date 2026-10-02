// src/components/textfield/types.ts
import type { EventCallback } from "../../core/state/emitter";
import type { TextfieldTrailingPayload } from "./features/trailing-icon";

export type { TextfieldTrailingPayload };

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

  /** Leading icon HTML content */
  leadingIcon?: string;

  /** Trailing icon HTML content */
  trailingIcon?: string;

  /**
   * Makes the trailing icon a button with this accessible name (clear, show
   * password, …), emitting `trailing` when activated. Without it the icon is
   * decorative. M3 draws an interactive trailing icon as an icon button, as
   * Compose's trailing slot holds an `IconButton` (FLO-301).
   */
  trailingIconLabel?: string;

  /** Called when the trailing icon button is activated, after `trailing` is emitted */
  onTrailingClick?: (event: TextfieldTrailingPayload) => void;

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
export interface TextfieldValuePayload {
  value: string;
  isEmpty: boolean;
  isAutofilled: boolean;
}

/** Focus and blur report whether the input is empty, without a native event. */
export interface TextfieldFocusPayload {
  isEmpty: boolean;
}

/** Events emitted by the text input feature. setValue() is silent. */
export interface TextfieldEvents {
  /** The trailing icon button was activated (`trailingIconLabel`; FLO-301) */
  trailing: (payload: TextfieldTrailingPayload) => void;
  input: (payload: TextfieldValuePayload) => void;
  change: (payload: TextfieldValuePayload) => void;
  focus: (payload: TextfieldFocusPayload) => void;
  blur: (payload: TextfieldFocusPayload) => void;
}

/**
 * Textfield component interface
 */
export interface TextfieldComponent {
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
  /**
   * Sets the trailing icon. `label` makes it a button with that accessible name,
   * an empty one makes it decorative; left out, the icon keeps what it is.
   */
  setTrailingIcon: (html: string, label?: string) => TextfieldComponent;

  /** Removes the trailing icon */
  removeTrailingIcon: () => TextfieldComponent;

  /** Makes the field required or optional, the label's asterisk with it (FLO-301) */
  setRequired: (required: boolean) => TextfieldComponent;

  /** Whether the field is required */
  isRequired: () => boolean;

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

  /** Subscribes to input state events; keyboard events use input.addEventListener. */
  on: <K extends keyof TextfieldEvents>(event: K, handler: TextfieldEvents[K]) => TextfieldComponent;

  /** Removes event listener */
  off: <K extends keyof TextfieldEvents>(event: K, handler: TextfieldEvents[K]) => TextfieldComponent;

  /** Enables the textfield */
  enable: () => TextfieldComponent;

  /** Disables the textfield */
  disable: () => TextfieldComponent;

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
 * Registers TextfieldConfig with the global defaults map, so
 * `setComponentDefaults("textfield", ...)` is typed without core
 * importing anything from this component. FLO-115.
 */
declare module "../../core/config/global" {
  interface ComponentConfigMap {
    /** In `material` 3.0.0 this defaults key is `'text-field'`: `setComponentDefaults('text-field', …)`. */
    textfield?: Partial<TextfieldConfig>;
  }
}
