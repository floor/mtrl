// src/components/badge/index.ts

/**
 * Badge component module
 * @module components/badge
 * @description A small element that communicates status, shows a count,
 * or highlights an element requiring attention.
 */

export { default, default as fBadge, default as createBadge } from './badge';
export type { BadgeConfig, BadgeComponent, BadgeVariant, BadgeColor, BadgePosition } from './types';

/**
 * Badge size variant constants
 * Use these instead of string literals for better code completion and type safety.
 * 
 * @example
 * import { fBadge, BADGE_VARIANTS } from 'mtrl';
 * 
 * const badge = fBadge({ variant: BADGE_VARIANTS.SMALL });
 * 
 * @category Components
 */
export const BADGE_VARIANTS = {
  /** 6dp dot badge (no text content) */
  SMALL: 'small',
  /** 16dp height badge (can contain text) */
  LARGE: 'large'
} as const;

/**
 * Badge color constants
 * Colors follow Material Design 3 color system.
 * 
 * @example
 * import { fBadge, BADGE_COLORS } from 'mtrl';
 * 
 * const badge = fBadge({ color: BADGE_COLORS.ERROR });
 * 
 * @category Components
 */
export const BADGE_COLORS = {
  /** Red color for error states */
  ERROR: 'error',
  /** Primary theme color */
  PRIMARY: 'primary',
  /** Secondary theme color */
  SECONDARY: 'secondary',
  /** Tertiary theme color */
  TERTIARY: 'tertiary',
  /** Green color for success states */
  SUCCESS: 'success',
  /** Orange/yellow color for warning states */
  WARNING: 'warning',
  /** Blue color for information states */
  INFO: 'info'
} as const;

/**
 * Badge position constants
 * Defines where the badge appears relative to its target element.
 * 
 * @example
 * import { fBadge, BADGE_POSITIONS } from 'mtrl';
 * 
 * const badge = fBadge({ 
 *   position: BADGE_POSITIONS.BOTTOM_RIGHT,
 *   target: document.querySelector('#notification-bell')
 * });
 * 
 * @category Components
 */
export const BADGE_POSITIONS = {
  /** Position in the top-right corner (default) */
  TOP_RIGHT: 'top-right',
  /** Position in the top-left corner */
  TOP_LEFT: 'top-left',
  /** Position in the bottom-right corner */
  BOTTOM_RIGHT: 'bottom-right',
  /** Position in the bottom-left corner */
  BOTTOM_LEFT: 'bottom-left'
} as const;

/**
 * Maximum number of characters to display in a badge
 * When label text exceeds this length, it will be truncated.
 * 
 * @category Components
 */
export const BADGE_MAX_CHARACTERS = 4;