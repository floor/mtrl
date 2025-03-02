// src/components/badge/types.ts
import { BADGE_VARIANTS, BADGE_SIZES, BADGE_COLORS, BADGE_POSITIONS } from './constants';

/**
 * Configuration interface for the Badge component
 */
export interface BadgeConfig {
  /** Badge variant (standard, dot, outlined) */
  variant?: keyof typeof BADGE_VARIANTS | BADGE_VARIANTS;
  
  /** Badge size (small, medium, large) */
  size?: keyof typeof BADGE_SIZES | BADGE_SIZES;
  
  /** Badge color (primary, secondary, tertiary, error, success, warning, info) */
  color?: keyof typeof BADGE_COLORS | BADGE_COLORS;
  
  /** Badge position relative to its container (top-right, top-left, bottom-right, bottom-left) */
  position?: keyof typeof BADGE_POSITIONS | BADGE_POSITIONS;
  
  /** Text content inside the badge */
  content?: string | number;
  
  /** Maximum value to display (shows "{max}+" if content exceeds max) */
  max?: number;
  
  /** Whether the badge should be visible */
  visible?: boolean;
  
  /** Whether the badge should be standalone (not attached to another element) */
  standalone?: boolean;
  
  /** Target element to which badge will be attached */
  target?: HTMLElement;
  
  /** Additional CSS classes */
  class?: string;
}

/**
 * Badge component interface
 */
export interface BadgeComponent {
  /** Badge element */
  element: HTMLElement;
  
  /** Badge wrapper element (if badge is attached to target) */
  wrapper?: HTMLElement;
  
  /** Sets badge text content */
  setContent: (content: string | number) => BadgeComponent;
  
  /** Gets badge text content */
  getContent: () => string;
  
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
  setColor: (color: keyof typeof BADGE_COLORS | BADGE_COLORS) => BadgeComponent;
  
  /** Sets badge variant */
  setVariant: (variant: keyof typeof BADGE_VARIANTS | BADGE_VARIANTS) => BadgeComponent;
  
  /** Sets badge size */
  setSize: (size: keyof typeof BADGE_SIZES | BADGE_SIZES) => BadgeComponent;
  
  /** Sets badge position */
  setPosition: (position: keyof typeof BADGE_POSITIONS | BADGE_POSITIONS) => BadgeComponent;
  
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