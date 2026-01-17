// src/components/icon-button/index.ts

/**
 * @module IconButton
 *
 * Icon Button component following Material Design 3 guidelines.
 * Icon buttons display actions in a compact form using icons.
 * They support both default (single action) and toggle (binary state) modes.
 *
 * Features:
 * - Four variants (filled, tonal, outlined, standard)
 * - Five size options (xs, s, m, l, xl)
 * - Shape options (round, square)
 * - Width options (narrow, default, wide)
 * - Toggle mode with selected/unselected states
 * - Shape morphing on press and selection (CSS-driven)
 * - Ripple effect on interaction
 * - Full accessibility support
 *
 * @example
 * ```typescript
 * // Create a standard icon button
 * const menuButton = createIconButton({
 *   icon: '<svg viewBox="0 0 24 24">...</svg>',
 *   ariaLabel: 'Open menu'
 * });
 *
 * // Create a toggle icon button (favorite)
 * const favoriteButton = createIconButton({
 *   icon: '<svg>...</svg>', // outlined heart
 *   selectedIcon: '<svg>...</svg>', // filled heart
 *   toggle: true,
 *   ariaLabel: 'Add to favorites'
 * });
 *
 * // Listen for toggle events
 * favoriteButton.on('toggle', (e) => {
 *   console.log('Selected:', e.detail.selected);
 * });
 *
 * // Attach to DOM
 * container.appendChild(menuButton.element);
 * ```
 *
 * @category Components
 */

export { default, default as createIconButton } from './icon-button';

export type {
  IconButtonConfig,
  IconButtonComponent,
  IconAPI,
  ToggleManager
} from './types';

export {
  ICON_BUTTON_VARIANTS,
  ICON_BUTTON_SIZES,
  ICON_BUTTON_SHAPES,
  ICON_BUTTON_WIDTHS,
  ICON_BUTTON_CLASSES,
  ICON_BUTTON_CONTAINER_SIZES,
  ICON_BUTTON_ICON_SIZES,
  ICON_BUTTON_WIDTH_VALUES,
  ICON_BUTTON_CORNER_RADIUS
} from './constants';

export type {
  IconButtonVariant,
  IconButtonSize,
  IconButtonShape,
  IconButtonWidth
} from './constants';
