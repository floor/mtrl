// src/components/button-group/types.ts

import type { ButtonConfig, ButtonComponent } from "../button/types";

/**
 * Button group orientation
 * @category Components
 */
export type ButtonGroupOrientation = "horizontal" | "vertical";

/**
 * Button group variant - applies to all buttons in the group
 * @category Components
 */
export type ButtonGroupVariant =
  | "filled"
  | "tonal"
  | "outlined"
  | "elevated"
  | "text";

/**
 * Button group density options
 * Controls the overall sizing and spacing of buttons in the group
 * @category Components
 */
export type ButtonGroupDensity = "default" | "comfortable" | "compact";

/**
 * Event types for button group
 */
export type ButtonGroupEventType = "click" | "focus" | "blur";

/**
 * Event data for button group events
 */
export interface ButtonGroupEvent {
  /** The button group component that contains the clicked button */
  buttonGroup: ButtonGroupComponent;

  /** The button component that was clicked */
  button: ButtonComponent;

  /** Index of the button in the group */
  index: number;

  /** Original DOM event */
  originalEvent: Event;
}

/**
 * Configuration for a single button within a button group
 * Extends ButtonConfig but omits properties controlled by the group
 * @category Components
 */
export interface ButtonGroupItemConfig extends Omit<ButtonConfig, "variant"> {
  /**
   * Unique identifier for the button
   * If not provided, index will be used
   */
  id?: string;

  /**
   * Button text content
   * @example 'Bold'
   */
  text?: string;

  /**
   * Button icon HTML content
   * @example '<svg>...</svg>'
   */
  icon?: string;

  /**
   * Accessible label (required for icon-only buttons)
   * @example 'Toggle bold'
   */
  ariaLabel?: string;

  /**
   * Whether this button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Value associated with this button
   */
  value?: string;

  /**
   * Additional CSS class for this button
   */
  class?: string;
}

/**
 * Configuration interface for the Button Group component
 * @category Components
 */
export interface ButtonGroupConfig {
  /**
   * Array of button configurations
   */
  buttons?: ButtonGroupItemConfig[];

  /**
   * Visual variant applied to all buttons in the group
   * @default 'outlined'
   */
  variant?: ButtonGroupVariant;

  /**
   * Orientation of the button group
   * @default 'horizontal'
   */
  orientation?: ButtonGroupOrientation;

  /**
   * Density setting that controls button sizing
   * @default 'default'
   */
  density?: ButtonGroupDensity;

  /**
   * Whether the entire button group is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether buttons should have equal width
   * @default false
   */
  equalWidth?: boolean;

  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;

  /**
   * Component name used in class generation
   */
  componentName?: string;

  /**
   * Additional CSS class for the button group container
   */
  class?: string;

  /**
   * Whether to enable ripple effect on buttons
   * @default true
   */
  ripple?: boolean;

  /**
   * Ripple effect configuration
   */
  rippleConfig?: {
    /** Duration of the ripple animation in milliseconds */
    duration?: number;
    /** Timing function for the ripple animation */
    timing?: string;
    /** Opacity values for ripple start and end [start, end] */
    opacity?: [string, string];
  };

  /**
   * Accessible label for the button group
   * @example 'Text formatting options'
   */
  ariaLabel?: string;

  /**
   * Event handlers for button group events
   */
  on?: {
    [key in ButtonGroupEventType]?: (event: ButtonGroupEvent) => void;
  };
}

/**
 * Button Group component interface
 * @category Components
 */
export interface ButtonGroupComponent {
  /** The component's container DOM element */
  element: HTMLElement;

  /** Array of button component instances */
  buttons: ButtonComponent[];

  /**
   * Gets a button by its index
   * @param index - Button index
   * @returns The button component or undefined
   */
  getButton: (index: number) => ButtonComponent | undefined;

  /**
   * Gets a button by its id or value
   * @param id - Button id or value
   * @returns The button component or undefined
   */
  getButtonById: (id: string) => ButtonComponent | undefined;

  /**
   * Gets the current variant
   * @returns Current variant name
   */
  getVariant: () => ButtonGroupVariant;

  /**
   * Sets the variant for all buttons in the group
   * @param variant - New variant to apply
   * @returns The ButtonGroupComponent for chaining
   */
  setVariant: (variant: ButtonGroupVariant) => ButtonGroupComponent;

  /**
   * Gets the current orientation
   * @returns Current orientation
   */
  getOrientation: () => ButtonGroupOrientation;

  /**
   * Sets the orientation of the button group
   * @param orientation - New orientation
   * @returns The ButtonGroupComponent for chaining
   */
  setOrientation: (orientation: ButtonGroupOrientation) => ButtonGroupComponent;

  /**
   * Gets the current density
   * @returns Current density
   */
  getDensity: () => ButtonGroupDensity;

  /**
   * Sets the density of the button group
   * @param density - New density level
   * @returns The ButtonGroupComponent for chaining
   */
  setDensity: (density: ButtonGroupDensity) => ButtonGroupComponent;

  /**
   * Enables the entire button group
   * @returns The ButtonGroupComponent for chaining
   */
  enable: () => ButtonGroupComponent;

  /**
   * Disables the entire button group
   * @returns The ButtonGroupComponent for chaining
   */
  disable: () => ButtonGroupComponent;

  /**
   * Enables a specific button by index
   * @param index - Button index
   * @returns The ButtonGroupComponent for chaining
   */
  enableButton: (index: number) => ButtonGroupComponent;

  /**
   * Disables a specific button by index
   * @param index - Button index
   * @returns The ButtonGroupComponent for chaining
   */
  disableButton: (index: number) => ButtonGroupComponent;

  /**
   * Adds an event listener to the button group
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The ButtonGroupComponent for chaining
   */
  on: (
    event: ButtonGroupEventType,
    handler: (event: ButtonGroupEvent) => void,
  ) => ButtonGroupComponent;

  /**
   * Removes an event listener from the button group
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The ButtonGroupComponent for chaining
   */
  off: (
    event: ButtonGroupEventType,
    handler: (event: ButtonGroupEvent) => void,
  ) => ButtonGroupComponent;

  /**
   * Destroys the component and cleans up resources
   */
  destroy: () => void;
}
