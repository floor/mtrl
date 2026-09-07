// src/components/progress/constants.ts
//
// Measurements and timings from the Material 3 progress indicator tokens
// (Compose ProgressIndicatorTokens.kt, LinearProgressIndicatorTokens.kt,
// CircularProgressIndicatorTokens.kt) and from ProgressIndicator.kt and
// WavyProgressIndicator.kt for the motion.

export const PROGRESS_VARIANTS = {
  LINEAR: "linear",
  CIRCULAR: "circular",
} as const;

export const PROGRESS_SHAPES = {
  FLAT: "flat",
  WAVY: "wavy",
} as const;

export const PROGRESS_EVENTS = {
  CHANGE: "change",
  COMPLETE: "complete",
} as const;

export const PROGRESS_DEFAULTS = {
  VARIANT: "linear",
  VALUE: 0,
  MAX: 100,
  BUFFER: 0,
  SHAPE: "flat",
  SHOW_LABEL: false,
  INDETERMINATE: false,
  /** Accessible name when none is given */
  LABEL: "Loading",
} as const;

export const PROGRESS_CLASSES = {
  CONTAINER: "progress",
  LINEAR: "progress--linear",
  CIRCULAR: "progress--circular",
  TRACK: "progress__track",
  INDICATOR: "progress__indicator",
  BUFFER: "progress__buffer",
  LABEL: "progress__label",
  INDETERMINATE: "progress--indeterminate",
  DISABLED: "progress--disabled",
  TEST: "progress--test",
  TRANSITION: "progress--transition",
} as const;

/**
 * Colour roles (ProgressIndicatorTokens): the active indicator and the stop
 * indicator take primary, the track secondary-container. A circular
 * indeterminate indicator has no track.
 */
export const PROGRESS_COLORS = {
  INDICATOR: "sys-color-primary",
  TRACK: "sys-color-secondary-container",
  STOP: "sys-color-primary",
  /** Not an M3 role: the buffer is this library's own extension */
  BUFFER: "sys-color-primary-container",
} as const;

export const PROGRESS_MEASUREMENTS = {
  LINEAR: {
    /** Track and active indicator thickness (LinearProgressIndicatorTokens.Height) */
    HEIGHT: 4,
    /** Space between the active indicator and the track (TrackActiveSpace) */
    GAP: 4,
    /** The dot that marks the end of the track (StopSize) */
    STOP_INDICATOR: 4,
    /** How far the stop indicator sits from the trailing edge, at most */
    STOP_TRAILING_SPACE: 6,
    /** Container height of a wavy linear indicator (WaveHeight) */
    WAVE_HEIGHT: 10,
    /** Inset from the edge of the element (m3.material.io: 4dp minimum) */
    EDGE_INSET: 4,
    MIN_HEIGHT: 4,
  },
  CIRCULAR: {
    /** Flat container size (CircularProgressIndicatorTokens.Size) */
    SIZE: 40,
    /** Wavy container size (CircularProgressIndicatorTokens.WaveSize) */
    WAVE_SIZE: 48,
    /** Space between the active indicator and the track (TrackActiveSpace) */
    GAP: 4,
    /** The guidelines' range for a circular indicator */
    MIN_SIZE: 24,
    MAX_SIZE: 240,
  },
  COMMON: {
    STROKE_WIDTH: 4,
  },
} as const;

export const PROGRESS_THICKNESS = {
  THIN: 4,
  THICK: 8,
} as const;

/**
 * Wave geometry (LinearProgressIndicatorTokens, CircularProgressIndicatorTokens).
 * Wavelengths and amplitudes are in dp at the default 4dp thickness and scale
 * with the indicator's size.
 */
export const PROGRESS_WAVE = {
  LINEAR: {
    /** ActiveWaveWavelength */
    WAVELENGTH: 40,
    /** IndeterminateActiveWaveWavelength */
    INDETERMINATE_WAVELENGTH: 20,
    /** ActiveWaveAmplitude */
    AMPLITUDE: 3,
  },
  CIRCULAR: {
    /** ActiveWaveWavelength */
    WAVELENGTH: 15,
    /** ActiveWaveAmplitude */
    AMPLITUDE: 1.6,
  },
  /** The wave travels one wavelength per second (WavyProgressIndicatorDefaults) */
  SPEED: 1,
  /**
   * The wave flattens at both ends of the range
   * (WavyProgressIndicatorDefaults.indicatorAmplitude)
   */
  AMPLITUDE_START: 0.1,
  AMPLITUDE_END: 0.95,
  /** How long the amplitude takes to appear or go (MotionTokens.DurationLong2) */
  AMPLITUDE_DURATION: 500,
} as const;

/**
 * Indeterminate motion (ProgressIndicator.kt)
 */
export const PROGRESS_MOTION = {
  LINEAR: {
    /** LinearAnimationDuration */
    DURATION: 1750,
    FIRST_HEAD_DELAY: 0,
    FIRST_HEAD_DURATION: 1000,
    FIRST_TAIL_DELAY: 250,
    FIRST_TAIL_DURATION: 1000,
    SECOND_HEAD_DELAY: 650,
    SECOND_HEAD_DURATION: 850,
    SECOND_TAIL_DELAY: 900,
    SECOND_TAIL_DURATION: 850,
  },
  CIRCULAR: {
    /** CircularAnimationProgressDuration */
    DURATION: 6000,
    /** CircularAnimationAdditionalRotationDuration */
    ROTATION_DURATION: 300,
    /** CircularAnimationAdditionalRotationDelay */
    ROTATION_DELAY: 1500,
    /** CircularGlobalRotationDegreesTarget */
    GLOBAL_ROTATION: 1080,
    /** CircularAdditionalRotationDegreesTarget */
    ADDITIONAL_ROTATION: 360,
    /** CircularIndeterminateMinProgress */
    MIN_PROGRESS: 0.1,
    /** CircularIndeterminateMaxProgress */
    MAX_PROGRESS: 0.87,
  },
  /** How long a value change takes to animate (MotionTokens.DurationLong2) */
  VALUE_DURATION: 500,
} as const;

/**
 * Easing curves (MotionTokens), as cubic Bézier control points
 */
export const PROGRESS_EASING = {
  /** EasingEmphasizedAccelerateCubicBezier */
  EMPHASIZED_ACCELERATE: [0.3, 0.0, 0.8, 0.15],
  /** EasingEmphasizedDecelerateCubicBezier */
  EMPHASIZED_DECELERATE: [0.05, 0.7, 0.1, 1.0],
  /** EasingStandardCubicBezier */
  STANDARD: [0.2, 0.0, 0.0, 1.0],
  /** EasingLinearCubicBezier */
  LINEAR: [0.0, 0.0, 1.0, 1.0],
} as const;
