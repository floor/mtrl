// src/components/extended-fab/types.ts

/**
 * Extended FAB variants following Material Design 3 guidelines
 * 
 * Material Design 3 offers different color variants for the Extended FAB
 * to match visual hierarchy and application color schemes.
 * 
 * @category Components
 * @remarks
 * - primary: Uses the primary color, highest emphasis (default)
 * - secondary: Uses the secondary color, medium emphasis
 * - tertiary: Uses the tertiary color, lower emphasis
 * - surface: Uses the surface color with an outline, lowest emphasis
 */
export type ExtendedFabVariant = 'primary' | 'secondary' | 'tertiary' | 'surface';

/**
 * Extended FAB width behavior
 * 
 * Controls how the Extended FAB's width is calculated.
 * 
 * @category Components
 * @remarks
 * - fixed: Maintains a constant width regardless of content (default)
 * - fluid: Adjusts width based on content length
 */
export type ExtendedFabWidth = 'fixed' | 'fluid';

/**
 * Extended FAB position on the screen
 * 
 * Predefined positions for the Extended FAB when used as a floating element.
 * These positions automatically apply appropriate margins and positioning.
 * 
 * @category Components
 * @remarks
 * Common patterns:
 * - bottom-right: Most common position for primary actions
 * - bottom-left: Alternative position on left-to-right interfaces
 * - top-right: Used for actions related to top content
 * - top-left: Less common but available for special layouts
 */
export type ExtendedFabPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * Configuration interface for the Extended FAB component
 * 
 * Comprehensive options for creating and customizing an Extended Floating Action Button
 * according to Material Design 3 guidelines.
 * 
 * @category Components
 * @see https://m3.material.io/components/extended-fab/overview
 */
export interface ExtendedFabConfig {
  /** 
   * Extended FAB variant that determines visual styling
   * 
   * The color variant affects the Extended FAB's background color, text color, and elevation.
   * 
   * @default 'primary'
   * 
   * @example
   * ```typescript
   * // Create a tertiary Extended FAB
   * createExtendedFab({ variant: 'tertiary', text: 'Archive' })
   * ```
   */
  variant?: ExtendedFabVariant | string;
  
  /** 
   * Whether the Extended FAB is initially disabled
   * 
   * When disabled, the Extended FAB will have a visually muted appearance
   * and won't respond to user interactions.
   * 
   * @default false
   * 
   * @example
   * ```typescript
   * // Create a disabled Extended FAB
   * const fab = createExtendedFab({ text: 'Submit', disabled: true });
   * 
   * // Later enable it when form is valid
   * validateForm().then(isValid => {
   *   if (isValid) fab.enable();
   * });
   * ```
   */
  disabled?: boolean;
  
  /** 
   * Extended FAB icon HTML content
   * 
   * The icon content can be any valid HTML, but typically contains an SVG icon
   * or a Material Icons ligature. Icons should be 24x24dp following Material guidelines.
   * 
   * @example
   * ```typescript
   * // Using an SVG icon
   * createExtendedFab({
   *   text: 'Add',
   *   icon: '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'
   * });
   * 
   * // Using a Material Icons ligature
   * createExtendedFab({
   *   text: 'Add',
   *   icon: '<span class="material-icons">add</span>'
   * });
   * ```
   */
  icon?: string;
  
  /** 
   * Icon size in pixels or other CSS units
   * 
   * Allows customizing the icon size beyond the default 24px size.
   * 
   * @example
   * ```typescript
   * // Create an Extended FAB with larger icon
   * createExtendedFab({
   *   text: 'Edit',
   *   icon: '<svg>...</svg>',
   *   iconSize: '32px'
   * });
   * ```
   */
  iconSize?: string;
  
  /**
   * Position of the icon relative to the text
   * 
   * Controls whether the icon appears before or after the text label.
   * Material Design 3 guidelines typically recommend the icon at the start position.
   * 
   * @default 'start'
   * 
   * @example
   * ```typescript
   * // Create an Extended FAB with icon after text
   * createExtendedFab({
   *   text: 'Next',
   *   icon: '<span class="material-icons">arrow_forward</span>',
   *   iconPosition: 'end'
   * });
   * ```
   */
  iconPosition?: 'start' | 'end';
  
  /**
   * Text label for the Extended FAB
   * 
   * The text should be short, typically one or two words describing the primary action.
   * Material Design guidelines recommend action verbs that clearly describe the action.
   * 
   * @example
   * ```typescript
   * // Good text labels for Extended FABs
   * createExtendedFab({ text: 'Create' });
   * createExtendedFab({ text: 'Add Task' });
   * createExtendedFab({ text: 'Submit' });
   * ```
   */
  text?: string;
  
  /** 
   * Additional CSS classes to add to the Extended FAB
   * 
   * Custom classes for styling or identifying the Extended FAB.
   * These classes will be applied in addition to the component's built-in classes.
   * 
   * @example
   * ```typescript
   * createExtendedFab({
   *   text: 'Create',
   *   class: 'home-page-fab custom-shadow'
   * });
   * ```
   */
  class?: string;
  
  /** 
   * Button value attribute
   * 
   * Sets the HTML value attribute of the button element, useful when using
   * the Extended FAB in a form context.
   * 
   * @example
   * ```typescript
   * createExtendedFab({
   *   text: 'Submit',
   *   type: 'submit',
   *   value: 'form-submitted'
   * });
   * ```
   */
  value?: string;
  
  /**
   * Position of the Extended FAB on the screen
   * 
   * Configures the Extended FAB for floating positioning on the screen.
   * Applies appropriate CSS classes to position the Extended FAB in one of the corners.
   * 
   * @example
   * ```typescript
   * // Position in the bottom-right corner (common for primary actions)
   * createExtendedFab({
   *   text: 'Create',
   *   position: 'bottom-right'
   * });
   * 
   * // Position in the top-left corner
   * createExtendedFab({
   *   text: 'Go back',
   *   position: 'top-left'
   * });
   * ```
   */
  position?: ExtendedFabPosition | string;
  
  /** 
   * Button type attribute
   * 
   * Sets the HTML type attribute of the button element.
   * 
   * @default 'button'
   * 
   * @example
   * ```typescript
   * // Use as a form submit button
   * createExtendedFab({
   *   text: 'Submit',
   *   type: 'submit'
   * });
   * ```
   */
  type?: 'button' | 'submit' | 'reset';
  
  /**
   * Accessible label for screen readers
   * 
   * Sets the aria-label attribute for accessibility. Especially important
   * if the Extended FAB doesn't include text content.
   * 
   * @example
   * ```typescript
   * createExtendedFab({
   *   text: 'Create',
   *   icon: '<svg>...</svg>',
   *   ariaLabel: 'Create new document'
   * });
   * ```
   */
  ariaLabel?: string;
  
  /** 
   * Whether to enable ripple effect
   * 
   * The ripple effect provides visual feedback when the user interacts
   * with the Extended FAB. Follows Material Design interaction patterns.
   * 
   * @default true
   * 
   * @example
   * ```typescript
   * // Disable the ripple effect
   * createExtendedFab({
   *   text: 'Create',
   *   ripple: false
   * });
   * ```
   */
  ripple?: boolean;

  /**
   * Component prefix for class names
   * 
   * The prefix used for BEM-style class names.
   * 
   * @default 'mtrl'
   * 
   * @example
   * ```typescript
   * // Use a custom prefix for class names
   * createExtendedFab({
   *   text: 'Create',
   *   prefix: 'app'
   * });
   * // Results in classes like: 'app-extended-fab app-extended-fab--primary'
   * ```
   */
  prefix?: string;
  
  /**
   * Component name used in class generation
   * 
   * @internal
   */
  componentName?: string;
  
  /** 
   * Ripple effect configuration
   * 
   * Fine-grained control over the ripple effect appearance and behavior.
   * 
   * @example
   * ```typescript
   * // Customize ripple effect
   * createExtendedFab({
   *   text: 'Create',
   *   rippleConfig: {
   *     duration: 400,
   *     timing: 'ease-out',
   *     opacity: ['0.5', '0']
   *   }
   * });
   * ```
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
   * 
   * When true, the Extended FAB will animate into view when added to the DOM.
   * 
   * @default false
   * 
   * @example
   * ```typescript
   * // Create an animated entrance Extended FAB
   * createExtendedFab({
   *   text: 'Create',
   *   animate: true
   * });
   * ```
   */
  animate?: boolean;
  
  /**
   * Width behavior of the Extended FAB
   * 
   * Controls how the Extended FAB's width is calculated:
   * - 'fixed': Maintains a constant width regardless of content (default)
   * - 'fluid': Adjusts width based on content length
   * 
   * @default 'fixed'
   * 
   * @example
   * ```typescript
   * // Create an Extended FAB that adjusts width based on text length
   * createExtendedFab({
   *   text: 'Add to favorites',
   *   width: 'fluid'
   * });
   * ```
   */
  width?: ExtendedFabWidth | string;
  
  /**
   * Whether the Extended FAB should collapse to a standard FAB on scroll
   * 
   * When true, the Extended FAB will automatically shrink to a circular FAB
   * (hiding the text) when the user scrolls down, and expand back to the Extended FAB
   * when scrolling up.
   * 
   * @default false
   * 
   * @example
   * ```typescript
   * // Create a collapsible Extended FAB
   * createExtendedFab({
   *   text: 'Create',
   *   icon: '<svg>...</svg>',
   *   collapseOnScroll: true
   * });
   * ```
   */
  collapseOnScroll?: boolean;
}

/**
 * Extended FAB component interface
 * 
 * Provides methods for interacting with and manipulating an Extended Floating Action Button.
 * 
 * @category Components
 */
export interface ExtendedFabComponent {
  /** 
   * The Extended FAB's DOM element 
   * 
   * Direct access to the underlying button element for DOM manipulation.
   */
  element: HTMLButtonElement;
  
  /** 
   * API for managing Extended FAB icons 
   * 
   * Access to low-level icon methods and elements.
   */
  icon: {
    /** Sets the icon HTML content */
    setIcon: (html: string) => any;
    /** Gets the current icon HTML content */
    getIcon: () => string;
    /** Gets the icon DOM element */
    getElement: () => HTMLElement | null;
  };
  
  /** 
   * API for managing text content 
   * 
   * Access to low-level text methods and elements.
   */
  text: {
    /** Sets the text content */
    setText: (text: string) => any;
    /** Gets the current text content */
    getText: () => string;
    /** Gets the text DOM element */
    getElement: () => HTMLElement | null;
  };
  
  /** 
   * API for managing disabled state 
   * 
   * Access to low-level disabled state methods.
   */
  disabled: {
    /** Enables the Extended FAB */
    enable: () => void;
    /** Disables the Extended FAB */
    disable: () => void;
    /** Checks if the Extended FAB is disabled */
    isDisabled: () => boolean;
  };
  
  /** 
   * API for managing component lifecycle 
   * 
   * Access to low-level lifecycle methods.
   */
  lifecycle: {
    /** Destroys the component and cleans up resources */
    destroy: () => void;
  };
  
  /**
   * Gets a class name with the component's prefix
   * 
   * @param name - Base class name
   * @returns Prefixed class name
   * 
   * @example
   * ```typescript
   * const fab = createExtendedFab({ text: 'Create' });
   * const className = fab.getClass('icon'); // Returns 'mtrl-extended-fab__icon'
   * ```
   */
  getClass: (name: string) => string;
  
  /**
   * Gets the Extended FAB's value attribute
   * 
   * @returns Extended FAB value
   * 
   * @example
   * ```typescript
   * const fab = createExtendedFab({ text: 'Submit', value: 'form-data' });
   * const value = fab.getValue(); // Returns 'form-data'
   * ```
   */
  getValue: () => string;
  
  /**
   * Sets the Extended FAB's value attribute
   * 
   * @param value - New value
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * const fab = createExtendedFab({ text: 'Submit' });
   * fab.setValue('completed');
   * ```
   */
  setValue: (value: string) => ExtendedFabComponent;
  
  /**
   * Enables the Extended FAB (removes disabled attribute)
   * 
   * Makes the Extended FAB interactive and visually enabled.
   * 
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Enable a previously disabled Extended FAB
   * fab.enable();
   * ```
   */
  enable: () => ExtendedFabComponent;
  
  /**
   * Disables the Extended FAB (adds disabled attribute)
   * 
   * Makes the Extended FAB non-interactive and visually disabled.
   * 
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Disable the Extended FAB during an async operation
   * fab.disable();
   * await saveData();
   * fab.enable();
   * ```
   */
  disable: () => ExtendedFabComponent;
  
  /**
   * Sets the Extended FAB's icon
   * 
   * @param icon - Icon HTML content
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Change the icon dynamically
   * fab.setIcon('<svg>...</svg>');
   * 
   * // Change to a Material Icons ligature
   * fab.setIcon('<span class="material-icons">edit</span>');
   * ```
   */
  setIcon: (icon: string) => ExtendedFabComponent;
  
  /**
   * Gets the Extended FAB's icon HTML content
   * 
   * @returns Icon HTML
   * 
   * @example
   * ```typescript
   * const iconHtml = fab.getIcon();
   * ```
   */
  getIcon: () => string;
  
  /**
   * Sets the Extended FAB's text content
   * 
   * @param text - Text content
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Change text dynamically based on state
   * if (isEditing) {
   *   fab.setText('Save');
   * } else {
   *   fab.setText('Edit');
   * }
   * ```
   */
  setText: (text: string) => ExtendedFabComponent;
  
  /**
   * Gets the Extended FAB's text content
   * 
   * @returns Text content
   * 
   * @example
   * ```typescript
   * const currentText = fab.getText();
   * ```
   */
  getText: () => string;
  
  /**
   * Sets the Extended FAB's position
   * 
   * Positions the Extended FAB in one of the four corners of the viewport.
   * 
   * @param position - Position value ('top-right', 'bottom-left', etc.)
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Move the Extended FAB to the bottom-left corner
   * fab.setPosition('bottom-left');
   * ```
   */
  setPosition: (position: string) => ExtendedFabComponent;
  
  /**
   * Gets the current position of the Extended FAB
   * 
   * @returns Current position or null if not positioned
   * 
   * @example
   * ```typescript
   * const position = fab.getPosition(); // Returns 'bottom-right', 'top-left', etc.
   * ```
   */
  getPosition: () => string | null;

  /**
   * Lowers the Extended FAB (useful for pressed state)
   * 
   * Visually lowers the Extended FAB by reducing its elevation,
   * typically used to indicate a pressed or active state.
   * 
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Visually lower the Extended FAB when a long operation starts
   * fab.lower();
   * await longOperation();
   * fab.raise();
   * ```
   */
  lower: () => ExtendedFabComponent;
  
  /**
   * Raises the Extended FAB back to its default elevation
   * 
   * Restores the default elevation after it has been lowered.
   * 
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Restore normal elevation
   * fab.raise();
   * ```
   */
  raise: () => ExtendedFabComponent;
  
  /**
   * Collapses the Extended FAB into a standard FAB
   * 
   * Hides the text label, showing only the icon in a circular container.
   * Useful for saving space or to emphasize other content.
   * 
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Collapse the Extended FAB programmatically
   * fab.collapse();
   * ```
   */
  collapse: () => ExtendedFabComponent;
  
  /**
   * Expands a collapsed Extended FAB back to its full size
   * 
   * Shows the text label alongside the icon.
   * 
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Expand the Extended FAB programmatically
   * fab.expand();
   * ```
   */
  expand: () => ExtendedFabComponent;
  
  /**
   * Destroys the Extended FAB component and cleans up resources
   * 
   * Removes event listeners and prepares the component for garbage collection.
   * Call this method when the Extended FAB is no longer needed.
   * 
   * @example
   * ```typescript
   * // Clean up when the component is no longer needed
   * fab.destroy();
   * ```
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the Extended FAB
   * 
   * @param event - Event name ('click', 'focus', etc.)
   * @param handler - Event handler function
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Add click handler
   * fab.on('click', () => {
   *   console.log('Extended FAB clicked');
   * });
   * 
   * // Add custom event handler for collapse
   * fab.on('collapse', () => {
   *   console.log('Extended FAB collapsed');
   * });
   * ```
   */
  on: (event: string, handler: Function) => ExtendedFabComponent;
  
  /**
   * Removes an event listener from the Extended FAB
   * 
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Remove a previously added event handler
   * const handler = () => console.log('Clicked');
   * fab.on('click', handler);
   * // Later...
   * fab.off('click', handler);
   * ```
   */
  off: (event: string, handler: Function) => ExtendedFabComponent;
  
  /**
   * Adds CSS classes to the Extended FAB element
   * 
   * @param classes - One or more class names to add
   * @returns The Extended FAB component for chaining
   * 
   * @example
   * ```typescript
   * // Add multiple classes
   * fab.addClass('highlight', 'pulse-animation');
   * ```
   */
  addClass: (...classes: string[]) => ExtendedFabComponent;
}