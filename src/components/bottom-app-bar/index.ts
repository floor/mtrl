// src/components/bottom-app-bar/index.ts
/**
 * @module components/bottom-app-bar
 * @description Bottom app bar component for mobile interfaces
 */

import { createBottomAppBar } from './bottom-app-bar';

export default createBottomAppBar;
export { createBottomAppBar };
export type { BottomAppBarConfig, BottomAppBar } from './types';

// Export position constants for convenience and backward compatibility
export const FAB_POSITIONS = {
  CENTER: 'center',
  END: 'end'
} as const;