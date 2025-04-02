// src/components/menu/index.ts

/**
 * @module Menu
 * 
 * Menu component following Material Design 3 guidelines.
 * Menus display a list of choices on a temporary surface, appearing when users
 * interact with a button, action, or other control.
 * 
 * The main export is the {@link default | createMenu} factory function that creates
 * a {@link MenuComponent} instance with the provided configuration.
 * 
 * Features:
 * - Configurable positioning relative to other elements
 * - Support for nested submenus
 * - Keyboard navigation and accessibility
 * - Item selection events
 * - Automatic handling of outside clicks
 * - Support for dividers and disabled items
 * - Dynamic item management
 * 
 * @example
 * ```typescript
 * // Create a basic menu
 * const menu = createMenu({
 *   items: [
 *     { name: 'edit', text: 'Edit' },
 *     { name: 'duplicate', text: 'Duplicate' },
 *     { type: 'divider' },
 *     { name: 'delete', text: 'Delete', class: 'danger-item' }
 *   ]
 * });
 * 
 * // Show the menu positioned relative to a button
 * const button = document.getElementById('menuButton');
 * button.addEventListener('click', () => {
 *   menu.position(button).show();
 * });
 * 
 * // Handle menu selection
 * menu.on('select', (event) => {
 *   console.log(`Selected: ${event.name}`);
 *   
 *   if (event.name === 'delete') {
 *     // Confirm deletion
 *     if (confirm('Are you sure?')) {
 *       deleteItem();
 *     }
 *   }
 * });
 * ```
 * 
 * @category Components
 */

/**
 * Factory function to create a new Menu component.
 * @see MenuComponent for the full API reference
 */
export { default } from './menu';

/**
 * Menu component types and interfaces
 * 
 * These types define the structure and behavior of the Menu component.
 */
export {
  MenuConfig,
  MenuComponent,
  MenuItemConfig,
  MenuPositionConfig,
  MenuAlign,
  MenuVerticalAlign,
  MenuItemType,
  MenuEvent
} from './types';