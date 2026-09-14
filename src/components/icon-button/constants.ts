// src/components/icon-button/constants.ts

/**
 * IconButton variants following Material Design 3 guidelines
 *
 * Four built-in color styles, in order of emphasis:
 * - filled: Highest emphasis, key actions
 * - tonal: High emphasis, secondary actions
 * - outlined: Medium emphasis, not main focus
 * - standard: Lowest emphasis, on colorful surfaces
 */
export const ICON_BUTTON_VARIANTS = {
  /** Primary action button with solid background (highest emphasis) */
  FILLED: 'filled',
  /** Secondary action button with tonal background (high emphasis) */
  TONAL: 'tonal',
  /** Button with outline border and transparent background (medium emphasis) */
  OUTLINED: 'outlined',
  /** Button with no background, just icon (lowest emphasis) */
  STANDARD: 'standard'
} as const;

/**
 * IconButton variant type
 */
export type IconButtonVariant = typeof ICON_BUTTON_VARIANTS[keyof typeof ICON_BUTTON_VARIANTS];

/**
 * IconButton sizes following Material Design 3 specifications
 *
 * | Size | Container | Icon Size |
 * |------|-----------|-----------|
 * | XS   | 32dp      | 20dp      |
 * | S    | 40dp      | 24dp      |
 * | M    | 56dp      | 24dp      |
 * | L    | 96dp      | 32dp      |
 * | XL   | 136dp     | 40dp      |
 */
export const ICON_BUTTON_SIZES = {
  /** Extra small - 32px container, 20px icon */
  XS: 'xs',
  /** Small - 40px container, 24px icon (default) */
  S: 's',
  /** Medium - 56px container, 24px icon */
  M: 'm',
  /** Large - 96px container, 32px icon */
  L: 'l',
  /** Extra large - 136px container, 40px icon */
  XL: 'xl'
} as const;

/**
 * IconButton size type
 */
export type IconButtonSize = typeof ICON_BUTTON_SIZES[keyof typeof ICON_BUTTON_SIZES];

/**
 * IconButton shapes following Material Design 3 specifications
 *
 * - round: Full corner radius (default)
 * - square: Fixed corner radius per size
 */
export const ICON_BUTTON_SHAPES = {
  /** Round shape - full corner radius (default) */
  ROUND: 'round',
  /** Square shape - fixed corner radius based on size */
  SQUARE: 'square'
} as const;

/**
 * IconButton shape type
 */
export type IconButtonShape = typeof ICON_BUTTON_SHAPES[keyof typeof ICON_BUTTON_SHAPES];

/**
 * IconButton width variants following Material Design 3 specifications
 *
 * | Size | Narrow | Default | Wide   |
 * |------|--------|---------|--------|
 * | XS   | 28dp   | 32dp    | 40dp   |
 * | S    | 32dp   | 40dp    | 52dp   |
 * | M    | 48dp   | 56dp    | 72dp   |
 * | L    | 64dp   | 96dp    | 128dp  |
 * | XL   | 104dp  | 136dp   | 184dp  |
 */
export const ICON_BUTTON_WIDTHS = {
  /** Narrow width */
  NARROW: 'narrow',
  /** Default width */
  DEFAULT: 'default',
  /** Wide width */
  WIDE: 'wide'
} as const;

/**
 * IconButton width type
 */
export type IconButtonWidth = typeof ICON_BUTTON_WIDTHS[keyof typeof ICON_BUTTON_WIDTHS];

/**
 * Button types for IconButton
 */
export const ICON_BUTTON_TYPES = {
  BUTTON: 'button',
  SUBMIT: 'submit',
  RESET: 'reset'
} as const;

/**
 * CSS classes used by the IconButton component
 */
export const ICON_BUTTON_CLASSES = {
  /** Root element class */
  ROOT: 'icon-button',
  /** Class for the icon container */
  ICON: 'icon-button__icon',
  /** Applied when button is selected (toggle state) */
  SELECTED: 'icon-button--selected',
  /** Applied when button is disabled */
  DISABLED: 'icon-button--disabled',
  /** Applied when button is pressed (for shape morph) */
  PRESSED: 'icon-button--pressed'
} as const;

/**
 * Default ripple effect configuration for IconButton
 */
export const DEFAULT_RIPPLE_CONFIG = {
  DURATION: 450,
  TIMING: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  OPACITY: ['0.7', '0'] as [string, string]
} as const;

/**
 * Corner radius values for square shape per size (in dp)
 * Round shape uses full corner radius (50%)
 */
export const ICON_BUTTON_CORNER_RADIUS = {
  XS: { square: 12, pressed: 8 },
  S: { square: 12, pressed: 8 },
  M: { square: 16, pressed: 12 },
  L: { square: 28, pressed: 16 },
  XL: { square: 28, pressed: 16 }
} as const;

/**
 * Icon sizes per button size (in dp)
 */
export const ICON_BUTTON_ICON_SIZES = {
  XS: 20,
  S: 24,
  M: 24,
  L: 32,
  XL: 40
} as const;

/**
 * Container sizes per button size (in dp)
 */
export const ICON_BUTTON_CONTAINER_SIZES = {
  XS: 32,
  S: 40,
  M: 56,
  L: 96,
  XL: 136
} as const;

/**
 * Width values per size and width variant (in dp)
 */
export const ICON_BUTTON_WIDTH_VALUES = {
  XS: { narrow: 28, default: 32, wide: 40 },
  S: { narrow: 32, default: 40, wide: 52 },
  M: { narrow: 48, default: 56, wide: 72 },
  L: { narrow: 64, default: 96, wide: 128 },
  XL: { narrow: 104, default: 136, wide: 184 }
} as const;
