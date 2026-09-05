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
  BLUR: 'blur',
  /** Fired when the selection changes (selection groups) */
  CHANGE: 'change'
} as const;

/** Material 3 button group kinds */
export const BUTTON_GROUP_KINDS = {
  STANDARD: 'standard',
  CONNECTED: 'connected'
} as const;

/** Selection behaviour of the group */
export const BUTTON_GROUP_SELECTION = {
  NONE: 'none',
  SINGLE: 'single',
  MULTI: 'multi'
} as const;

export const BUTTON_GROUP_SHAPES = {
  ROUND: 'round',
  SQUARE: 'square'
} as const;

export const BUTTON_GROUP_SIZES = {
  XS: 'xs',
  S: 's',
  M: 'm',
  L: 'l',
  XL: 'xl'
} as const;

/**
 * Material 3 button group tokens per size (dp): container height, button
 * icon size, standard between-space, connected inner corner
 * (m3.material.io button group specs; ButtonGroupSmallTokens.kt and
 * ConnectedButtonGroupSmallTokens.kt for the s size)
 */
export const BUTTON_GROUP_SIZE_TOKENS = {
  xs: { height: 32, icon: 20, standardGap: 18, connectedCorner: 4 },
  s: { height: 40, icon: 20, standardGap: 12, connectedCorner: 8 },
  m: { height: 56, icon: 24, standardGap: 8, connectedCorner: 8 },
  l: { height: 96, icon: 32, standardGap: 8, connectedCorner: 16 },
  xl: { height: 136, icon: 40, standardGap: 8, connectedCorner: 20 }
} as const;

/** Connected groups use 2dp between buttons at every size */
export const BUTTON_GROUP_CONNECTED_GAP = 2;

/** Connected pressed inner corner: extra-small (ConnectedButtonGroupSmallTokens.PressedInnerCornerCornerSize) */
export const BUTTON_GROUP_CONNECTED_PRESSED_CORNER = 4;

/** Connected xs and s groups keep a 48dp minimum width per button */
export const BUTTON_GROUP_CONNECTED_MIN_WIDTH = 48;

/**
 * Standard groups: a pressed button widens by this share of its width and
 * its neighbours give up the difference (ButtonGroupDefaults.ExpandedRatio)
 */
export const BUTTON_GROUP_EXPANDED_RATIO = 0.15;

/** Density reduces the container height by 4dp per step */
export const BUTTON_GROUP_DENSITY_STEP = 4;

/**
 * Default configuration values
 */
/** Label display in selection groups */
export const BUTTON_GROUP_LABELS = {
  ALWAYS: 'always',
  SELECTED: 'selected'
} as const;

export const BUTTON_GROUP_DEFAULTS = {
  KIND: BUTTON_GROUP_KINDS.STANDARD,
  SELECTION: BUTTON_GROUP_SELECTION.NONE,
  SHAPE: BUTTON_GROUP_SHAPES.ROUND,
  SIZE: BUTTON_GROUP_SIZES.S,
  LABELS: BUTTON_GROUP_LABELS.ALWAYS,
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
