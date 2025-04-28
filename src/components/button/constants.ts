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
 */
export const DEFAULT_RIPPLE_CONFIG = {
  DURATION: 650,
  TIMING: 'ease-out',
  OPACITY: ['0.2', '0']
} as const;