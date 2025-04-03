// src/compatibility.ts
/**
 * Compatibility layer for legacy "create*" function names
 * 
 * This file provides backward compatibility by mapping the new "f*" functions 
 * to their original "create*" names. This is done through a simple re-export approach.
 * 
 * Currently only includes components that have been refactored:
 * - Badge
 * - Button
 * - Card
 * - Dialog
 * - Divider
 * - Fab
 * - Extended-Fab
 */

// Re-export with legacy names (only for refactored components)
export { default as createBadge } from './components/badge';
export { default as createButton } from './components/button';
export { default as createCard } from './components/card';

// Import new card content functions and re-export with legacy names
import { 
  fCardContent, 
  fCardHeader, 
  fCardActions, 
  fCardMedia 
} from './components/card/content';

export { 
  fCardContent as createCardContent, 
  fCardHeader as createCardHeader, 
  fCardActions as createCardActions, 
  fCardMedia as createCardMedia 
};

export { default as createDialog } from './components/dialog';
export { fDivider as createDivider } from './components/divider/divider';
export { default as createFab } from './components/fab';
export { default as createExtendedFab } from './components/extended-fab';