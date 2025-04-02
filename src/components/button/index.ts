// src/components/button/index.ts

/**
 * Button component module
 * @module components/button
 */

export { default } from './button'
export { ButtonConfig, ButtonComponent, ButtonVariant } from './types'

/**
 * Constants for button variants - use these instead of string literals
 * for better code completion and type safety.
 * 
 * @example
 * import { createButton, BUTTON_VARIANTS } from 'mtrl';
 * 
 * // Create a filled button
 * const primaryButton = createButton({ 
 *   text: 'Submit',
 *   variant: BUTTON_VARIANTS.FILLED 
 * });
 * 
 * @category Components
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