// src/components/menu/index.ts

/**
 * Menu component module
 * 
 * The Menu component provides a Material Design 3 compliant dropdown menu
 * system with support for nested menus, keyboard navigation, and accessibility.
 * 
 * @module components/menu
 * @category Components
 */

// Export main component factory
export { default } from './menu';

// Export types and interfaces
export type { 
  MenuConfig, 
  MenuComponent, 
  MenuItem, 
  MenuDivider,
  MenuContent,
  MenuEvent,
  MenuSelectEvent,
  MenuPosition
} from './types';

/**
 * Constants for menu position values - use these instead of string literals
 * for better code completion and type safety.
 * 
 * @example
 * import { createMenu, MENU_POSITION } from 'mtrl';
 * 
 * // Create a menu positioned at the bottom-right of its opener
 * const menu = createMenu({ 
 *   opener: '#dropdown-button',
 *   items: [...],
 *   position: MENU_POSITION.BOTTOM_END 
 * });
 * 
 * @category Components
 */
export { MENU_POSITION } from './types';