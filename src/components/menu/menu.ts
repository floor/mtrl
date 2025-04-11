// src/components/menu/menu.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
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
import { withAPI } from './api';

/**
 * Creates a new Menu component
 * 
 * Creates a Material Design 3 menu that displays a list of choices on a temporary surface.
 * The menu can be positioned relative to other elements, trigger events on selection,
 * and support keyboard navigation.
 * 
 * @param {MenuConfig} config - Menu configuration options
 * @returns {MenuComponent} Menu component instance
 * 
 * @example
 * ```typescript
 * // Create a basic menu with items
 * const menu = createMenu({
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
 */
const createMenu = (config: MenuConfig = {}): MenuComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create menu component using composition
    const menu = pipe(
      // Core component setup
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      
      // Menu-specific features
      withVisibility(baseConfig),
      withItemsManager(baseConfig),
      withPositioning(),
      withKeyboardNavigation(baseConfig),
      
      // Lifecycle management
      withLifecycle(),
      
      // Apply public API
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    // Handle circular dependency for submenus
    if (menu.setCreateMenuFunction) {
      menu.setCreateMenuFunction(createMenu);
    }

    return menu as MenuComponent;
  } catch (error) {
    console.error('Menu creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create menu: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createMenu;