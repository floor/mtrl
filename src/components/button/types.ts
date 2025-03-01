// src/components/button/types.ts
import { RIPPLE_SCHEMA } from '../../core/build/constants';

/**
 * Available variants for the Button component
 */
export enum BUTTON_VARIANTS {
  FILLED = 'filled',
  TONAL = 'tonal',
  OUTLINED = 'outlined',
  ELEVATED = 'elevated',
  TEXT = 'text'
}

/**
 * Available sizes for the Button component
 */
export enum BUTTON_SIZES {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

/**
 * Configuration interface for the Button component
 */
export interface ButtonConfig {
  /** Button variant (filled, tonal, outlined, elevated, text) */
  variant?: keyof typeof BUTTON_VARIANTS | BUTTON_VARIANTS;
  
  /** Button size (small, medium, large) */
  size?: keyof typeof BUTTON_SIZES | BUTTON_SIZES;
  
  /** Whether the button is initially disabled */
  disabled?: boolean;
  
  /** Initial button text content */
  text?: string;
  
  /** Initial button icon HTML content */
  icon?: string;
  
  /** Icon size */
  iconSize?: string;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Button value attribute */
  value?: string;
  
  /** Button type attribute (default: 'button') */
  type?: 'button' | 'submit' | 'reset';
  
  /** Whether to enable ripple effect */
  ripple?: boolean;
  
  /** Ripple effect configuration */
  rippleConfig?: {
    duration?: number;
    timing?: string;
    opacity?: [string, string];
  };
}

/**
 * Icon API interface
 */
export interface IconAPI {
  setIcon: (html: string) => IconAPI;
  getIcon: () => string;
  getElement: () => HTMLElement | null;
}

/**
 * Text API interface
 */
export interface TextAPI {
  setText: (content: string) => TextAPI;
  getText: () => string;
  getElement: () => HTMLElement | null;
}

/**
 * Button component interface
 */
export interface ButtonComponent {
  element: HTMLButtonElement;
  text: TextAPI;
  icon: IconAPI;
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  lifecycle: {
    destroy: () => void;
  };
  
  /** Gets the class with the specified name */
  getClass: (name: string) => string;
  
  /** Gets the button's value */
  getValue: () => string;
  
  /** Sets the button's value */
  setValue: (value: string) => ButtonComponent;
  
  /** Enables the button */
  enable: () => ButtonComponent;
  
  /** Disables the button */
  disable: () => ButtonComponent;
  
  /** Sets the button's text content */
  setText: (content: string) => ButtonComponent;
  
  /** Gets the button's text content */
  getText: () => string;
  
  /** Sets the button's icon */
  setIcon: (icon: string) => ButtonComponent;
  
  /** Gets the button's icon */
  getIcon: () => string;
  
  /** Destroys the button component and cleans up resources */
  destroy: () => void;
  
  /** Updates the button's circular style based on content */
  updateCircularStyle: () => void;
  
  /** Adds event listener */
  on: (event: string, handler: Function) => ButtonComponent;
  
  /** Removes event listener */
  off: (event: string, handler: Function) => ButtonComponent;
  
  /** Add CSS classes */
  addClass: (...classes: string[]) => ButtonComponent;
}