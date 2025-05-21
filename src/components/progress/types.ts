// src/components/progress/types.ts

/**
 * Progress variant types
 * @category Components
 */
export type ProgressVariant = 'linear' | 'circular';

/**
 * Progress thickness options
 * @category Components
 */
export type ProgressThickness = 'thin' | 'default' | 'thick' | number;

/**
 * Progress component event types
 * @category Components
 */
export type ProgressEvent = 'change' | 'complete';

/**
 * Configuration interface for the Progress component
 * @category Components
 */
export interface ProgressConfig {
  /** 
   * Progress variant that determines visual style
   * @default 'linear'
   */
  variant?: ProgressVariant;
  
  /** 
   * Initial progress value (0-100)
   * @default 0
   */
  value?: number;
  
  /** 
   * Whether the progress indicator is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Maximum value 
   * @default 100
   */
  max?: number;
  
  /** 
   * Buffer value for linear progress with buffer (like video loading)
   * @default 0
   */
  buffer?: number;
  
  /** 
   * Additional CSS classes to add to the progress component
   */
  class?: string;
  
  /** 
   * Thickness of the progress track and indicator
   * Can be a named preset ('thin', 'default', 'thick') or a specific number in pixels
   * @default 'default'
   */
  thickness?: ProgressThickness;

  /** 
   * Whether to show text label with percentage
   * @default false
   */
  showLabel?: boolean;
  
  /** 
   * Whether progress is indeterminate (shows animation without specific value)
   * @default false
   */
  indeterminate?: boolean;
  
  /** 
   * Custom label formatter function
   */
  labelFormatter?: (value: number, max: number) => string;
  
  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;
  
  /**
   * Component name used in class generation
   * @default 'progress'
   */
  componentName?: string;
  
  /**
   * DOM structure schema
   * @internal
   */
  schema?: any;
}

/**
 * Progress component interface
 * @category Components
 */
export interface ProgressComponent {
  /** The component's root DOM element */
  element: HTMLElement;
  
  /** The track element (unfilled part) - always an SVG element */
  track: SVGElement;
  
  /** The indicator element (filled part) - always an SVG element */
  indicator: SVGElement;
  
  /** The buffer element for linear variant (pre-loaded state) - always an SVG element */
  buffer?: SVGElement;
  
  /**
   * Gets a class name with the component's prefix
   * @param name - Base class name
   * @returns Prefixed class name
   */
  getClass: (name: string) => string;
  
  /**
   * Sets the current progress value
   * @param value - Progress value (between 0 and max)
   * @returns The progress component for chaining
   */
  setValue: (value: number) => ProgressComponent;
  
  /**
   * Gets the current progress value
   * @returns Current progress value
   */
  getValue: () => number;
  
  /**
   * Gets the maximum progress value
   * @returns Maximum progress value
   */
  getMax: () => number;
  
  /**
   * Sets the buffer value (for linear variant with buffer indicators)
   * @param value - Buffer value (between 0 and max)
   * @returns The progress component for chaining
   */
  setBuffer: (value: number) => ProgressComponent;
  
  /**
   * Gets the current buffer value
   * @returns Current buffer value
   */
  getBuffer: () => number;
  
  /**
   * Enables the progress component
   * @returns The progress component for chaining
   */
  enable: () => ProgressComponent;
  
  /**
   * Disables the progress component
   * @returns The progress component for chaining
   */
  disable: () => ProgressComponent;
  
  /**
   * Checks if the component is disabled
   * @returns Whether the component is disabled
   */
  isDisabled: () => boolean;
  
  /**
   * Shows the label element
   * @returns The progress component for chaining
   */
  showLabel: () => ProgressComponent;
  
  /**
   * Hides the label element
   * @returns The progress component for chaining
   */
  hideLabel: () => ProgressComponent;
  
  /**
   * Sets a custom formatter for the label
   * @param formatter - Function that formats the label text
   * @returns The progress component for chaining
   */
  setLabelFormatter: (formatter: (value: number, max: number) => string) => ProgressComponent;
  
  /**
   * Sets the thickness of the progress track and indicator
   * @param thickness - Thickness value ('thin', 'default', 'thick' or number in pixels)
   * @returns The progress component for chaining
   */
  setThickness: (thickness: ProgressThickness) => ProgressComponent;
  
  /**
   * Gets the current thickness value in pixels
   * @returns Current thickness in pixels
   */
  getThickness: () => number;
  
  /**
   * Sets the indeterminate state
   * @param indeterminate - Whether progress is indeterminate
   * @returns The progress component for chaining
   */
  setIndeterminate: (indeterminate: boolean) => ProgressComponent;
  
  /**
   * Checks if the component is in indeterminate state
   * @returns Whether the component is indeterminate
   */
  isIndeterminate: () => boolean;
  
  /**
   * Adds an event listener to the progress
   * @param event - Event name ('change', 'complete')
   * @param handler - Event handler function
   * @returns The progress component for chaining
   */
  on: (event: string, handler: Function) => ProgressComponent;
  
  /**
   * Removes an event listener from the progress
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The progress component for chaining
   */
  off: (event: string, handler: Function) => ProgressComponent;
  
  /**
   * Destroys the progress component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Adds CSS classes to the progress element
   * @param classes - One or more class names to add
   * @returns The progress component for chaining
   */
  addClass: (...classes: string[]) => ProgressComponent;
  
  /**
   * API for managing disabled state
   */
  disabled: {
    /** Enables the progress */
    enable: () => void;
    /** Disables the progress */
    disable: () => void;
    /** Checks if the progress is disabled */
    isDisabled: () => boolean;
  };
  
  /**
   * API for managing component lifecycle
   */
  lifecycle: {
    /** Destroys the component and cleans up resources */
    destroy: () => void;
  };
}