// src/components/select/types.ts
import type { MenuColor, MenuVariant } from "../menu/types";

/**
 * Available Select variants
 */
export type SelectVariant = "filled" | "outlined";

/**
 * Select variant constants
 */
export const SELECT_VARIANTS = {
  FILLED: "filled",
  OUTLINED: "outlined",
} as const;

/**
 * Select option interface
 */
export interface SelectOption {
  /**
   * Unique identifier for the option
   */
  id: string;

  /**
   * Display text for the option
   */
  text: string;

  /**
   * Whether the option is disabled
   */
  disabled?: boolean;

  /**
   * Optional icon to display with the option
   */
  icon?: string;

  /**
   * Whether this option has a submenu
   */
  hasSubmenu?: boolean;

  /**
   * Optional array of submenu options
   * Only used when hasSubmenu is true
   */
  submenu?: SelectOption[];

  /**
   * Additional data associated with the option
   */
  data?: any;
}

/**
 * Configuration interface for the Select component
 */
export interface SelectConfig {
  /**
   * Array of options to display in the select menu
   */
  options?: SelectOption[];

  /**
   * Currently selected value (option id)
   */
  value?: string;

  /**
   * Visual variant (filled, outlined)
   */
  variant?: SelectVariant | string;

  /**
   * Density level (default, compact)
   */
  density?: "default" | "compact" | string;

  /**
   * Label text
   */
  label?: string;

  /**
   * Input name attribute
   */
  name?: string;

  /**
   * Whether select is required
   */
  required?: boolean;

  /**
   * Options handed to the select's menu. By default the menu lives inside
   * the select's own element with no height of its own, which suits a short
   * list in a still surface; a long list, or a select inside a scrolling or
   * clipping container (a drawer, a sheet), wants the menu in the body with a
   * max height, so it is neither cropped nor taller than the screen.
   * @example { container: document.body, maxHeight: "320px" }
   */
  menu?: {
    /** Where the menu is mounted and positioned against; document.body for a menu that escapes a clipping container */
    container?: HTMLElement | null;
    /** The menu's max height (a CSS length); the list scrolls inside it */
    maxHeight?: string;
    /** Whether the menu flips above the field when there is no room below */
    autoFlip?: boolean;
    /** The menu's variant: 'vertical' is the M3 expressive menu, items apart in a rounded container */
    variant?: MenuVariant;
    /** The vertical variant's colour mapping */
    color?: MenuColor;
  };

  /**
   * Whether select is disabled
   */
  disabled?: boolean;

  /**
   * Supporting text content
   */
  supportingText?: string;

  /**
   * Whether supporting text indicates an error
   */
  error?: boolean;

  /**
   * Menu placement relative to the textfield
   */
  placement?: string;

  /**
   * Additional CSS classes
   */
  class?: string;

  /**
   * Prefix for class names
   */
  prefix?: string;

  /**
   * Component name
   */
  componentName?: string;

  /**
   * Event callbacks
   */
  on?: {
    /**
     * Called when the select value changes
     */
    change?: (event: SelectChangeEvent) => void;

    /**
     * Called when the select menu opens
     */
    open?: (event: SelectEvent) => void;

    /**
     * Called when the select menu closes
     */
    close?: (event: SelectEvent) => void;
  };
}

/**
 * Select component interface
 */
export interface SelectComponent {
  /**
   * The root element of the select
   */
  element: HTMLElement;

  /**
   * The textfield component
   */
  textfield: any;

  /**
   * The menu component
   */
  menu: any;

  /**
   * Gets the select's current value (selected option id)
   */
  getValue: () => string | null;

  /**
   * Sets the select's value (by option id)
   * @param value - Option id to select, or null/undefined to clear
   * @returns Select component for chaining
   */
  setValue: (value: string | null | undefined) => SelectComponent;

  /**
   * Clears the current selection
   * @returns Select component for chaining
   */
  clear: () => SelectComponent;

  /**
   * Gets the select's current displayed text
   */
  getText: () => string;

  /**
   * Gets the selected option object
   */
  getSelectedOption: () => SelectOption | null;

  /**
   * Gets all available options
   */
  getOptions: () => SelectOption[];

  /**
   * Sets new options
   * @param options - New options array
   * @returns Select component for chaining
   */
  setOptions: (options: SelectOption[]) => SelectComponent;

  /**
   * Opens the select menu
   * @param interactionType - The type of interaction ('mouse' or 'keyboard')
   * @returns Select component for chaining
   */
  open: (interactionType?: "mouse" | "keyboard") => SelectComponent;

  /**
   * Closes the select menu
   * @returns Select component for chaining
   */
  close: () => SelectComponent;

  /**
   * Checks if the menu is open
   */
  isOpen: () => boolean;

  /**
   * Sets the density of the select
   * @param density - The density level to set
   * @returns Select component for chaining
   */
  setDensity: (density: "default" | "compact" | string) => SelectComponent;

  /**
   * Gets the current density setting
   * @returns The current density
   */
  getDensity: () => string;

  /**
   * Adds an event listener
   * @param event - Event name
   * @param handler - Event handler
   * @returns Select component for chaining
   */
  on: <T extends keyof SelectEvents>(
    event: T,
    handler: SelectEvents[T],
  ) => SelectComponent;

  /**
   * Removes an event listener
   * @param event - Event name
   * @param handler - Event handler
   * @returns Select component for chaining
   */
  off: <T extends keyof SelectEvents>(
    event: T,
    handler: SelectEvents[T],
  ) => SelectComponent;

  /**
   * Enables the select
   * @returns Select component for chaining
   */
  enable: () => SelectComponent;

  /**
   * Disables the select
   * @returns Select component for chaining
   */
  disable: () => SelectComponent;

  /**
   * Sets the error state on the select
   * @param error - Whether to show error state
   * @param message - Optional error message to display
   * @returns Select component for chaining
   */
  setError: (error: boolean, message?: string) => SelectComponent;

  /**
   * Clears the error state on the select
   * @returns Select component for chaining
   */
  clearError: () => SelectComponent;

  /**
   * Destroys the select component
   */
  destroy: () => void;
}

/**
 * Select event interface
 */
export interface SelectEvent {
  /**
   * The select component
   */
  select: SelectComponent;

  /**
   * Original DOM event if available
   */
  originalEvent?: Event;

  /**
   * Function to prevent default behavior
   */
  preventDefault: () => void;

  /**
   * Whether default behavior was prevented
   */
  defaultPrevented: boolean;
}

/**
 * Select change event interface
 */
export interface SelectChangeEvent extends SelectEvent {
  /**
   * The selected option id
   */
  value: string;

  /**
   * The selected option text
   */
  text: string;

  /**
   * The complete selected option object
   */
  option: SelectOption;
}

/**
 * Select events interface for type-checking
 * @internal
 */
export interface SelectEvents {
  change: (event: SelectChangeEvent) => void;
  open: (event: SelectEvent) => void;
  close: (event: SelectEvent) => void;
}

/**
 * API options interface
 * @internal
 */
export interface ApiOptions {
  select: {
    getValue: () => string | null;
    setValue: (value: string | null | undefined) => any;
    clear: () => any;
    getText: () => string;
    getSelectedOption: () => SelectOption | null;
    getOptions: () => SelectOption[];
    setOptions: (options: SelectOption[]) => any;
    open: () => any;
    close: () => any;
    isOpen: () => boolean;
  };
  events?: {
    on: <T extends string>(event: T, handler: (event: any) => void) => any;
    off: <T extends string>(event: T, handler: (event: any) => void) => any;
  };
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
 * @internal
 */
export interface BaseComponent {
  element: HTMLElement;
  textfield?: any;
  menu?: any;
  on?: (event: string, handler: Function) => any;
  off?: (event: string, handler: Function) => any;
  emit?: (event: string, data: any) => void;
  disabled?: {
    enable: () => any;
    disable: () => any;
  };
  lifecycle?: {
    destroy: () => void;
  };
  [key: string]: any;
}
