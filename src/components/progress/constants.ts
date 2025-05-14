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
  VARIANT: PROGRESS_VARIANTS.LINEAR,
  /** Initial progress value */
  VALUE: 0,
  /** Maximum progress value */
  MAX: 100,
  /** Buffer value for linear progress with buffer */
  BUFFER: 0,
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
  /** Track element (background) class */
  TRACK: 'track',
  /** Indicator element (filled part) class */
  INDICATOR: 'indicator',
  /** Remaining element (space between filled part and 100%) class */
  REMAINING: 'remaining',
  /** Buffer element class */
  BUFFER: 'buffer',
  /** Label element class */
  LABEL: 'label',
  /** Indeterminate state class */
  INDETERMINATE: 'progress--indeterminate',
  /** Disabled state class */
  DISABLED: 'progress--disabled'
} as const;