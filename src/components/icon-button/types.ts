// src/components/icon-button/types.ts

import { BaseComponentConfig } from '../../core/config/component';
import {
  IconButtonVariant,
  IconButtonSize,
  IconButtonShape,
  IconButtonWidth
} from './constants';

/**
 * Configuration interface for the IconButton component
 *
 * IconButtons display actions in a compact form using icons.
 * They support both default (single action) and toggle (binary state) modes.
 *
 * @category Components
 * @see https://m3.material.io/components/icon-buttons/overview
 */
export interface IconButtonConfig extends BaseComponentConfig {
  /**
   * IconButton variant that determines visual styling
   * - filled: Highest emphasis, key actions
   * - tonal: High emphasis, secondary actions
   * - outlined: Medium emphasis, not main focus
   * - standard: Lowest emphasis, on colorful surfaces
   *
   * @default 'standard'
   */
  variant?: IconButtonVariant | string;

  /**
   * IconButton size variant
   * - xs: 32px container, 18px icon
   * - s: 40px container, 24px icon (default)
   * - m: 56px container, 24px icon
   * - l: 96px container, 36px icon
   * - xl: 136px container, 48px icon
   *
   * @default 's'
   */
  size?: IconButtonSize | string;

  /**
   * IconButton shape variant
   * - round: Full corner radius (default)
   * - square: Fixed corner radius based on size
   *
   * @default 'round'
   */
  shape?: IconButtonShape | string;

  /**
   * IconButton width variant
   * - narrow: Narrower than default
   * - default: Standard width matching container size
   * - wide: Wider than default
   *
   * @default 'default'
   */
  width?: IconButtonWidth | string;

  /**
   * Whether the IconButton is initially disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Icon HTML content (required for icon buttons)
   * Can be SVG, icon font ligature, or any valid HTML
   *
   * @example '<svg viewBox="0 0 24 24">...</svg>'
   * @example '<span class="material-icons">favorite</span>'
   */
  icon?: string;

  /**
   * Selected state icon HTML content (for toggle buttons)
   * When provided, enables toggle mode
   * Use filled icon style for selected state
   *
   * @example '<svg viewBox="0 0 24 24">...</svg>' // filled heart
   */
  selectedIcon?: string;

  /**
   * Whether the IconButton supports toggle (selection) behavior
   * When true, the button can be selected/unselected
   *
   * @default false
   */
  toggle?: boolean;

  /**
   * Initial selected state (only applies when toggle is true)
   * @default false
   */
  selected?: boolean;

  /**
   * Additional CSS classes to add to the IconButton
   */
  class?: string;

  /**
   * Button value attribute
   */
  value?: string;

  /**
   * Button type attribute
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Whether to enable ripple effect
   * @default true
   */
  ripple?: boolean;

  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;

  /**
   * Component name used in class generation
   * @internal
   */
  componentName?: string;

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
   * Accessible name for the IconButton (aria-label)
   * Required for accessibility since icon buttons have no visible text
   * Should describe the action, not the icon name
   *
   * @example 'Add to favorites'
   * @example 'Open menu'
   */
  ariaLabel?: string;

  /**
   * Whether to show tooltip on hover
   * Tooltip text uses ariaLabel value
   *
   * @default true
   */
  tooltip?: boolean;
}

/**
 * Icon API interface for managing IconButton icons
 * @category Components
 */
export interface IconAPI {
  /**
   * Sets the icon HTML content
   * @param html - HTML string for the icon
   * @returns The icon API for chaining
   */
  setIcon: (html: string) => IconAPI;

  /**
   * Gets the current icon HTML content
   * @returns HTML string for the icon
   */
  getIcon: () => string;

  /**
   * Gets the icon DOM element
   * @returns The icon element or null if not present
   */
  getElement: () => HTMLElement | null;
}

/**
 * Toggle state manager interface for IconButton
 * @category Components
 */
export interface ToggleManager {
  /**
   * Selects the IconButton (toggle on)
   * @returns ToggleManager instance for chaining
   */
  select: () => ToggleManager;

  /**
   * Deselects the IconButton (toggle off)
   * @returns ToggleManager instance for chaining
   */
  deselect: () => ToggleManager;

  /**
   * Toggles the selection state
   * @returns ToggleManager instance for chaining
   */
  toggle: () => ToggleManager;

  /**
   * Checks if the IconButton is currently selected
   * @returns true if selected
   */
  isSelected: () => boolean;
}

/**
 * IconButton component interface
 * @category Components
 */
export interface IconButtonComponent {
  /** The IconButton's DOM element */
  element: HTMLButtonElement;

  /** API for managing IconButton icons */
  icon: IconAPI;

  /** API for managing disabled state */
  disabled: {
    /** Enables the IconButton */
    enable: () => void;
    /** Disables the IconButton */
    disable: () => void;
    /** Checks if the IconButton is disabled */
    isDisabled: () => boolean;
  };

  /** API for managing component lifecycle */
  lifecycle: {
    /** Destroys the component and cleans up resources */
    destroy: () => void;
  };

  /**
   * Gets a class name with the component's prefix
   * @param name - Base class name
   * @returns Prefixed class name
   */
  getClass: (name: string) => string;

  /**
   * Gets the IconButton's value attribute
   * @returns IconButton value
   */
  getValue: () => string;

  /**
   * Sets the IconButton's value attribute
   * @param value - New value
   * @returns The IconButton component for chaining
   */
  setValue: (value: string) => IconButtonComponent;

  /**
   * Gets the IconButton's current variant
   * @returns Current variant name
   */
  getVariant: () => IconButtonVariant | string;

  /**
   * Sets the IconButton's variant
   * @param variant - New variant to apply
   * @returns The IconButton component for chaining
   */
  setVariant: (variant: IconButtonVariant | string) => IconButtonComponent;

  /**
   * Gets the IconButton's current size
   * @returns Current size name
   */
  getSize: () => IconButtonSize | string;

  /**
   * Sets the IconButton's size
   * @param size - New size to apply
   * @returns The IconButton component for chaining
   */
  setSize: (size: IconButtonSize | string) => IconButtonComponent;

  /**
   * Gets the IconButton's current shape
   * @returns Current shape name
   */
  getShape: () => IconButtonShape | string;

  /**
   * Sets the IconButton's shape
   * @param shape - New shape to apply
   * @returns The IconButton component for chaining
   */
  setShape: (shape: IconButtonShape | string) => IconButtonComponent;

  /**
   * Gets the IconButton's current width
   * @returns Current width name
   */
  getWidth: () => IconButtonWidth | string;

  /**
   * Sets the IconButton's width
   * @param width - New width to apply
   * @returns The IconButton component for chaining
   */
  setWidth: (width: IconButtonWidth | string) => IconButtonComponent;

  /**
   * Enables the IconButton
   * @returns The IconButton component for chaining
   */
  enable: () => IconButtonComponent;

  /**
   * Disables the IconButton
   * @returns The IconButton component for chaining
   */
  disable: () => IconButtonComponent;

  /**
   * Sets the IconButton's icon
   * @param icon - Icon HTML content
   * @returns The IconButton component for chaining
   */
  setIcon: (icon: string) => IconButtonComponent;

  /**
   * Gets the IconButton's icon HTML content
   * @returns Icon HTML
   */
  getIcon: () => string;

  /**
   * Sets the selected state icon (for toggle buttons)
   * @param icon - Icon HTML content for selected state
   * @returns The IconButton component for chaining
   */
  setSelectedIcon: (icon: string) => IconButtonComponent;

  /**
   * Gets the selected state icon HTML content
   * @returns Selected icon HTML or empty string if not set
   */
  getSelectedIcon: () => string;

  /**
   * Checks if the IconButton is in toggle mode
   * @returns true if toggle mode is enabled
   */
  isToggle: () => boolean;

  /**
   * Selects the IconButton (for toggle buttons)
   * @returns The IconButton component for chaining
   */
  select: () => IconButtonComponent;

  /**
   * Deselects the IconButton (for toggle buttons)
   * @returns The IconButton component for chaining
   */
  deselect: () => IconButtonComponent;

  /**
   * Toggles the selection state (for toggle buttons)
   * @returns The IconButton component for chaining
   */
  toggleSelected: () => IconButtonComponent;

  /**
   * Checks if the IconButton is selected
   * @returns true if selected
   */
  isSelected: () => boolean;

  /**
   * Sets the aria-label attribute for accessibility
   * @param label - Aria label text
   * @returns The IconButton component for chaining
   */
  setAriaLabel: (label: string) => IconButtonComponent;

  /**
   * Destroys the IconButton component and cleans up resources
   */
  destroy: () => void;

  /**
   * Adds an event listener to the IconButton
   * @param event - Event name ('click', 'focus', etc.)
   * @param handler - Event handler function
   * @returns The IconButton component for chaining
   */
  on: (event: string, handler: Function) => IconButtonComponent;

  /**
   * Removes an event listener from the IconButton
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The IconButton component for chaining
   */
  off: (event: string, handler: Function) => IconButtonComponent;

  /**
   * Adds CSS classes to the IconButton element
   * @param classes - One or more class names to add
   * @returns The IconButton component for chaining
   */
  addClass: (...classes: string[]) => IconButtonComponent;

  /**
   * Removes CSS classes from the IconButton element
   * @param classes - One or more class names to remove
   * @returns The IconButton component for chaining
   */
  removeClass: (...classes: string[]) => IconButtonComponent;
}
