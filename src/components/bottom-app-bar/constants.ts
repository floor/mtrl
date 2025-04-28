// src/components/bottom-app-bar/constants.ts

/**
 * FAB position constants for Bottom App Bar
 */
export const FAB_POSITIONS = {
  CENTER: 'center',
  END: 'end'
} as const;

/**
 * Default transition duration for show/hide animations
 */
export const DEFAULT_TRANSITION_DURATION = 300;

/**
 * CSS class names used in the bottom app bar component
 */
export const BOTTOM_APP_BAR_CLASSES = {
  ROOT: 'bottom-app-bar',
  ACTIONS: 'bottom-app-bar-actions',
  FAB_CONTAINER: 'bottom-app-bar-fab',
  HIDDEN: 'bottom-app-bar--hidden',
  FAB_CENTER: 'bottom-app-bar--fab-center',
  FAB_END: 'bottom-app-bar--fab-end'
} as const;