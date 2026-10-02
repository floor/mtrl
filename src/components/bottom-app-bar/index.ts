// src/components/bottom-app-bar/index.ts
/**
 * @module components/bottom-app-bar
 * @description Bottom app bar component for mobile interfaces
 */

import { createBottomAppBar } from './bottom-app-bar';

export default createBottomAppBar;
export { createBottomAppBar };
export type {
  BottomAppBarConfig,
  BottomAppBar as BottomAppBarComponent,
  /** @deprecated Use BottomAppBarComponent, the name every component type has. Removed in 1.0 (FLO-383). */
  BottomAppBar,
} from './types';
export * from "./constants";