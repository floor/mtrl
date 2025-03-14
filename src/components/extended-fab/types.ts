// src/components/extended-fab/types.ts
import { FAB_VARIANTS } from '../fab/constants';

/**
 * Configuration interface for the Extended FAB component
 * @category Components
 */
export interface ExtendedFabConfig {
  /** 
   * Extended FAB variant that determines visual styling
   * @default 'primary'
   */
  variant?: keyof typeof FAB_VARIANTS | string;
  
  /** 
   * Whether the Extended FAB is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Extended FAB icon HTML content
   * @example '<svg>...</svg>'
   */
  icon?: string;
  
  /** 
   * Icon size in pixels or other CSS units
   * @example '24px'
   */
  iconSize?: string;
  
  /**
   * Position of the icon relative to the text
   * @default 'start'
   */
  iconPosition?: 'start' | 'end';
  
  /**
   * Text label for the Extended FAB
   * @example 'Create'
   */
  text?: string;
  
  /** 
   * Additional CSS classes to add to the Extended FAB
   * @example 'home-fab bottom-right'
   */
  class?: string;
  
  /** 
   * Button value attribute
   */
  value?: string;
  
  /**
   * Position of the Extended FAB on the screen
   * @example 'bottom-right'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | string;
  
  /** 
   * Button type attribute
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';
  
  /**
   * Accessible label for screen readers
   */
  ariaLabel?: string;
  
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
   * Whether to show the Extended FAB with an entrance animation
   * @default false
   */
  animate?: boolean;
  
  /**
   * Width behavior of the Extended FAB
   * @default 'fixed'
   */
  width?: 'fixed' | 'fluid';
  
  /**
   * Whether the Extended FAB should collapse to a standard FAB on scroll
   * @default false
   */
  collapseOnScroll?: boolean;
}

/**
 * Extended FAB component interface
 * @category Components
 */
export interface ExtendedFabComponent {
  /** The Extended FAB's DOM element */
  element: HTMLButtonElement;
  
  /** API for managing Extended FAB icons */
  icon: {
    /** Sets the icon HTML content */
    setIcon: (html: string) => any;
    /** Gets the current icon HTML content */
    getIcon: () => string;
    /** Gets the icon DOM element */
    getElement: () => HTMLElement | null;
  };
  
  /** API for managing text content */
  text: {
    /** Sets the text content */
    setText: (text: string) => any;
    /** Gets the current text content */
    getText: () => string;
    /** Gets the text DOM element */
    getElement: () => HTMLElement | null;
  };
  
  /** API for managing disabled state */
  disabled: {
    /** Enables the Extended FAB */
    enable: () => void;
    /** Disables the Extended FAB */
    disable: () => void;
    /** Checks if the Extended FAB is disabled */
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
   * Gets the Extended FAB's value attribute
   * @returns Extended FAB value
   */
  getValue: () => string;
  
  /**
   * Sets the Extended FAB's value attribute
   * @param value - New value
   * @returns The Extended FAB component for chaining
   */
  setValue: (value: string) => ExtendedFabComponent;
  
  /**
   * Enables the Extended FAB (removes disabled attribute)
   * @returns The Extended FAB component for chaining
   */
  enable: () => ExtendedFabComponent;
  
  /**
   * Disables the Extended FAB (adds disabled attribute)
   * @returns The Extended FAB component for chaining
   */
  disable: () => ExtendedFabComponent;
  
  /**
   * Sets the Extended FAB's icon
   * @param icon - Icon HTML content
   * @returns The Extended FAB component for chaining
   */
  setIcon: (icon: string) => ExtendedFabComponent;
  
  /**
   * Gets the Extended FAB's icon HTML content
   * @returns Icon HTML
   */
  getIcon: () => string;
  
  /**
   * Sets the Extended FAB's text content
   * @param text - Text content
   * @returns The Extended FAB component for chaining
   */
  setText: (text: string) => ExtendedFabComponent;
  
  /**
   * Gets the Extended FAB's text content
   * @returns Text content
   */
  getText: () => string;
  
  /**
   * Sets the Extended FAB's position
   * @param position - Position value ('top-right', 'bottom-left', etc.)
   * @returns The Extended FAB component for chaining
   */
  setPosition: (position: string) => ExtendedFabComponent;
  
  /**
   * Gets the current position of the Extended FAB
   * @returns Current position
   */
  getPosition: () => string | null;

  /**
   * Lowers the Extended FAB (useful for pressed state)
   * @returns The Extended FAB component for chaining
   */
  lower: () => ExtendedFabComponent;
  
  /**
   * Raises the Extended FAB back to its default elevation
   * @returns The Extended FAB component for chaining
   */
  raise: () => ExtendedFabComponent;
  
  /**
   * Collapses the Extended FAB into a standard FAB
   * @returns The Extended FAB component for chaining
   */
  collapse: () => ExtendedFabComponent;
  
  /**
   * Expands a collapsed Extended FAB back to its full size
   * @returns The Extended FAB component for chaining
   */
  expand: () => ExtendedFabComponent;
  
  /**
   * Destroys the Extended FAB component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the Extended FAB
   * @param event - Event name ('click', 'focus', etc.)
   * @param handler - Event handler function
   * @returns The Extended FAB component for chaining
   */
  on: (event: string, handler: Function) => ExtendedFabComponent;
  
  /**
   * Removes an event listener from the Extended FAB
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The Extended FAB component for chaining
   */
  off: (event: string, handler: Function) => ExtendedFabComponent;
  
  /**
   * Adds CSS classes to the Extended FAB element
   * @param classes - One or more class names to add
   * @returns The Extended FAB component for chaining
   */
  addClass: (...classes: string[]) => ExtendedFabComponent;
}