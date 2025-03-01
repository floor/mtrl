// src/components/progress/constants.ts

/**
 * Progress component variants
 */
export const PROGRESS_VARIANTS = {
  /** Standard linear progress bar */
  LINEAR: 'linear',
  
  /** Circular progress indicator */
  CIRCULAR: 'circular',
  
  /** Progress with known value */
  DETERMINATE: 'determinate',
  
  /** Indeterminate progress animation */
  INDETERMINATE: 'indeterminate'
} as const;

/**
 * Progress component sizes
 */
export const PROGRESS_SIZES = {
  /** Small progress indicator (2px height for linear, 16px diameter for circular) */
  SMALL: 'small',
  
  /** Medium progress indicator (4px height for linear, 24px diameter for circular) */
  MEDIUM: 'medium',
  
  /** Large progress indicator (8px height for linear, 48px diameter for circular) */
  LARGE: 'large'
} as const;

/**
 * Progress component events
 */
export const PROGRESS_EVENTS = {
  /** Fired when value changes */
  VALUE_CHANGE: 'valueChange',
  
  /** Fired when component becomes determinate/indeterminate */
  STATE_CHANGE: 'stateChange'
} as const;