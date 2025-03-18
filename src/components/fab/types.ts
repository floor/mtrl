// src/components/fab/types.ts

/**
 * FAB variants for styling
 * @category Components
 */
export type FabVariant = 'primary' | 'secondary' | 'tertiary' | 'surface';

/**
 * FAB size variants
 * @category Components
 */
export type FabSize = 'small' | 'default' | 'large';

/**
 * FAB position options
 * @category Components
 */
export type FabPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * Configuration interface for the FAB component
 * @category Components
 */
export interface FabConfig {
  /** 
   * FAB variant that determines visual styling
   * @default 'primary'
   */
  variant?: FabVariant | string;
  
  /** 
   * FAB size variant
   * @default 'default'
   */
  size?: FabSize | string;
  
  /** 
   * Whether the FAB is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * FAB icon HTML content
   * @example '<svg>...</svg>'
   */
  icon?: string;
  
  /** 
   * Icon size in pixels or other CSS units
   * @example '24px'
   */
  iconSize?: string;
  
  /** 
   * Additional CSS classes to add to the FAB
   * @example 'home-fab bottom-right'
   */
  class?: string;
  
  /** 
   * Button value attribute
   */
  value?: string;
  
  /**
   * Position of the FAB on the screen
   * @example 'bottom-right'
   */
  position?: FabPosition | string;
  
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
   * Whether to show the FAB with an entrance animation
   * @default false
   */
  animate?: boolean;
}

/**
 * FAB component interface
 * @category Components
 */
export interface FabComponent {
  /** The FAB's DOM element */
  element: HTMLButtonElement;
  
  /** API for managing FAB icons */
  icon: {
    /** Sets the icon HTML content */
    setIcon: (html: string) => any;
    /** Gets the current icon HTML content */
    getIcon: () => string;
    /** Gets the icon DOM element */
    getElement: () => HTMLElement | null;
  };
  
  /** API for managing disabled state */
  disabled: {
    /** Enables the FAB */
    enable: () => void;
    /** Disables the FAB */
    disable: () => void;
    /** Checks if the FAB is disabled */
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
   * Gets the FAB's value attribute
   * @returns FAB value
   */
  getValue: () => string;
  
  /**
   * Sets the FAB's value attribute
   * @param value - New value
   * @returns The FAB component for chaining
   */
  setValue: (value: string) => FabComponent;
  
  /**
   * Enables the FAB (removes disabled attribute)
   * @returns The FAB component for chaining
   */
  enable: () => FabComponent;
  
  /**
   * Disables the FAB (adds disabled attribute)
   * @returns The FAB component for chaining
   */
  disable: () => FabComponent;
  
  /**
   * Sets the FAB's icon
   * @param icon - Icon HTML content
   * @returns The FAB component for chaining
   */
  setIcon: (icon: string) => FabComponent;
  
  /**
   * Gets the FAB's icon HTML content
   * @returns Icon HTML
   */
  getIcon: () => string;
  
  /**
   * Sets the FAB's position
   * @param position - Position value ('top-right', 'bottom-left', etc.)
   * @returns The FAB component for chaining
   */
  setPosition: (position: string) => FabComponent;
  
  /**
   * Gets the current position of the FAB
   * @returns Current position
   */
  getPosition: () => string | null;

  /**
   * Lowers the FAB (useful for pressed state)
   * @returns The FAB component for chaining
   */
  lower: () => FabComponent;
  
  /**
   * Raises the FAB back to its default elevation
   * @returns The FAB component for chaining
   */
  raise: () => FabComponent;
  
  /**
   * Destroys the FAB component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the FAB
   * @param event - Event name ('click', 'focus', etc.)
   * @param handler - Event handler function
   * @returns The FAB component for chaining
   */
  on: (event: string, handler: Function) => FabComponent;
  
  /**
   * Removes an event listener from the FAB
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The FAB component for chaining
   */
  off: (event: string, handler: Function) => FabComponent;
  
  /**
   * Adds CSS classes to the FAB element
   * @param classes - One or more class names to add
   * @returns The FAB component for chaining
   */
  addClass: (...classes: string[]) => FabComponent;
}