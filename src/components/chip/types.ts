// src/components/chip/types.ts
import { CHIP_VARIANTS, CHIP_SIZES } from './constants';

/**
 * Configuration interface for the Chip component
 */
export interface ChipConfig {
  /** Chip variant (filled, outlined, elevated, assist, filter, input, suggestion) */
  variant?: keyof typeof CHIP_VARIANTS | string;
  
  /** Chip size (small, medium, large) */
  size?: keyof typeof CHIP_SIZES | string;
  
  /** Whether the chip is initially disabled */
  disabled?: boolean;
  
  /** Whether the chip is initially selected */
  selected?: boolean;
  
  /** Initial chip text content */
  text?: string;
  
  /** Initial chip icon HTML content */
  icon?: string;
  
  /** Optional leading icon HTML content */
  leadingIcon?: string;
  
  /** Optional trailing icon HTML content */
  trailingIcon?: string;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Chip value attribute */
  value?: string;
  
  /** Whether to enable ripple effect */
  ripple?: boolean;
  
  /** Ripple effect configuration */
  rippleConfig?: {
    duration?: number;
    timing?: string;
    opacity?: [string, string];
  };
  
  /** Function called when the trailing icon is clicked */
  onTrailingIconClick?: (chip: ChipComponent) => void;
  
  /** Function called when the chip is selected */
  onSelect?: (chip: ChipComponent) => void;
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
 * Chip component interface
 */
export interface ChipComponent {
  element: HTMLElement;
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
  
  /** Gets the chip's value */
  getValue: () => string | null;
  
  /** Sets the chip's value */
  setValue: (value: string) => ChipComponent;
  
  /** Enables the chip */
  enable: () => ChipComponent;
  
  /** Disables the chip */
  disable: () => ChipComponent;
  
  /** Sets the chip's text content */
  setText: (content: string) => ChipComponent;
  
  /** Gets the chip's text content */
  getText: () => string;
  
  /** Sets the chip's icon */
  setIcon: (icon: string) => ChipComponent;
  
  /** Gets the chip's icon */
  getIcon: () => string;
  
  /** Sets the chip's trailing icon */
  setTrailingIcon: (icon: string) => ChipComponent;
  
  /** Checks if the chip is selected */
  isSelected: () => boolean;
  
  /** Sets the chip's selected state */
  setSelected: (selected: boolean) => ChipComponent;
  
  /** Toggles the chip's selected state */
  toggleSelected: () => ChipComponent;
  
  /** Destroys the chip component and cleans up resources */
  destroy: () => void;
  
  /** Adds event listener */
  on: (event: string, handler: Function) => ChipComponent;
  
  /** Removes event listener */
  off: (event: string, handler: Function) => ChipComponent;
  
  /** Add CSS classes */
  addClass: (...classes: string[]) => ChipComponent;
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
  getClass: (name?: string) => string;
  config: any;
  text?: TextAPI;
  icon?: IconAPI;
  disabled?: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  lifecycle?: {
    destroy: () => void;
  };
  [key: string]: any;
}