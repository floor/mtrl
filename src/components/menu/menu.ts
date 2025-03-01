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
 * @param {MenuConfig} config - Menu configuration
 * @returns {MenuComponent} Menu component instance
 */
const createMenu = (config: MenuConfig = {}): MenuComponent => {
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
      menu.setCreateSubmenuFunction(createMenu);
    }

    return menu as MenuComponent;
  } catch (error) {
    console.error('Menu creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create menu: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createMenu;