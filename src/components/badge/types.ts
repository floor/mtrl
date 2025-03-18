// src/components/badge/types.ts

/**
 * Badge variant types
 * @category Components
 */
export type BadgeVariant = 'small' | 'large';

/**
 * Badge color types
 * @category Components
 */
export type BadgeColor = 'error' | 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'info';

/**
 * Badge position types
 * @category Components
 */
export type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

/**
 * Configuration interface for the Badge component
 * Following Material Design 3 specifications
 */
export interface BadgeConfig {
  /** 
   * Badge variant (small dot or large numbered)
   * Small badge (6dp) or Large badge (16dp height)
   * @default 'large'
   */
  variant?: BadgeVariant | string;
  
  /** 
   * Badge color (error is default)
   * @default 'error'
   */
  color?: BadgeColor | string;
  
  /** 
   * Badge position relative to its container
   * @default 'top-right' 
   */
  position?: BadgePosition | string;
  
  /** 
   * Text label inside the badge (for large badges)
   * Up to 4 characters, with "+" for overflow 
   */
  label?: string | number;
  
  /** 
   * Maximum value to display (shows "{max}+" if label exceeds max)
   * Usually 999+ for large numbers
   */
  max?: number;
  
  /** Whether the badge should be visible */
  visible?: boolean;
  
  /** Target element to which badge will be attached */
  target?: HTMLElement;
  
  /** Additional CSS classes */
  class?: string;
  
  /** CSS class prefix */
  prefix?: string;
  
  /** Component name */
  componentName?: string;
}

/**
 * Badge component interface
 * Following Material Design 3 specifications
 */
export interface BadgeComponent {
  /** Badge element */
  element: HTMLElement;
  
  /** Badge wrapper element (if badge is attached to target) */
  wrapper?: HTMLElement;
  
  /** Sets badge text label */
  setLabel: (label: string | number) => BadgeComponent;
  
  /** Gets badge text label */
  getLabel: () => string;
  
  /** Shows the badge */
  show: () => BadgeComponent;
  
  /** Hides the badge */
  hide: () => BadgeComponent;
  
  /** Toggles badge visibility */
  toggle: (visible?: boolean) => BadgeComponent;
  
  /** Checks if the badge is visible */
  isVisible: () => boolean;
  
  /** Sets maximum value (after which badge shows max+) */
  setMax: (max: number) => BadgeComponent;
  
  /** Sets badge color */
  setColor: (color: BadgeColor | string) => BadgeComponent;
  
  /** Sets badge variant */
  setVariant: (variant: BadgeVariant | string) => BadgeComponent;
  
  /** Sets badge position */
  setPosition: (position: BadgePosition | string) => BadgeComponent;
  
  /** Attaches badge to a target element */
  attachTo: (target: HTMLElement) => BadgeComponent;
  
  /** Makes badge standalone (removes from wrapper) */
  detach: () => BadgeComponent;
  
  /** Destroys the badge component and cleans up resources */
  destroy: () => void;
  
  /** Gets the class with the specified name */
  getClass: (name: string) => string;
  
  /** Add CSS classes */
  addClass: (...classes: string[]) => BadgeComponent;
  
  /** Remove CSS classes */
  removeClass: (...classes: string[]) => BadgeComponent;
  
  /** Add event listener */
  on: (event: string, handler: Function) => BadgeComponent;
  
  /** Remove event listener */
  off: (event: string, handler: Function) => BadgeComponent;
}