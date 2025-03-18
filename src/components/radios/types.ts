// src/components/radios/types.ts

/**
 * Configuration for a radio option in the Radios component
 * @category Components
 */
export interface RadioOptionConfig {
  /** 
   * Radio input value attribute
   * @example 'option1'
   */
  value: string;
  
  /** 
   * Radio label text content
   * @example 'Option 1'
   */
  label: string;
  
  /** 
   * Whether the radio is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether to position the label before the radio
   * @default false
   */
  labelBefore?: boolean;
}

/**
 * Configuration interface for the Radios component
 * @category Components
 */
export interface RadiosConfig {
  /** 
   * Radio input name attribute used for grouping radios
   * @example 'options'
   */
  name: string;
  
  /** 
   * Array of radio option configurations
   */
  options?: RadioOptionConfig[];
  
  /** 
   * Initial selected value
   */
  value?: string;
  
  /** 
   * Whether the entire group is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Whether to enable ripple effect
   * @default true
   */
  ripple?: boolean;
  
  /** 
   * Additional CSS classes to add to the radios component
   */
  class?: string;
  
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
}

/**
 * Interface for a single radio in the Radios component
 * @category Components
 */
export interface RadioItem {
  /** The radio container element */
  element: HTMLElement;
  
  /** The actual radio input element */
  input: HTMLInputElement;
  
  /** The label element */
  label: HTMLLabelElement;
  
  /** The radio option configuration */
  config: RadioOptionConfig;
  
  /** Destroys the radio and removes event listeners */
  destroy: () => void;
}

/**
 * Radios component interface
 * @category Components
 */
export interface RadiosComponent {
  /** The radios container DOM element */
  element: HTMLElement;
  
  /** Array of radio items in the group */
  radios: RadioItem[];
  
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
   * Gets the radios component name
   * @returns Selected radio value or empty string if none selected
   */
  getValue: () => string;
  
  /**
   * Sets the radios component value (selects a radio)
   * @param value - Value to select
   * @returns The radios component for chaining
   */
  setValue: (value: string) => RadiosComponent;
  
  /**
   * Gets the selected radio option's configuration
   * @returns The selected radio option config or null
   */
  getSelected: () => RadioOptionConfig | null;
  
  /**
   * Adds a radio option to the radios component
   * @param option - Radio option configuration
   * @returns The radios component for chaining
   */
  addOption: (option: RadioOptionConfig) => RadiosComponent;
  
  /**
   * Removes a radio option from the radios component
   * @param value - Value of the radio to remove
   * @returns The radios component for chaining
   */
  removeOption: (value: string) => RadiosComponent;
  
  /**
   * Enables the radios component
   * @returns The radios component for chaining
   */
  enable: () => RadiosComponent;
  
  /**
   * Disables the radios component
   * @returns The radios component for chaining
   */
  disable: () => RadiosComponent;
  
  /**
   * Enables a specific radio option
   * @param value - Value of the radio to enable
   * @returns The radios component for chaining
   */
  enableOption: (value: string) => RadiosComponent;
  
  /**
   * Disables a specific radio option
   * @param value - Value of the radio to disable
   * @returns The radios component for chaining
   */
  disableOption: (value: string) => RadiosComponent;
  
  /**
   * Destroys the radios component and all radio items
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the radios component
   * @param event - Event name ('change')
   * @param handler - Event handler function
   * @returns The radios component for chaining
   */
  on: (event: string, handler: Function) => RadiosComponent;
  
  /**
   * Removes an event listener from the radios component
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The radios component for chaining
   */
  off: (event: string, handler: Function) => RadiosComponent;
}