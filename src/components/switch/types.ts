// src/components/switch/types.ts
import type { TouchEvents } from "../../core/utils/mobile";
import type { EventCallback } from "../../core/state/emitter";

export type SwitchPosition = "center" | "start" | "end";

/**
 * Switch label position types
 */
export type SwitchLabelPosition = "start" | "end";

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

  /** Label text, or a node placed inside the label (the web component passes a `<slot>`) */
  label?: string | Node;

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

  /** Icon HTML in the selected handle; 'none' for no icon. Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
  icon?: string;

  /**
   * Icon HTML in the unselected handle, which then grows to 24dp (M3's icons on
   * both states). FLO-267.
   */
  unselectedIcon?: string;

  /**
   * Which side of the switch the label sits on
   * @default 'start'
   */
  labelPosition?: SwitchLabelPosition;

  /** Index signature for additional properties */
  [key: string]: unknown;
}

/** A checked-state change from native input activation. Public setters are silent. */
export interface SwitchChangePayload {
  /** The new checked state. */
  checked: boolean;
  /** The checked model value, matching getValue() at dispatch. */
  value: boolean;
  /** The input's HTML value attribute, used for native form submission. */
  valueAttribute: string;
  /** The original native change event, when supplied by the emitter. */
  nativeEvent?: Event;
}

/** Emitter events: change, and the input's focus and blur (FLO-267). */
export interface SwitchEvents extends TouchEvents {
  change: (payload: SwitchChangePayload) => void;
  focus: (event: FocusEvent) => void;
  blur: (event: FocusEvent) => void;
}

/**
 * Switch component interface
 */
export interface SwitchComponent {
  /** The root element of the switch */
  element: HTMLElement;

  /** The input element */
  input: HTMLInputElement;

  /** Gets the switch's checked state (boolean) for form compatibility */
  getValue: () => boolean;

  /** Sets the switch's checked state */
  setValue: (value: boolean | string) => SwitchComponent;

  /** Gets the HTML value attribute (rarely needed) */
  getValueAttribute: () => string;

  /** Sets the HTML value attribute (rarely needed) */
  setValueAttribute: (value: string) => SwitchComponent;

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

  /** Puts the switch in or out of the error state: its class and aria-invalid (FLO-318) */
  setError: (error: boolean) => SwitchComponent;

  /** Whether the switch is in the error state */
  isError: () => boolean;

  /** Subscribes to checked-state changes; native input events use input.addEventListener. */
  on: <K extends keyof SwitchEvents>(event: K, handler: SwitchEvents[K]) => SwitchComponent;

  /** Removes event listener */
  off: <K extends keyof SwitchEvents>(event: K, handler: SwitchEvents[K]) => SwitchComponent;

  /** Enables the switch */
  enable: () => SwitchComponent;

  /** Disables the switch */
  disable: () => SwitchComponent;

  /** Whether the switch is disabled (FLO-384) */
  isDisabled: () => boolean;

  /** Destroys the switch component and cleans up resources */
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
  checkable: {
    check: () => void;
    uncheck: () => void;
    toggle: () => void;
    isChecked: () => boolean;
  };
}

/**
 * Base component interface
 */
export interface BaseComponent {
  element: HTMLElement;
  input?: HTMLInputElement;
  getValue?: () => boolean;
  setValue?: (value: boolean) => void;
  label?: {
    setText: (content: string) => void;
    getText: () => string;
  };
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
  checkable?: {
    check: () => void;
    uncheck: () => void;
    toggle: () => void;
    isChecked: () => boolean;
  };
  supportingTextElement?: HTMLElement | null;
  setSupportingText?: (text: string, isError?: boolean) => void;
  removeSupportingText?: () => void;
  setError?: (error: boolean) => void;
  isError?: () => boolean;
}

/**
 * Component as it reaches the API step of the pipeline.
 *
 * `BaseComponent` marks the feature controllers optional because a component
 * part-way through the pipeline has not got them yet. By the time
 * `getApiConfig` runs, withCheckable, withDisabled and withLifecycle have all
 * been applied, so they are there.
 * @internal
 */
export type ApiComponent = BaseComponent &
  Required<Pick<BaseComponent, "checkable" | "disabled" | "lifecycle">>;


/**
 * Registers SwitchConfig with the global defaults map, so
 * `setComponentDefaults("switch", ...)` is typed without core
 * importing anything from this component. FLO-115.
 */
declare module "../../core/config/global" {
  interface ComponentConfigMap {
    switch?: Partial<SwitchConfig>;
  }
}
