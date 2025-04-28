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
  /** Small size slider */
  SMALL: 'small',
  /** Medium size slider */
  MEDIUM: 'medium',
  /** Large size slider */
  LARGE: 'large'
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
  SIZE: SLIDER_SIZES.MEDIUM,
  /** Whether to show tick marks */
  TICKS: false,
  /** Whether to show value while dragging */
  SHOW_VALUE: true,
  /** Whether to snap to steps during dragging */
  SNAP_TO_STEPS: true,
  /** Whether slider is a range slider (two handles) */
  RANGE: false,
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