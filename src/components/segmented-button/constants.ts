// src/components/segmented-button/constants.ts
import { SelectionMode } from './types';

/**
 * Default checkbox icon SVG used for selected state
 * @internal
 */
export const DEFAULT_CHECKMARK_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

/**
 * Default configuration values for segmented buttons
 * @internal
 */
export const DEFAULT_CONFIG = {
  mode: SelectionMode.SINGLE,
  ripple: true
};

/**
 * Event names used by the segmented button component
 * @internal
 */
export const EVENTS = {
  CHANGE: 'change'
};

/**
 * CSS classes used by the segmented button component
 * @internal
 */
export const CLASSES = {
  CONTAINER: 'segmented-button',
  SEGMENT: 'segmented-button-segment',
  SELECTED: 'selected',
  DISABLED: 'disabled',
  ICON: 'icon',
  CHECKMARK: 'checkmark',
  TEXT: 'text'
};