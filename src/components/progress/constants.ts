// src/components/progress/constants.ts

/**
 * Progress component variants
 */
export const PROGRESS_VARIANTS = {
  /** Standard horizontal progress bar */
  LINEAR: "linear",
  /** Circular spinner progress indicator */
  CIRCULAR: "circular",
} as const;

/**
 * Progress component shapes (linear only)
 */
export const PROGRESS_SHAPES = {
  /** Standard flat progress */
  FLAT: "flat",
  /** Wavy animated progress */
  WAVY: "wavy",
} as const;

/**
 * Progress component events
 */
export const PROGRESS_EVENTS = {
  /** Fired when progress value changes */
  CHANGE: "change",
  /** Fired when progress reaches 100% */
  COMPLETE: "complete",
} as const;

/**
 * Default configuration values
 */
export const PROGRESS_DEFAULTS = {
  /** Default progress variant */
  VARIANT: "linear",
  /** Initial progress value */
  VALUE: 0,
  /** Maximum progress value */
  MAX: 100,
  /** Buffer value for linear progress with buffer */
  BUFFER: 0,
  /** Default shape for linear indeterminate progress */
  SHAPE: "flat",
  /** Whether to show percentage label */
  SHOW_LABEL: false,
  /** Whether progress is indeterminate */
  INDETERMINATE: false,
} as const;

/**
 * CSS classes for progress elements
 */
export const PROGRESS_CLASSES = {
  /** Container element class */
  CONTAINER: "progress",
  /** Linear variant class */
  LINEAR: "progress--linear",
  /** Circular variant class */
  CIRCULAR: "progress--circular",
  /** Track element (unfilled part) class */
  TRACK: "progress__track",
  /** Indicator element (filled part) class */
  INDICATOR: "progress__indicator",
  /** Buffer element class */
  BUFFER: "progress__buffer",
  /** Label element class */
  LABEL: "progress__label",
  /** Indeterminate state class */
  INDETERMINATE: "progress--indeterminate",
  /** Disabled state class */
  DISABLED: "progress--disabled",
  /** Test state class */
  TEST: "progress--test",
  TRANSITION: "progress--transition",
} as const;

/**
 * Progress component measurements
 */
export const PROGRESS_MEASUREMENTS = {
  LINEAR: {
    MIN_HEIGHT: 4,
    GAP: 4,
    STOP_INDICATOR: 4,
    HEIGHT: 4, // Added default height
  },
  CIRCULAR: {
    SIZE: 48,
    GAP: 8,
  },
  COMMON: {
    // Added common measurements
    STROKE_WIDTH: 4,
  },
} as const;

/**
 * Thickness presets for progress component
 * These are the standard thickness options following Material Design 3
 */
export const PROGRESS_THICKNESS = {
  /** Thin stroke width (4px) - default */
  THIN: 4,
  /** Thick stroke width (8px) */
  THICK: 8,
} as const;

/**
 * Wave animation parameters for progress components
 */
export const PROGRESS_WAVE = {
  /** Linear progress wave parameters */
  LINEAR: {
    /** Base amplitude of the wave in pixels */
    AMPLITUDE: 3,
    /** Speed of wave animation in waves per second (Hz) */
    SPEED: 0.88,
    /** Number of complete waves per 100 pixels */
    FREQUENCY: 2,
    /** Number of complete waves per 100 pixels for indeterminate */
    INDETERMINATE_FREQUENCY: 4,
    /** Amplitude for indeterminate animation */
    INDETERMINATE_AMPLITUDE: 2,
    /** Wave shape power (lower = rounder peaks, higher = sharper) */
    POWER: 0.8,
    /** Percentage at which wave amplitude reaches full strength from start */
    START_TRANSITION_END: 0,
    /** Percentage at which wave amplitude begins to decrease near end */
    END_TRANSITION_START: 0.92,
  },
  /** Circular progress wave parameters */
  CIRCULAR: {
    /** Amplitude as percentage of radius (7 = 7%) */
    AMPLITUDE: 6,
    /** Amplitude as percentage of radius for indeterminate (4 = 4%) */
    INDETERMINATE_AMPLITUDE: 4,
    /** Speed of wave rotation in rotations per second (Hz), negative value means clockwise */
    SPEED: 1.1,
    /** Number of complete waves around the circle */
    FREQUENCY: 10,
    /** Number of complete waves for indeterminate animation */
    INDETERMINATE_FREQUENCY: 16,
    /** Wave shape power (lower = rounder peaks, higher = sharper) */
    POWER: 0.8,
    /** Percentage at which wave amplitude reaches full strength from start */
    START_TRANSITION_END: 0,
    /** Percentage at which wave amplitude begins to decrease near end */
    END_TRANSITION_START: 0.92,
  },
} as const;
