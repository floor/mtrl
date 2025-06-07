// src/components/progress/constants.ts

import { PREFIX } from '../../core/config';

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
  TRACK: 'progress__track',
  /** Indicator element (filled part) class */
  INDICATOR: 'progress__indicator',
  /** Buffer element class */
  BUFFER: 'progress__buffer',
  /** Label element class */
  LABEL: 'progress__label',
  /** Indeterminate state class */
  INDETERMINATE: 'progress--indeterminate',
  /** Disabled state class */
  DISABLED: 'progress--disabled',
  /** Test state class */
  TEST: 'progress--test',
  TRANSITION: 'progress--transition'
} as const;

/**
 * Progress component measurements
 */
export const PROGRESS_MEASUREMENTS = {
  LINEAR: {
    MIN_HEIGHT: 4,
    GAP: 4,
    STOP_INDICATOR: 4,
    HEIGHT: 4  // Added default height
  },
  CIRCULAR: {
    SIZE: 48,
    GAP: 8
  },
  COMMON: {    // Added common measurements
    STROKE_WIDTH: 4
  }
} as const;

/**
 * Thickness presets for progress component
 * These are the standard thickness options following Material Design 3
 */
export const PROGRESS_THICKNESS = {
  /** Thin stroke width (4px) - default */
  THIN: 4,
  /** Thick stroke width (8px) */
  THICK: 8
} as const;

/**
 * Wave animation parameters for progress components
 */
export const PROGRESS_WAVE = {
  /** Linear progress wave parameters */
  LINEAR: {
    /** Base amplitude of the wave in pixels */
    AMPLITUDE: 3,
    /** Speed of the wave animation */
    SPEED: 0.008,
    /** Frequency of the wave (affects wavelength) */
    FREQUENCY: 0.15,
    /** Frequency for indeterminate animation */
    INDETERMINATE_FREQUENCY: 0.35,
    /** Amplitude for indeterminate animation */
    INDETERMINATE_AMPLITUDE: 2,
    /** Wave shape power (lower = rounder peaks, higher = sharper) */
    POWER: 0.8,
    /** Percentage at which wave amplitude reaches full strength from start */
    START_TRANSITION_END: 0.05,
    /** Percentage at which wave amplitude begins to decrease near end */
    END_TRANSITION_START: 0.95
  },
  /** Circular progress wave parameters */
  CIRCULAR: {
    /** Amplitude as percentage of stroke width */
    AMPLITUDE_RATIO: 1,
    /** Maximum amplitude in pixels */
    AMPLITUDE_MAX: 5,
    /** Speed of the wave rotation */
    SPEED: 0.008,
    /** Number of complete waves around the circle */
    FREQUENCY: 12,
    /** Number of complete waves for indeterminate animation */
    INDETERMINATE_FREQUENCY: 32,
    /** Amplitude ratio for indeterminate animation */
    INDETERMINATE_AMPLITUDE_RATIO: 0.7,
    /** Maximum amplitude for indeterminate animation */
    INDETERMINATE_AMPLITUDE_MAX: 3,
    /** Wave shape power (lower = rounder peaks, higher = sharper) */
    POWER: 0.8
  }
} as const;