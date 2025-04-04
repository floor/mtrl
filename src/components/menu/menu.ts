// src/components/menu/menu.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withAPI } from './api';
import { withVisibility } from './features/visibility';
import { withItemsManager } from './features/items-manager';
import { withPositioning } from './features/positioning';
import { withKeyboardNavigation } from './features/keyboard-navigation';
import { MenuConfig, MenuComponent } from './types';
import { 
  createBaseConfig, 
  getElementConfig,
  getApiConfig
} from './config';

/**
 * Creates a new Menu component
 * 
 * Creates a Material Design 3 menu that displays a list of choices on a temporary surface.
 * The menu can be positioned relative to other elements, trigger events on selection,
 * and support keyboard navigation.
 * 
 * The returned component provides these methods:
 * 
 * `show()` - Shows the menu
 * `hide()` - Hides the menu
 * `position(target, options)` - Positions the menu relative to a target element
 * `addItem(config)` - Adds a menu item
 * `removeItem(name)` - Removes a menu item
 * `getItems()` - Gets all menu items
 * `isVisible()` - Checks if the menu is visible
 * `on(event, handler)` - Adds event listener
 * `off(event, handler)` - Removes event listener
 * `destroy()` - Destroys the menu component
 * 
 * @param {MenuConfig} config - Menu configuration options
 * @returns {MenuComponent} Menu component instance
 * 
 * @example
 * ```typescript
 * // Create a basic menu with items
 * const menu = fMenu({
 *   items: [
 *     { name: 'item1', text: 'Option 1' },
 *     { name: 'item2', text: 'Option 2' },
 *     { type: 'divider' },
 *     { name: 'item3', text: 'Option 3' }
 *   ]
 * });
 * 
 * // Show the menu positioned relative to a button
 * const button = document.getElementById('menuButton');
 * menu.position(button).show();
 * 
 * // Listen for item selection
 * menu.on('select', (event) => {
 *   console.log(`Selected: ${event.name}`);
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Create a menu with nested submenus
 * const menu = fMenu({
 *   items: [
 *     { name: 'edit', text: 'Edit' },
 *     { 
 *       name: 'share', 
 *       text: 'Share', 
 *       items: [
 *         { name: 'email', text: 'Email' },
 *         { name: 'link', text: 'Copy Link' }
 *       ]
 *     },
 *     { type: 'divider' },
 *     { name: 'delete', text: 'Delete' }
 *   ],
 *   stayOpenOnSelect: true
 * });
 * 
 * // Add items dynamically
 * menu.addItem({ name: 'newItem', text: 'New Item' });
 * ```
 * 
 * @example
 * ```typescript
 * // Using menu with custom positioning
 * const menu = fMenu({
 *   items: [
 *     { name: 'cut', text: 'Cut' },
 *     { name: 'copy', text: 'Copy' },
 *     { name: 'paste', text: 'Paste' }
 *   ]
 * });
 * 
 * // Position with custom alignment
 * contextButton.addEventListener('click', (event) => {
 *   menu.position(contextButton, {
 *     align: 'right',
 *     vAlign: 'top',
 *     offsetY: 8
 *   }).show();
 *   
 *   event.stopPropagation();
 * });
 * 
 * // Close menu when clicking outside
 * document.addEventListener('click', () => {
 *   if (menu.isVisible()) {
 *     menu.hide();
 *   }
 * });
 * ```
 */
const fMenu = (config: MenuConfig = {}): MenuComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create menu component
    const menu = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withLifecycle(),
      withItemsManager(baseConfig),
      withVisibility(baseConfig),
      withPositioning,
      withKeyboardNavigation(baseConfig),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    // Handle circular dependency for submenus
    // This is needed because we need the complete menu factory function
    // to create submenus, but we can't import it directly in items-manager
    if (menu.setCreateSubmenuFunction) {
      menu.setCreateSubmenuFunction(fMenu);
    }

    return menu as MenuComponent;
  } catch (error) {
    console.error('Menu creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create menu: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default fMenu;