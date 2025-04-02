// src/components/extended-fab/index.ts

/**
 * @module ExtendedFab
 * 
 * Extended Floating Action Button (Extended FAB) component following Material Design 3 guidelines.
 * Extended FABs are wider than standard FABs, containing both an icon and a text label.
 * They provide a primary action that's prominently displayed and easily accessible.
 * 
 * Features:
 * - Multiple variants (primary, secondary, tertiary, surface)
 * - Icon and text label combination
 * - Configurable positioning
 * - Collapsible behavior on scroll
 * - Ripple effect on interaction
 * - Accessibility support
 * 
 * @example
 * ```typescript
 * // Create a primary Extended FAB with icon and text
 * const extendedFab = createExtendedFab({
 *   text: 'Create',
 *   icon: '<svg>...</svg>',
 *   position: 'bottom-right',
 *   collapseOnScroll: true
 * });
 * 
 * // Attach to DOM and add click handler
 * container.appendChild(extendedFab.element);
 * extendedFab.on('click', () => {
 *   console.log('Extended FAB clicked');
 * });
 * ```
 * 
 * @category Components
 */

export { default, default as createExtendedFab } from './extended-fab';
export {
  ExtendedFabConfig,
  ExtendedFabComponent,
  ExtendedFabVariant,
  ExtendedFabWidth,
  ExtendedFabPosition
} from './types';