// src/components/segmented-button/constants.ts

/**
 * Selection modes for segmented buttons
 */
export const SEGMENTED_BUTTON_MODES = {
  /** Only one segment can be selected at a time */
  SINGLE: 'single',
  /** Multiple segments can be selected */
  MULTI: 'multi'
} as const;

/**
 * Density levels for segmented buttons
 */
export const SEGMENTED_BUTTON_DENSITY = {
  /** Default size with standard spacing */
  DEFAULT: 'default',
  /** Reduced size and spacing, more compact */
  COMFORTABLE: 'comfortable',
  /** Minimal size and spacing, most compact */
  COMPACT: 'compact'
} as const;

/**
 * Segmented button events
 */
export const SEGMENTED_BUTTON_EVENTS = {
  /** Fired when selection changes */
  CHANGE: 'change'
} as const;

/**
 * Default configuration values
 */
export const SEGMENTED_BUTTON_DEFAULTS = {
  /** Default selection mode */
  MODE: SEGMENTED_BUTTON_MODES.SINGLE,
  /** Default density level */
  DENSITY: SEGMENTED_BUTTON_DENSITY.DEFAULT,
  /** Whether ripple effect is enabled by default */
  RIPPLE: true,
  /** Default ripple animation duration in milliseconds */
  RIPPLE_DURATION: 300,
  /** Default ripple animation timing function */
  RIPPLE_TIMING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Default ripple opacity values [start, end] */
  RIPPLE_OPACITY: ['0.2', '0']
} as const;

export const DEFAULT_CHECKMARK_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

/**
 * Default checkmark icon for selected segments
 */
export const SEGMENTED_BUTTON_ICONS = {
  /** Default checkmark icon */
  CHECKMARK: '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
} as const;

/**
 * CSS classes for segmented button elements
 */
export const SEGMENTED_BUTTON_CLASSES = {
  /** Container element */
  CONTAINER: 'segmented-button',
  /** Individual segment */
  SEGMENT: 'segmented-button__segment',
  /** Selected segment */
  SELECTED: 'segmented-button__segment--selected',
  /** Disabled segment */
  DISABLED: 'segmented-button__segment--disabled',
  /** Segment with icon */
  HAS_ICON: 'segmented-button__segment--has-icon',
  /** Segment icon container */
  ICON: 'segmented-button__icon',
  /** Segment label text */
  LABEL: 'segmented-button__label',
  /** Checkmark icon for selected state */
  CHECKMARK: 'segmented-button__checkmark',
  /** Ripple effect container */
  RIPPLE: 'segmented-button__ripple',
  /** Single selection mode */
  SINGLE_MODE: 'segmented-button--single',
  /** Multiple selection mode */
  MULTI_MODE: 'segmented-button--multi',
  /** Default density */
  DEFAULT_DENSITY: 'segmented-button--density-default',
  /** Comfortable density */
  COMFORTABLE_DENSITY: 'segmented-button--density-comfortable',
  /** Compact density */
  COMPACT_DENSITY: 'segmented-button--density-compact'
} as const;