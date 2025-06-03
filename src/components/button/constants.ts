// src/components/button/constants.ts

/**
 * Button variants
 */
export const BUTTON_VARIANTS = {
  /** Primary action button with solid background (high emphasis) */
  FILLED: 'filled',
  /** Secondary action button with medium emphasis */
  TONAL: 'tonal',
  /** Button with outline border and transparent background */
  OUTLINED: 'outlined',
  /** Button with slight elevation/shadow */
  ELEVATED: 'elevated',
  /** Button that appears as text without background or border (low emphasis) */
  TEXT: 'text'
} as const;

/**
 * Available button size variants matching MD3 specifications
 * @category Components
 */
export const BUTTON_SIZES = {
  /** Extra small size - 32px height */
  XS: 'xs',
  /** Small size - 40px height (default) */
  S: 's',
  /** Medium size - 56px height */
  M: 'm',
  /** Large size - 96px height */
  L: 'l',
  /** Extra large size - 136px height */
  XL: 'xl'
} as const;

/**
 * Button size type
 * @category Components
 */
export type ButtonSize = keyof typeof BUTTON_SIZES;

/**
 * Default button types
 */
export const BUTTON_TYPES = {
  BUTTON: 'button',
  SUBMIT: 'submit',
  RESET: 'reset'
} as const;

/**
 * CSS classes used by the button component
 */
export const BUTTON_CLASSES = {
  ROOT: 'button',
  ICON: 'button-icon',
  TEXT: 'button-text',
  CIRCULAR: 'button-circular',
  ACTIVE: 'button-active',
  DISABLED: 'button-disabled'
} as const;

/**
 * Default ripple effect configuration
 * Enhanced for better visibility
 */
export const DEFAULT_RIPPLE_CONFIG = {
  DURATION: 450,                             // Duration in ms (slightly increased)
  TIMING: 'cubic-bezier(0.4, 0.0, 0.2, 1)',  // Material Design timing function
  OPACITY: ['0.7', '0']                      // Increased initial opacity for better visibility
} as const;