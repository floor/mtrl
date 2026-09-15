// src/components/fab/constants.ts

/**
 * FAB variants following Material Design 3 guidelines
 */
export const FAB_VARIANTS = {
  /** Primary container colour (default) */
  PRIMARY_CONTAINER: 'primary-container',
  /** Secondary container colour */
  SECONDARY_CONTAINER: 'secondary-container',
  /** Tertiary container colour */
  TERTIARY_CONTAINER: 'tertiary-container',
  /** Primary tone colour */
  PRIMARY: 'primary',
  /** Secondary tone colour */
  SECONDARY: 'secondary',
  /** Tertiary tone colour */
  TERTIARY: 'tertiary',
  /** @deprecated Use a container or tone style instead. */
  SURFACE: 'surface'
} as const;

/**
 * FAB size variants
 */
export const FAB_SIZES = {
  /** @deprecated Small FABs are no longer recommended in M3 Expressive. */
  SMALL: 'small',
  /** 56px diameter, for standard primary actions (default) */
  DEFAULT: 'default',
  /** 80px diameter with a 28px icon */
  MEDIUM: 'medium',
  /** 96px diameter, for emphasis or touch-focused interfaces */
  LARGE: 'large'
} as const;

/**
 * FAB position options
 */
export const FAB_POSITIONS = {
  /** Position in the top-right corner */
  TOP_RIGHT: 'top-right',
  /** Position in the top-left corner */
  TOP_LEFT: 'top-left',
  /** Position in the bottom-right corner (most common for primary actions) */
  BOTTOM_RIGHT: 'bottom-right',
  /** Position in the bottom-left corner */
  BOTTOM_LEFT: 'bottom-left'
} as const;

/**
 * FAB CSS classes
 */
export const FAB_CLASSES = {
  /** Root element class */
  ROOT: 'fab',
  /** Class for the icon container */
  ICON: 'fab-icon',
  /** Applied when FAB is lowered (pressed state) */
  LOWERED: 'fab--lowered',
  /** Applied to small FABs */
  SMALL: 'fab--small',
  /** Applied to medium FABs */
  MEDIUM: 'fab--medium',
  /** Applied to large FABs */
  LARGE: 'fab--large'
} as const;

/**
 * Button types for FAB
 */
export const FAB_TYPES = {
  BUTTON: 'button',
  SUBMIT: 'submit',
  RESET: 'reset'
} as const;

/**
 * Default icon sizes based on FAB size
 */
export const FAB_ICON_SIZES = {
  SMALL: '24px',
  DEFAULT: '24px',
  MEDIUM: '28px',
  LARGE: '32px'
} as const;

/**
 * Default animations for FAB
 */
export const FAB_ANIMATIONS = {
  /** Entrance animation duration in milliseconds */
  ENTRANCE_DURATION: 250
} as const;