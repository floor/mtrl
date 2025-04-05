// src/components/bottom-app-bar/index.ts
/**
 * @module components/bottom-app-bar
 * @description Bottom app bar component for mobile interfaces
 */

import { fBottomAppBar } from './bottom-app-bar';

export default fBottomAppBar;
export { fBottomAppBar };
export type { BottomAppBarConfig, BottomAppBar } from './types';

// Export position constants for convenience and backward compatibility
export const FAB_POSITIONS = {
  CENTER: 'center',
  END: 'end'
} as const;