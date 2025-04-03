// src/components/fab/index.ts

/**
 * @module Fab
 * 
 * Floating Action Button (FAB) component following Material Design 3 guidelines.
 * FABs are circular buttons that represent the primary action in an application.
 * They are prominently displayed, typically in a fixed position overlaid on the UI.
 * 
 * Features:
 * - Multiple variants (primary, secondary, tertiary, surface)
 * - Three size options (small, default, large)
 * - Configurable positioning
 * - Icon support with customization
 * - Ripple effect on interaction
 * - Accessibility support
 * 
 * @example
 * ```typescript
 * // Create a primary FAB with a plus icon
 * const fab = fFab({
 *   icon: '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
 *   position: 'bottom-right',
 *   ariaLabel: 'Add new item'
 * });
 * 
 * // Attach to DOM and add click handler
 * container.appendChild(fab.element);
 * fab.on('click', () => {
 *   console.log('FAB clicked');
 * });
 * ```
 * 
 * @category Components
 */

export { default as fFab } from './fab';
export { default as createFab } from './fab';
export {
  FabConfig,
  FabComponent,
  FabVariant,
  FabSize,
  FabPosition
} from './types';