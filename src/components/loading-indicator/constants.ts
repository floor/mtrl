// src/components/loading-indicator/constants.ts
import type { MaterialShapeName } from '../../core/shapes';

/**
 * Loading indicator measurements and timing (Compose Material 3
 * LoadingIndicatorTokens.kt and LoadingIndicator.kt)
 * @category Components
 */
export const LOADING_INDICATOR_DEFAULTS = {
  /** Container width and height */
  SIZE: 48,
  /** The active indicator's diameter within a 48dp container */
  INDICATOR_SIZE: 38,
  /** Smallest size the guidelines allow */
  MIN_SIZE: 24,
  /** Largest size the guidelines allow */
  MAX_SIZE: 240,
  /** Milliseconds between two shape morphs */
  MORPH_INTERVAL: 650,
  /** Milliseconds for one full turn of the slow global rotation */
  ROTATION_DURATION: 4666,
  /** Degrees each morph turns the shape */
  MORPH_ROTATION: 90,
  /** Accessible name when none is given */
  LABEL: 'Loading',
  /** Outline samples per shape */
  SAMPLES: 360
} as const;

/**
 * The morph spring (Compose: `spring(dampingRatio = 0.6f, stiffness = 200f,
 * visibilityThreshold = 0.1f)`)
 * @category Components
 */
export const LOADING_INDICATOR_SPRING = {
  DAMPING: 0.6,
  STIFFNESS: 200,
  THRESHOLD: 0.1
} as const;

/**
 * The shapes the indeterminate indicator morphs through, in order
 * (LoadingIndicatorDefaults.IndeterminateIndicatorPolygons)
 * @category Components
 */
export const LOADING_INDICATOR_SHAPES: readonly MaterialShapeName[] = [
  'softBurst',
  'cookie9',
  'pentagon',
  'pill',
  'sunny',
  'cookie4',
  'oval'
];

/**
 * The shapes the determinate indicator morphs between as the value grows
 * (LoadingIndicatorDefaults.DeterminateIndicatorPolygons)
 * @category Components
 */
export const LOADING_INDICATOR_DETERMINATE_SHAPES: readonly MaterialShapeName[] = ['circle', 'softBurst'];

/**
 * CSS class names used by the loading indicator, without the prefix
 * @category Components
 */
export const LOADING_INDICATOR_CLASSES = {
  ROOT: 'loading-indicator',
  /** Drawn on a primary-container circle */
  CONTAINED: 'loading-indicator--contained',
  /** Shows a value rather than looping */
  DETERMINATE: 'loading-indicator--determinate',
  CANVAS: 'loading-indicator__canvas'
} as const;
