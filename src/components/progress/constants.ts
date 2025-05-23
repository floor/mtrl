// src/components/progress/constants.ts

/**
 * Progress component variants
 */
export const PROGRESS_VARIANTS = {
  /** Standard horizontal progress bar */
  LINEAR: 'linear',
  /** Circular spinner progress indicator */
  CIRCULAR: 'circular'
} as const;

/**
 * Progress component shapes (linear only)
 */
export const PROGRESS_SHAPES = {
  /** Standard straight line progress */
  LINE: 'line',
  /** Wavy animated progress */
  WAVY: 'wavy'
} as const;

/**
 * Progress component events
 */
export const PROGRESS_EVENTS = {
  /** Fired when progress value changes */
  CHANGE: 'change',
  /** Fired when progress reaches 100% */
  COMPLETE: 'complete'
} as const;

/**
 * Default configuration values
 */
export const PROGRESS_DEFAULTS = {
  /** Default progress variant */
  VARIANT: 'linear',
  /** Initial progress value */
  VALUE: 0,
  /** Maximum progress value */
  MAX: 100,
  /** Buffer value for linear progress with buffer */
  BUFFER: 0,
  /** Default shape for linear indeterminate progress */
  SHAPE: 'line',
  /** Whether to show percentage label */
  SHOW_LABEL: false,
  /** Whether progress is indeterminate */
  INDETERMINATE: false
} as const;

/**
 * CSS classes for progress elements
 */
export const PROGRESS_CLASSES = {
  /** Container element class */
  CONTAINER: 'progress',
  /** Linear variant class */
  LINEAR: 'progress--linear',
  /** Circular variant class */
  CIRCULAR: 'progress--circular',
  /** Track element (unfilled part) class */
  TRACK: 'track',
  /** Indicator element (filled part) class */
  INDICATOR: 'indicator',
  /** Buffer element class */
  BUFFER: 'buffer',
  /** Label element class */
  LABEL: 'label',
  /** Indeterminate state class */
  INDETERMINATE: 'progress--indeterminate',
  /** Disabled state class */
  DISABLED: 'progress--disabled',
  /** Test state class */
  TEST: 'progress--test',
} as const;

/**
 * Measurements for progress component
 * These values are the authoritative source for dimensions
 * and are used consistently across both TypeScript and SCSS
 */
export const PROGRESS_MEASUREMENTS = {
  /** Linear progress measurements */
  LINEAR: {
    /** Default height of the linear progress track in pixels */
    HEIGHT: 4,
    /** Gap size between indicator and track in pixels */
    GAP: 4,
    /** Size of stop indicator dot in pixels */
    STOP_INDICATOR: 4
  },
  
  /** Circular progress measurements */
  CIRCULAR: {
    /** Default diameter of circular progress in pixels */
    SIZE: 50,
    /** Gap angle in degrees */
    GAP_ANGLE: 55,
    /** Gap multiplier based on thickness (higher means bigger gap for thicker strokes) */
    GAP_MULTIPLIER: .75
  },
  
  /** Common measurements */
  COMMON: {
    /** Default stroke width for both variants in pixels */
    STROKE_WIDTH: 6
  }
} as const;

// Add thickness options based on MD3 specs
export const PROGRESS_THICKNESS = {
  /** Thin stroke width */
  THIN: 4,
  /** Default stroke width */
  DEFAULT: 6,
  /** Thick stroke width */
  THICK: 8
} as const;