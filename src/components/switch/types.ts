// src/components/switch/types.ts
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

  /** Index signature for additional properties */
  [key: string]: unknown;
}

/** A checked-state change from the native input or a programmatic setter. */
export interface SwitchChangePayload {
  /** The new checked state. */
  checked: boolean;
  /** The input's HTML value attribute, not the boolean checked state. */
  value: string;
  /** Present for input-driven changes; absent for check/uncheck/toggle/setValue. */
  nativeEvent?: Event;
}

/** Emitter events. Native input clicks/focus are not forwarded. */
export interface SwitchEvents {
  change: (payload: SwitchChangePayload) => void;
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

  /** Subscribes to checked-state changes; native input events use input.addEventListener. */
  on: <K extends keyof SwitchEvents>(event: K, handler: SwitchEvents[K]) => SwitchComponent;

  /** Removes event listener */
  off: <K extends keyof SwitchEvents>(event: K, handler: SwitchEvents[K]) => SwitchComponent;

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
    enable: () => void;
    disable: () => void;
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
  getValue?: () => string;
  setValue?: (value: string) => void;
  label?: {
    setText: (content: string) => void;
    getText: () => string;
  };
  on?: (event: string, handler: EventCallback) => void;
  off?: (event: string, handler: EventCallback) => void;
  disabled?: {
    enable: () => void;
    disable: () => void;
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
