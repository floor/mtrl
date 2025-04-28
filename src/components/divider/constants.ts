// src/components/divider/constants.ts

/**
 * Divider orientation options
 */
export const DIVIDER_ORIENTATIONS = {
  /** Horizontal divider (default) */
  HORIZONTAL: 'horizontal',
  /** Vertical divider */
  VERTICAL: 'vertical'
} as const;

/**
 * Divider variant options
 */
export const DIVIDER_VARIANTS = {
  /** Spans the entire width/height of the container (default) */
  FULL_WIDTH: 'full-width',
  /** Adds space at the start (left for horizontal, top for vertical) */
  INSET: 'inset',
  /** Adds space at both start and end */
  MIDDLE_INSET: 'middle-inset'
} as const;

/**
 * Default divider thickness in pixels
 * Following Material Design 3 guidelines
 */
export const DEFAULT_DIVIDER_THICKNESS = 1;

/**
 * Default inset value in pixels
 * Applied when variant is 'inset' or 'middle-inset'
 */
export const DEFAULT_INSET_VALUE = 16;

/**
 * CSS classes used by the divider component
 */
export const DIVIDER_CLASSES = {
  /** Root divider element */
  ROOT: 'divider',
  /** Applied to horizontal dividers */
  HORIZONTAL: 'divider--horizontal',
  /** Applied to vertical dividers */
  VERTICAL: 'divider--vertical',
  /** Applied to inset dividers */
  INSET: 'divider--inset',
  /** Applied to middle-inset dividers */
  MIDDLE_INSET: 'divider--middle-inset'
} as const;