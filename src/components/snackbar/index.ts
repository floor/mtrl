// src/components/snackbar/index.ts
export { default } from './snackbar';
export { clearSnackbars } from './snackbar';

// Export types
export type {
  SnackbarConfig,
  SnackbarComponent,
  SnackbarEvent,
  SnackbarPosition,
  SnackbarDuration,
  SnackbarCloseReason,
  SnackbarQueueBehavior,
} from './types';

// Export constants
export {
  SNACKBAR_POSITIONS,
  SNACKBAR_DURATIONS,
  SNACKBAR_CLOSE_REASONS,
  SNACKBAR_QUEUE_BEHAVIORS,
} from './constants';
