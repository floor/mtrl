// src/components/badge/types.ts

/**
 * Badge variant types - determines the badge size and appearance
 * @category Components
 * @remarks
 * - small: A 6dp circular dot badge without text (for notification indicators)
 * - large: A 16dp height badge that can contain text (for counts or short labels)
 */
export type BadgeVariant = 'small' | 'large';

/**
 * Badge color types - determines the badge's background color
 * @category Components
 * @remarks
 * Based on Material Design 3 color system:
 * - error: Red color for error states (default)
 * - primary: Primary theme color
 * - secondary: Secondary theme color
 * - tertiary: Tertiary theme color
 * - success: Green color for success states
 * - warning: Orange/yellow color for warning states
 * - info: Blue color for information states
 */
export type BadgeColor = 'error' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'info';

/**
 * Badge position types - determines where the badge appears relative to its target
 * @category Components
 * @remarks
 * - top-right: Position in the top-right corner (default)
 * - top-left: Position in the top-left corner
 * - bottom-right: Position in the bottom-right corner
 * - bottom-left: Position in the bottom-left corner
 */
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * Configuration interface for the Badge component
 * @category Components
 * @description
 * Defines the appearance and behavior of a badge component.
 * All properties are optional with sensible defaults.
 */
export interface BadgeConfig {
  /** 
   * Badge variant (small dot or large numbered)
   * Small badge (6dp) or Large badge (16dp height)
   * @default 'large'
   * @example 'small' | 'large'
   */
  variant?: BadgeVariant | string;
  
  /** 
   * Badge color (follows Material Design 3 color system)
   * @default 'error'
   * @example 'error' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'info'
   */
  color?: BadgeColor | string;
  
  /** 
   * Badge position relative to its container element
   * @default 'top-right' 
   * @example 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
   */
  position?: BadgePosition | string;
  
  /** 
   * Text label inside the badge (for large badges)
   * Up to 4 characters, numbers exceeding max will show "{max}+"
   * @example "3" | "99+" | "New"
   */
  label?: string | number;
  
  /** 
   * Maximum value to display (shows "{max}+" if label exceeds max)
   * Usually 999+ for large numbers
   * @example 99 | 999
   */
  max?: number;
  
  /** 
   * Whether the badge should be initially visible
   * @default true
   */
  visible?: boolean;
  
  /** 
   * Target element to which badge will be attached
   * When provided, the badge will be positioned relative to this element
   */
  target?: HTMLElement;
  
  /** 
   * Additional CSS classes to apply to the badge element
   * @example "custom-badge highlighted-badge"
   */
  class?: string;
  
  /** 
   * CSS class prefix for all badge classes
   * @default "mtrl"
   */
  prefix?: string;
  
  /** 
   * Component name used in CSS class generation
   * @default "badge"
   * @internal
   */
  componentName?: string;
}

/**
 * Badge component interface
 * Provides methods for controlling a Material Design 3 badge
 * 
 * @category Components
 */
export interface BadgeComponent {
  /** 
   * The badge's root DOM element
   */
  element: HTMLElement;
  
  /** 
   * Badge wrapper element (if badge is attached to target)
   * This is the parent element that contains both the target and the badge
   */
  wrapper?: HTMLElement;
  
  /**
   * Sets the badge's text label
   * @param label - Text or number to display in the badge
   * @returns Badge component for method chaining
   * @example
   * badge.setLabel(5); // Shows "5"
   * badge.setLabel("New"); // Shows "New"
   * badge.setLabel(1250); // With max=999, shows "999+"
   */
  setLabel: (label: string | number) => BadgeComponent;
  
  /**
   * Gets the badge's current text label
   * @returns Current text content of the badge
   */
  getLabel: () => string;
  
  /**
   * Shows the badge (makes it visible)
   * @returns Badge component for method chaining
   */
  show: () => BadgeComponent;
  
  /**
   * Hides the badge (makes it invisible)
   * @returns Badge component for method chaining
   */
  hide: () => BadgeComponent;
  
  /**
   * Toggles badge visibility
   * @param visible - Optional explicit visibility state
   * @returns Badge component for method chaining
   * @example
   * badge.toggle(); // Toggles current state
   * badge.toggle(true); // Forces visible
   */
  toggle: (visible?: boolean) => BadgeComponent;
  
  /**
   * Checks if the badge is currently visible
   * @returns True if badge is visible, false otherwise
   */
  isVisible: () => boolean;
  
  /**
   * Sets maximum value (after which badge shows max+)
   * @param max - Maximum number to display before showing "+"
   * @returns Badge component for method chaining
   * @example
   * badge.setMax(99); // Shows "99+" for values > 99
   */
  setMax: (max: number) => BadgeComponent;
  
  /**
   * Sets badge color
   * @param color - Badge color from Material Design 3 palette
   * @returns Badge component for method chaining
   * @example
   * badge.setColor('primary');
   * badge.setColor(BADGE_COLORS.SUCCESS);
   */
  setColor: (color: BadgeColor | string) => BadgeComponent;
  
  /**
   * Sets badge variant (size style)
   * @param variant - Badge variant ('small' or 'large')
   * @returns Badge component for method chaining
   * @example
   * badge.setVariant('small'); // Dot indicator
   * badge.setVariant(BADGE_VARIANTS.LARGE); // Numbered indicator
   */
  setVariant: (variant: BadgeVariant | string) => BadgeComponent;
  
  /**
   * Sets badge position relative to target
   * @param position - Badge position
   * @returns Badge component for method chaining
   * @example
   * badge.setPosition('bottom-left');
   */
  setPosition: (position: BadgePosition | string) => BadgeComponent;
  
  /**
   * Attaches badge to a target element
   * @param target - Element to attach badge to
   * @returns Badge component for method chaining
   * @example
   * badge.attachTo(document.querySelector('#notification-bell'));
   */
  attachTo: (target: HTMLElement) => BadgeComponent;
  
  /**
   * Makes badge standalone (removes from wrapper)
   * @returns Badge component for method chaining
   */
  detach: () => BadgeComponent;
  
  /**
   * Destroys the badge component and cleans up resources
   * Removes the badge from the DOM and clears event listeners
   */
  destroy: () => void;
  
  /**
   * Gets a class name with the component's prefix
   * @param name - Base class name
   * @returns Prefixed class name
   * @internal
   */
  getClass: (name: string) => string;
  
  /**
   * Adds CSS classes to the badge element
   * @param classes - One or more class names to add
   * @returns Badge component for method chaining
   * @example
   * badge.addClass('highlighted', 'animated');
   */
  addClass: (...classes: string[]) => BadgeComponent;
  
  /**
   * Removes CSS classes from the badge element
   * @param classes - One or more class names to remove
   * @returns Badge component for method chaining
   * @example
   * badge.removeClass('highlighted', 'animated');
   */
  removeClass: (...classes: string[]) => BadgeComponent;
  
  /**
   * Adds an event listener to the badge
   * @param event - Event name ('click', 'mouseover', etc.)
   * @param handler - Event handler function
   * @returns Badge component for method chaining
   * @example
   * badge.on('click', () => console.log('Badge clicked'));
   */
  on: (event: string, handler: Function) => BadgeComponent;
  
  /**
   * Removes an event listener from the badge
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Badge component for method chaining
   */
  off: (event: string, handler: Function) => BadgeComponent;
}