// src/components/badge/constants.ts

/**
 * Badge variants
 * - SMALL: Simple dot badge (6dp diameter)
 * - LARGE: Numbered badge (16dp height)
 */
export const BADGE_VARIANTS = {
  SMALL: 'small',
  LARGE: 'large'
} as const;

/**
 * Badge colors
 * ERROR is the default
 */
export const BADGE_COLORS = {
  ERROR: 'error',      // Default
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info'
} as const;

/**
 * Badge positions relative to its container
 */
export const BADGE_POSITIONS = {
  TOP_RIGHT: 'top-right',     // Default
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left'
} as const;

/**
 * Maximum character count for badge labels
 */
export const BADGE_MAX_CHARACTERS = 4;