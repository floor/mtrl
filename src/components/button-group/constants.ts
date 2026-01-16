// src/components/button-group/constants.ts

/**
 * Button group variants
 * All buttons in the group share the same variant for visual consistency
 */
export const BUTTON_GROUP_VARIANTS = {
  /** Primary action buttons with solid background */
  FILLED: 'filled',
  /** Secondary action buttons with medium emphasis */
  TONAL: 'tonal',
  /** Buttons with outline border (default for button groups per MD3) */
  OUTLINED: 'outlined',
  /** Buttons with slight elevation/shadow */
  ELEVATED: 'elevated',
  /** Text-only buttons without background or border */
  TEXT: 'text'
} as const;

/**
 * Button group orientations
 */
export const BUTTON_GROUP_ORIENTATIONS = {
  /** Buttons arranged horizontally (default) */
  HORIZONTAL: 'horizontal',
  /** Buttons arranged vertically */
  VERTICAL: 'vertical'
} as const;

/**
 * Density levels for button groups
 * Controls sizing and spacing per MD3 density specifications
 */
export const BUTTON_GROUP_DENSITY = {
  /** Default size with standard spacing (40px height) */
  DEFAULT: 'default',
  /** Reduced size and spacing (36px height) */
  COMFORTABLE: 'comfortable',
  /** Minimal size and spacing (32px height) */
  COMPACT: 'compact'
} as const;

/**
 * Button group events
 */
export const BUTTON_GROUP_EVENTS = {
  /** Fired when any button in the group is clicked */
  CLICK: 'click',
  /** Fired when a button receives focus */
  FOCUS: 'focus',
  /** Fired when a button loses focus */
  BLUR: 'blur'
} as const;

/**
 * Default configuration values
 */
export const BUTTON_GROUP_DEFAULTS = {
  /** Default variant (outlined per MD3 button group specs) */
  VARIANT: BUTTON_GROUP_VARIANTS.OUTLINED,
  /** Default orientation */
  ORIENTATION: BUTTON_GROUP_ORIENTATIONS.HORIZONTAL,
  /** Default density level */
  DENSITY: BUTTON_GROUP_DENSITY.DEFAULT,
  /** Whether ripple effect is enabled by default */
  RIPPLE: true,
  /** Whether buttons have equal width by default */
  EQUAL_WIDTH: false,
  /** Default ripple animation duration in milliseconds */
  RIPPLE_DURATION: 300,
  /** Default ripple animation timing function */
  RIPPLE_TIMING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Default ripple opacity values [start, end] */
  RIPPLE_OPACITY: ['0.2', '0'] as [string, string]
} as const;

/**
 * CSS classes for button group elements
 * Following BEM naming convention
 */
export const BUTTON_GROUP_CLASSES = {
  /** Container element */
  ROOT: 'button-group',
  /** Individual button within group */
  BUTTON: 'button-group__button',
  /** First button in group */
  FIRST: 'button-group__button--first',
  /** Last button in group */
  LAST: 'button-group__button--last',
  /** Middle buttons (neither first nor last) */
  MIDDLE: 'button-group__button--middle',
  /** Single button (only one in group) */
  SINGLE: 'button-group__button--single',
  /** Disabled state */
  DISABLED: 'button-group--disabled',
  /** Horizontal orientation */
  HORIZONTAL: 'button-group--horizontal',
  /** Vertical orientation */
  VERTICAL: 'button-group--vertical',
  /** Equal width buttons */
  EQUAL_WIDTH: 'button-group--equal-width',
  /** Filled variant */
  FILLED: 'button-group--filled',
  /** Tonal variant */
  TONAL: 'button-group--tonal',
  /** Outlined variant */
  OUTLINED: 'button-group--outlined',
  /** Elevated variant */
  ELEVATED: 'button-group--elevated',
  /** Text variant */
  TEXT: 'button-group--text',
  /** Default density */
  DENSITY_DEFAULT: 'button-group--density-default',
  /** Comfortable density */
  DENSITY_COMFORTABLE: 'button-group--density-comfortable',
  /** Compact density */
  DENSITY_COMPACT: 'button-group--density-compact'
} as const;

/**
 * Density-specific height values per MD3 specifications
 */
export const BUTTON_GROUP_HEIGHTS = {
  [BUTTON_GROUP_DENSITY.DEFAULT]: 40,
  [BUTTON_GROUP_DENSITY.COMFORTABLE]: 36,
  [BUTTON_GROUP_DENSITY.COMPACT]: 32
} as const;

/**
 * Border radius values per MD3 specifications
 * Button groups use full-rounded corners on outer edges
 */
export const BUTTON_GROUP_RADII = {
  [BUTTON_GROUP_DENSITY.DEFAULT]: 20,
  [BUTTON_GROUP_DENSITY.COMFORTABLE]: 18,
  [BUTTON_GROUP_DENSITY.COMPACT]: 16
} as const;
