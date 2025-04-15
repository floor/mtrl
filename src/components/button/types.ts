// src/components/button/types.ts

/**
 * Button variant types - controls the visual style of the button
 * @category Components
 * @remarks
 * - filled: Primary action button with solid background (high emphasis)
 * - tonal: Secondary action button with medium emphasis
 * - outlined: Button with outline border and transparent background
 * - elevated: Button with slight elevation/shadow
 * - text: Button that appears as text without background or border (low emphasis)
 */
export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'elevated' | 'text';

/**
 * Configuration interface for the Button component
 * @category Components
 */
export interface ButtonConfig {
  /** 
   * Button variant that determines visual styling
   * @default 'filled'
   */
  variant?: ButtonVariant | string;
  
  /** 
   * Whether the button is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Initial button text content
   * @example 'Submit'
   */
  text?: string;
  
  /** 
   * Initial button icon HTML content
   * @example '<svg>...</svg>'
   */
  icon?: string;
  
  /** 
   * Icon size in pixels or other CSS units
   * @example '18px'
   */
  iconSize?: string;
  
  /** 
   * Additional CSS classes to add to the button
   * @example 'form-submit header-action'
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
   * Accessible name for the button (aria-label)
   * Required for icon-only buttons without text
   */
  ariaLabel?: string;
}

/**
 * Icon API interface for managing button icons
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
 * Text API interface for managing button text
 * @category Components
 */
export interface TextAPI {
  /**
   * Sets the text content
   * @param content - Text content
   * @returns The text API for chaining
   */
  setText: (content: string) => TextAPI;
  
  /**
   * Gets the current text content
   * @returns Button text content
   */
  getText: () => string;
  
  /**
   * Gets the text DOM element
   * @returns The text element or null if not present
   */
  getElement: () => HTMLElement | null;
}

/**
 * Button component interface
 * @category Components
 */
export interface ButtonComponent {
  /** The button's DOM element */
  element: HTMLButtonElement;
  
  /** API for managing button text */
  text: TextAPI;
  
  /** API for managing button icons */
  icon: IconAPI;
  
  /** API for managing disabled state */
  disabled: {
    /** Enables the button */
    enable: () => void;
    /** Disables the button */
    disable: () => void;
    /** Checks if the button is disabled */
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
   * Gets the button's value attribute
   * @returns Button value
   */
  getValue: () => string;
  
  /**
   * Sets the button's value attribute
   * @param value - New value
   * @returns The button component for chaining
   */
  setValue: (value: string) => ButtonComponent;
  
  /**
   * Enables the button (removes disabled attribute)
   * @returns The button component for chaining
   */
  enable: () => ButtonComponent;
  
  /**
   * Disables the button (adds disabled attribute)
   * @returns The button component for chaining
   */
  disable: () => ButtonComponent;
  
  /**
   * Sets the button's text content
   * @param content - Text content
   * @returns The button component for chaining
   */
  setText: (content: string) => ButtonComponent;
  
  /**
   * Gets the button's text content
   * @returns Button text content
   */
  getText: () => string;
  
  /**
   * Sets the button's icon
   * @param icon - Icon HTML content
   * @returns The button component for chaining
   */
  setIcon: (icon: string) => ButtonComponent;
  
  /**
   * Gets the button's icon HTML content
   * @returns Icon HTML
   */
  getIcon: () => string;
  
  /**
   * Destroys the button component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Updates the button's circular style based on content
   * Internal method used when changing content
   */
  updateCircularStyle: () => void;
  
  /**
   * Sets the active state of the button
   * Used to visually indicate the button's active state, such as when it has a menu open
   * 
   * @param active - Whether the button should appear active
   * @returns The button component for chaining
   */
  setActive: (active: boolean) => ButtonComponent;
  
  /**
   * Adds an event listener to the button
   * @param event - Event name ('click', 'focus', etc.)
   * @param handler - Event handler function
   * @returns The button component for chaining
   */
  on: (event: string, handler: Function) => ButtonComponent;
  
  /**
   * Removes an event listener from the button
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The button component for chaining
   */
  off: (event: string, handler: Function) => ButtonComponent;
  
  /**
   * Adds CSS classes to the button element
   * @param classes - One or more class names to add
   * @returns The button component for chaining
   */
  addClass: (...classes: string[]) => ButtonComponent;

  /**
   * Sets the aria-label attribute for accessibility
   * @param label - Aria label text
   * @returns The button component for chaining
   */
  setAriaLabel: (label: string) => ButtonComponent;
}