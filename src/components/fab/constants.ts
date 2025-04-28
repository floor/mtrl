// src/components/fab/constants.ts

/**
 * FAB variants following Material Design 3 guidelines
 */
export const FAB_VARIANTS = {
  /** Uses the primary color, highest emphasis (default) */
  PRIMARY: 'primary',
  /** Uses the secondary color, medium emphasis */
  SECONDARY: 'secondary',
  /** Uses the tertiary color, lower emphasis */
  TERTIARY: 'tertiary',
  /** Uses the surface color with an outline, lowest emphasis */
  SURFACE: 'surface'
} as const;

/**
 * FAB size variants
 */
export const FAB_SIZES = {
  /** 40px diameter, for compact interfaces or secondary actions */
  SMALL: 'small',
  /** 56px diameter, for standard primary actions (default) */
  DEFAULT: 'default',
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
  SMALL: '20px',
  DEFAULT: '24px',
  LARGE: '36px'
} as const;

/**
 * Default animations for FAB
 */
export const FAB_ANIMATIONS = {
  /** Entrance animation duration in milliseconds */
  ENTRANCE_DURATION: 250
} as const;