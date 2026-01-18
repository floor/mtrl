// src/components/fab/types.ts

/**
 * FAB variants following Material Design 3 guidelines
 *
 * Material Design 3 offers different color variants for the FAB
 * to match visual hierarchy and application color schemes.
 *
 * @category Components
 * @remarks
 * - primary: Uses the primary color, highest emphasis (default)
 * - secondary: Uses the secondary color, medium emphasis
 * - tertiary: Uses the tertiary color, lower emphasis
 * - surface: Uses the surface color with an outline, lowest emphasis
 */
export type FabVariant = "primary" | "secondary" | "tertiary" | "surface";

/**
 * FAB size variants
 *
 * Material Design 3 defines multiple size options for FABs to accommodate
 * different use cases and screen sizes.
 *
 * @category Components
 * @remarks
 * - small: 40px diameter, for compact interfaces or secondary actions
 * - default: 56px diameter, for standard primary actions (default)
 * - large: 96px diameter, for emphasis or touch-focused interfaces
 */
export type FabSize = "small" | "default" | "large";

/**
 * FAB position options
 *
 * Predefined positions for the FAB when used as a floating element.
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
export type FabPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

/**
 * Configuration interface for the FAB component
 *
 * Comprehensive options for creating and customizing a Floating Action Button
 * according to Material Design 3 guidelines.
 *
 * @category Components
 * @see https://m3.material.io/components/floating-action-button/overview
 */
export interface FabConfig {
  /**
   * FAB variant that determines visual styling
   *
   * The color variant affects the FAB's background color, icon color, and elevation.
   *
   * @default 'primary'
   *
   * @example
   * ```typescript
   * // Create a tertiary FAB
   * createFab({ variant: 'tertiary', icon: '<svg>...</svg>' })
   * ```
   */
  variant?: FabVariant | string;

  /**
   * FAB size variant
   *
   * Controls the diameter of the FAB and the appropriate icon size.
   *
   * @default 'default'
   *
   * @example
   * ```typescript
   * // Create a small FAB for a secondary action
   * createFab({ size: 'small', icon: '<svg>...</svg>' })
   *
   * // Create a large FAB for emphasis
   * createFab({ size: 'large', icon: '<svg>...</svg>' })
   * ```
   */
  size?: FabSize | string;

  /**
   * Whether the FAB is initially disabled
   *
   * When disabled, the FAB will have a visually muted appearance
   * and won't respond to user interactions.
   *
   * @default false
   *
   * @example
   * ```typescript
   * // Create a disabled FAB
   * const fab = createFab({
   *   icon: '<svg>...</svg>',
   *   disabled: true
   * });
   *
   * // Later enable it when content is ready
   * loadContent().then(() => {
   *   fab.enable();
   * });
   * ```
   */
  disabled?: boolean;

  /**
   * FAB icon HTML content
   *
   * The icon content can be any valid HTML, but typically contains an SVG icon
   * or a Material Icons ligature. Icons should follow Material Design sizing guidelines
   * (24x24dp for most sizes, scaled appropriately for small or large variants).
   *
   * @example
   * ```typescript
   * // Using an SVG icon
   * createFab({
   *   icon: '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>'
   * });
   *
   * // Using a Material Icons ligature
   * createFab({
   *   icon: '<span class="material-icons">add</span>'
   * });
   * ```
   */
  icon?: string;

  /**
   * Icon size in pixels or other CSS units
   *
   * Allows customizing the icon size beyond the default size for the selected FAB size.
   *
   * @example
   * ```typescript
   * // Create a FAB with a larger icon
   * createFab({
   *   icon: '<svg>...</svg>',
   *   iconSize: '32px'
   * });
   * ```
   */
  iconSize?: string;

  /**
   * Additional CSS classes to add to the FAB
   *
   * Custom classes for styling or identifying the FAB.
   * These classes will be applied in addition to the component's built-in classes.
   *
   * @example
   * ```typescript
   * createFab({
   *   icon: '<svg>...</svg>',
   *   class: 'home-fab pulse-animation'
   * });
   * ```
   */
  class?: string;

  /**
   * Button value attribute
   *
   * Sets the HTML value attribute of the button element, useful when using
   * the FAB in a form context.
   *
   * @example
   * ```typescript
   * createFab({
   *   icon: '<svg>...</svg>',
   *   type: 'submit',
   *   value: 'form-submitted'
   * });
   * ```
   */
  value?: string;

  /**
   * Position of the FAB on the screen
   *
   * Configures the FAB for floating positioning on the screen.
   * Applies appropriate CSS classes to position the FAB in one of the corners.
   *
   * @example
   * ```typescript
   * // Position in the bottom-right corner (common for primary actions)
   * createFab({
   *   icon: '<svg>...</svg>',
   *   position: 'bottom-right'
   * });
   *
   * // Position in the top-left corner
   * createFab({
   *   icon: '<svg>...</svg>',
   *   position: 'top-left'
   * });
   * ```
   */
  position?: FabPosition | string;

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
   * createFab({
   *   icon: '<svg>...</svg>',
   *   type: 'submit'
   * });
   * ```
   */
  type?: "button" | "submit" | "reset";

  /**
   * Accessible label for screen readers
   *
   * Sets the aria-label attribute for accessibility. Required for FABs since
   * they typically contain only an icon without visible text.
   *
   * @example
   * ```typescript
   * createFab({
   *   icon: '<svg>...</svg>',
   *   ariaLabel: 'Add new item'
   * });
   * ```
   */
  ariaLabel?: string;

  /**
   * Whether to enable ripple effect
   *
   * The ripple effect provides visual feedback when the user interacts
   * with the FAB. Follows Material Design interaction patterns.
   *
   * @default true
   *
   * @example
   * ```typescript
   * // Disable the ripple effect
   * createFab({
   *   icon: '<svg>...</svg>',
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
   * createFab({
   *   icon: '<svg>...</svg>',
   *   prefix: 'app'
   * });
   * // Results in classes like: 'app-fab app-fab--primary'
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
   * createFab({
   *   icon: '<svg>...</svg>',
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
   * Whether to show the FAB with an entrance animation
   *
   * When true, the FAB will animate into view when added to the DOM.
   *
   * @default false
   *
   * @example
   * ```typescript
   * // Create an animated entrance FAB
   * createFab({
   *   icon: '<svg>...</svg>',
   *   animate: true
   * });
   * ```
   */
  animate?: boolean;

  /**
   * Index signature for additional configuration options
   * Required for compatibility with core feature interfaces
   */
  [key: string]: unknown;
}

/**
 * FAB component interface
 *
 * Provides methods for interacting with and manipulating a Floating Action Button.
 *
 * @category Components
 */
export interface FabComponent {
  /**
   * The FAB's DOM element
   *
   * Direct access to the underlying button element for DOM manipulation.
   */
  element: HTMLButtonElement;

  /**
   * API for managing FAB icons
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
   * API for managing disabled state
   *
   * Access to low-level disabled state methods.
   */
  disabled: {
    /** Enables the FAB */
    enable: () => void;
    /** Disables the FAB */
    disable: () => void;
    /** Checks if the FAB is disabled */
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
   * const fab = createFab({ icon: '<svg>...</svg>' });
   * const className = fab.getClass('icon'); // Returns 'mtrl-fab__icon'
   * ```
   */
  getClass: (name: string) => string;

  /**
   * Gets the FAB's value attribute
   *
   * @returns FAB value
   *
   * @example
   * ```typescript
   * const fab = createFab({
   *   icon: '<svg>...</svg>',
   *   value: 'action-button'
   * });
   * const value = fab.getValue(); // Returns 'action-button'
   * ```
   */
  getValue: () => string;

  /**
   * Sets the FAB's value attribute
   *
   * @param value - New value
   * @returns The FAB component for chaining
   *
   * @example
   * ```typescript
   * const fab = createFab({ icon: '<svg>...</svg>' });
   * fab.setValue('complete');
   * ```
   */
  setValue: (value: string) => FabComponent;

  /**
   * Enables the FAB (removes disabled attribute)
   *
   * Makes the FAB interactive and visually enabled.
   *
   * @returns The FAB component for chaining
   *
   * @example
   * ```typescript
   * // Enable a previously disabled FAB
   * fab.enable();
   * ```
   */
  enable: () => FabComponent;

  /**
   * Disables the FAB (adds disabled attribute)
   *
   * Makes the FAB non-interactive and visually disabled.
   *
   * @returns The FAB component for chaining
   *
   * @example
   * ```typescript
   * // Disable the FAB during an async operation
   * fab.disable();
   * await saveData();
   * fab.enable();
   * ```
   */
  disable: () => FabComponent;

  /**
   * Sets the FAB's icon
   *
   * @param icon - Icon HTML content
   * @returns The FAB component for chaining
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
  setIcon: (icon: string) => FabComponent;

  /**
   * Gets the FAB's icon HTML content
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
   * Sets the FAB's position
   *
   * Positions the FAB in one of the four corners of the viewport.
   *
   * @param position - Position value ('top-right', 'bottom-left', etc.)
   * @returns The FAB component for chaining
   *
   * @example
   * ```typescript
   * // Move the FAB to the bottom-left corner
   * fab.setPosition('bottom-left');
   * ```
   */
  setPosition: (position: string) => FabComponent;

  /**
   * Gets the current position of the FAB
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
   * Lowers the FAB (useful for pressed state)
   *
   * Visually lowers the FAB by reducing its elevation,
   * typically used to indicate a pressed or active state.
   *
   * @returns The FAB component for chaining
   *
   * @example
   * ```typescript
   * // Visually lower the FAB when a long operation starts
   * fab.lower();
   * await longOperation();
   * fab.raise();
   * ```
   */
  lower: () => FabComponent;

  /**
   * Raises the FAB back to its default elevation
   *
   * Restores the default elevation after it has been lowered.
   *
   * @returns The FAB component for chaining
   *
   * @example
   * ```typescript
   * // Restore normal elevation
   * fab.raise();
   * ```
   */
  raise: () => FabComponent;

  /**
   * Destroys the FAB component and cleans up resources
   *
   * Removes event listeners and prepares the component for garbage collection.
   * Call this method when the FAB is no longer needed.
   *
   * @example
   * ```typescript
   * // Clean up when the component is no longer needed
   * fab.destroy();
   * ```
   */
  destroy: () => void;

  /**
   * Adds an event listener to the FAB
   *
   * @param event - Event name ('click', 'focus', etc.)
   * @param handler - Event handler function
   * @returns The FAB component for chaining
   *
   * @example
   * ```typescript
   * // Add click handler
   * fab.on('click', () => {
   *   console.log('FAB clicked');
   * });
   * ```
   */
  on: (event: string, handler: Function) => FabComponent;

  /**
   * Removes an event listener from the FAB
   *
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The FAB component for chaining
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
  off: (event: string, handler: Function) => FabComponent;

  /**
   * Adds CSS classes to the FAB element
   *
   * @param classes - One or more class names to add
   * @returns The FAB component for chaining
   *
   * @example
   * ```typescript
   * // Add multiple classes
   * fab.addClass('highlight', 'pulse-animation');
   * ```
   */
  addClass: (...classes: string[]) => FabComponent;
}
