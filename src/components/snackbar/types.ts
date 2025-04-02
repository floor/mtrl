// src/components/snackbar/types.ts

/**
 * Available snackbar variants
 */
export type SnackbarVariant = 'basic' | 'action';

/**
 * Snackbar visual variants
 */
export const SNACKBAR_VARIANTS = {
  BASIC: 'basic',
  ACTION: 'action' // With action button
} as const;

/**
 * Available snackbar positions
 */
export type SnackbarPosition = 'center' | 'start' | 'end';

/**
 * Snackbar display positions
 */
export const SNACKBAR_POSITIONS = {
  CENTER: 'center',
  START: 'start',
  END: 'end'
} as const;

/**
 * Snackbar visibility states
 */
export type SnackbarState = 'visible' | 'hidden';

/**
 * Snackbar state classes
 */
export const SNACKBAR_STATES = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden'
} as const;

/**
 * Available snackbar event types
 */
export type SnackbarEventType = 'open' | 'close' | 'action';

/**
 * Snackbar event data
 * @interface SnackbarEvent
 */
export interface SnackbarEvent {
  /** The snackbar component that triggered the event */
  snackbar: SnackbarComponent;
  
  /** Original DOM event if available */
  originalEvent: Event | null;
  
  /** Function to prevent default behavior */
  preventDefault: () => void;
  
  /** Whether default behavior was prevented */
  defaultPrevented: boolean;
}

/**
 * Configuration options for the snackbar component
 * @interface SnackbarConfig
 */
export interface SnackbarConfig {
  /** Visual variant of the snackbar */
  variant?: SnackbarVariant;
  
  /** Position of the snackbar on screen */
  position?: SnackbarPosition;
  
  /** Text message to display */
  message: string;
  
  /** Action button text (for 'action' variant) */
  action?: string;
  
  /** Duration in milliseconds to show the snackbar (0 for indefinite) */
  duration?: number;
  
  /** Action button callback function */
  onAction?: (event: SnackbarEvent) => void;
  
  /** Callback function when the snackbar opens */
  onOpen?: (event: SnackbarEvent) => void;
  
  /** Callback function when the snackbar closes */
  onClose?: (event: SnackbarEvent) => void;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Component prefix for CSS classes */
  prefix?: string;
  
  /** Component name for CSS classes */
  componentName?: string;
  
  /** Event handlers for snackbar events */
  on?: {
    [key in SnackbarEventType]?: (event: SnackbarEvent) => void;
  };
}

/**
 * Snackbar component public API interface
 * @interface SnackbarComponent
 */
export interface SnackbarComponent {
  /** The root element of the snackbar */
  element: HTMLElement;
  
  /** Current state of the snackbar */
  state: SnackbarState;
  
  /** Displays the snackbar */
  show: () => SnackbarComponent;
  
  /** Hides the snackbar */
  hide: () => SnackbarComponent;
  
  /** Sets the message text */
  setMessage: (message: string) => SnackbarComponent;
  
  /** Gets the message text */
  getMessage: () => string;
  
  /** Sets the action button text */
  setAction: (text: string) => SnackbarComponent;
  
  /** Gets the action button text */
  getAction: () => string;
  
  /** Sets the display duration */
  setDuration: (duration: number) => SnackbarComponent;
  
  /** Gets the display duration */
  getDuration: () => number;
  
  /** Sets the snackbar position */
  setPosition: (position: SnackbarPosition) => SnackbarComponent;
  
  /** Gets the snackbar position */
  getPosition: () => SnackbarPosition;
  
  /** Adds event listener */
  on: (event: SnackbarEventType, handler: (event: SnackbarEvent) => void) => SnackbarComponent;
  
  /** Removes event listener */
  off: (event: SnackbarEventType, handler: (event: SnackbarEvent) => void) => SnackbarComponent;
  
  /** Destroys the snackbar component and cleans up resources */
  destroy: () => void;
}