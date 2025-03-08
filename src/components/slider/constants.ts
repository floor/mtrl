// src/components/slider/constants.ts

/**
 * Available slider color variants
 */
export const SLIDER_COLORS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  ERROR: 'error'
} as const;

/**
 * Available slider size variants
 */
export const SLIDER_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
} as const;

/**
 * Available slider events
 */
export const SLIDER_EVENTS = {
  CHANGE: 'change',
  INPUT: 'input',
  FOCUS: 'focus',
  BLUR: 'blur',
  START: 'start',
  END: 'end'
} as const;