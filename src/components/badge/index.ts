// src/components/badge/index.ts
export { default } from './badge';
export { BadgeConfig, BadgeComponent, BadgeVariant, BadgeColor, BadgePosition } from './types';

// Export common badge constants for convenience and backward compatibility
export const BADGE_VARIANTS = {
  SMALL: 'small',
  LARGE: 'large'
} as const;

export const BADGE_COLORS = {
  ERROR: 'error',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info'
} as const;

export const BADGE_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left'
} as const;

// Export max characters constant
export const BADGE_MAX_CHARACTERS = 4;