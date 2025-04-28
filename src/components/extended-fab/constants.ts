// src/components/extended-fab/constants.ts

/**
 * Extended FAB variants following Material Design 3 guidelines
 */
export const EXTENDED_FAB_VARIANTS = {
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
 * Extended FAB width behavior
 */
export const EXTENDED_FAB_WIDTH = {
  /** Maintains a constant width regardless of content (default) */
  FIXED: 'fixed',
  /** Adjusts width based on content length */
  FLUID: 'fluid'
} as const;

/**
 * Extended FAB position on the screen
 */
export const EXTENDED_FAB_POSITIONS = {
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
 * Icon position options
 */
export const EXTENDED_FAB_ICON_POSITIONS = {
  /** Icon appears before the text (default) */
  START: 'start',
  /** Icon appears after the text */
  END: 'end'
} as const;

/**
 * Extended FAB CSS classes
 */
export const EXTENDED_FAB_CLASSES = {
  /** Root element class */
  ROOT: 'extended-fab',
  /** Class for the icon container */
  ICON: 'extended-fab-icon',
  /** Class for the text container */
  TEXT: 'extended-fab-text',
  /** Applied to fixed width FABs */
  FIXED: 'extended-fab--fixed',
  /** Applied to fluid width FABs */
  FLUID: 'extended-fab--fluid',
  /** Applied when FAB is lowered (pressed state) */
  LOWERED: 'extended-fab--lowered',
  /** Applied when FAB is collapsed to a regular FAB */
  COLLAPSED: 'extended-fab--collapsed',
  /** Applied when icon is positioned at the end */
  ICON_END: 'extended-fab--icon-end'
} as const;

/**
 * Button types for Extended FAB
 */
export const EXTENDED_FAB_TYPES = {
  BUTTON: 'button',
  SUBMIT: 'submit',
  RESET: 'reset'
} as const;

/**
 * Default animations for Extended FAB
 */
export const EXTENDED_FAB_ANIMATIONS = {
  /** Entrance animation duration in milliseconds */
  ENTRANCE_DURATION: 250,
  /** Collapse/expand animation duration in milliseconds */
  COLLAPSE_DURATION: 200
} as const;