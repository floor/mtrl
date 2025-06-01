// src/components/slider/constants.ts

/**
 * Available slider color variants
 * @category Components
 */
export const SLIDER_COLORS = {
  /** Primary color variant */
  PRIMARY: 'primary',
  /** Secondary color variant */
  SECONDARY: 'secondary',
  /** Tertiary color variant */
  TERTIARY: 'tertiary',
  /** Error color variant */
  ERROR: 'error'
} as const;

/**
 * Available slider size variants
 * @category Components
 */
export const SLIDER_SIZES = {
  /** Extra small size (default) - 16px track height */
  XS: 16,
  /** Small size - 24px track height */
  S: 24,
  /** Medium size - 40px track height */
  M: 40,
  /** Large size - 56px track height */
  L: 56,
  /** Extra large size - 96px track height */
  XL: 96
} as const;

/**
 * Slider component size type
 * @category Components
 */
export type SliderSize = keyof typeof SLIDER_SIZES | number;

/**
 * Slider component measurements
 * @category Components
 */
export const SLIDER_MEASUREMENTS = {
  /** Handle size in pixels */
  HANDLE_SIZE: 20,
  /** Handle height for XS and S sizes in pixels */
  SMALL_HANDLE_HEIGHT: 42,
  /** Handle height offset for M, L, XL sizes (added to track height) */
  HANDLE_HEIGHT_OFFSET: 12,
  /** Minimum container height in pixels */
  MIN_HEIGHT: 40,
  /** Track border radius in pixels */
  TRACK_RADIUS: 4,
  /** External track radius for XS and S sizes in pixels */
  SMALL_TRACK_EXTERNAL_RADIUS: 10,
  /** External track radius ratio for M, L, XL sizes (multiplied by track height) */
  LARGE_TRACK_RADIUS_RATIO: 0.35,
  /** Tick size in pixels */
  TICK_SIZE: 4,
  /** Dot size in pixels */
  DOT_SIZE: 4,
  /** Handle gap pixels */
  HANDLE_GAP: 8,
  /** Center gap pixels for centered sliders */
  CENTER_GAP: 4,
  /** Edge padding in pixels */
  EDGE_PADDING: 7
} as const;

/**
 * Available slider events
 * @category Components
 */
export const SLIDER_EVENTS = {
  /** Fired when slider value changes and interaction completes */
  CHANGE: 'change',
  /** Fired during dragging as value changes */
  INPUT: 'input',
  /** Fired when slider receives focus */
  FOCUS: 'focus',
  /** Fired when slider loses focus */
  BLUR: 'blur',
  /** Fired when interaction starts */
  START: 'start',
  /** Fired when interaction ends */
  END: 'end'
} as const;

/**
 * Position options for slider label and icon
 * @category Components
 */
export const SLIDER_POSITIONS = {
  /** Position at the start */
  START: 'start',
  /** Position at the end */
  END: 'end'
} as const;

/**
 * Default slider configuration values
 * @category Components
 */
export const SLIDER_DEFAULTS = {
  /** Minimum value */
  MIN: 0,
  /** Maximum value */
  MAX: 100,
  /** Starting value */
  VALUE: 0,
  /** Step increment size */
  STEP: 1,
  /** Whether slider is disabled */
  DISABLED: false,
  /** Default color variant */
  COLOR: SLIDER_COLORS.PRIMARY,
  /** Default size variant */
  SIZE: 'XS',
  /** Whether to show tick marks */
  TICKS: false,
  /** Whether to show value while dragging */
  SHOW_VALUE: true,
  /** Whether to snap to steps during dragging */
  SNAP_TO_STEPS: true,
  /** Whether slider is a range slider (two handles) */
  RANGE: false,
  /** Whether slider is a centered slider (active track from center) */
  CENTERED: false,
  /** Default icon position */
  ICON_POSITION: SLIDER_POSITIONS.START,
  /** Default label position */
  LABEL_POSITION: SLIDER_POSITIONS.START
} as const;

/**
 * CSS class names used by the slider component
 * @category Components
 */
export const SLIDER_CLASSES = {
  /** Root element class */
  ROOT: 'slider',
  /** Container for slider track and handles */
  CONTAINER: 'slider__container',
  /** Track element class */
  TRACK: 'slider__track',
  /** Filled track portion class */
  FILL: 'slider__fill',
  /** Handle element class */
  HANDLE: 'slider__handle',
  /** Second handle element class (for range slider) */
  HANDLE_SECOND: 'slider__handle--second',
  /** Tick marks container class */
  TICKS: 'slider__ticks',
  /** Individual tick mark class */
  TICK: 'slider__tick',
  /** Active/selected tick mark class */
  TICK_ACTIVE: 'slider__tick--active',
  /** Label element class */
  LABEL: 'slider__label',
  /** Value display class */
  VALUE: 'slider__value',
  /** Icon container class */
  ICON: 'slider__icon',
  /** Disabled state class */
  DISABLED: 'slider--disabled',
  /** Focused state class */
  FOCUSED: 'slider--focused',
  /** Dragging state class */
  DRAGGING: 'slider--dragging',
  /** Range slider variant class */
  RANGE: 'slider--range',
  /** Small size variant class */
  SMALL: 'slider--small',
  /** Medium size variant class */
  MEDIUM: 'slider--medium',
  /** Large size variant class */
  LARGE: 'slider--large',
  /** Primary color variant class */
  PRIMARY: 'slider--primary',
  /** Secondary color variant class */
  SECONDARY: 'slider--secondary',
  /** Tertiary color variant class */
  TERTIARY: 'slider--tertiary',
  /** Error color variant class */
  ERROR: 'slider--error'
} as const;