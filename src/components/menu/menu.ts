// src/components/menu/menu.ts

import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withController, withOpener, withPosition, withKeyboard, withSubmenu } from './features';
import { withAPI } from './api';
import { MenuConfig, MenuComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Menu component with the specified configuration.
 * 
 * The Menu component implements the Material Design 3 menu specifications,
 * providing a flexible dropdown menu system with support for nested menus,
 * keyboard navigation, and ARIA accessibility.
 * 
 * Menus are built using a functional composition pattern, applying various 
 * features through the pipe function for a modular architecture.
 * 
 * The menu element is not added to the DOM until it's opened, and it's removed
 * from the DOM when closed, following best practices for dropdown menus.
 * 
 * @param {MenuConfig} config - Configuration options for the menu
 *  This must include an opener element or selector, and an array of menu items.
 *  See {@link MenuConfig} for all available options.
 * 
 * @returns {MenuComponent} A fully configured menu component instance with
 *  all requested features applied. The returned component has methods for
 *  menu manipulation, event handling, and lifecycle management.
 * 
 * @throws {Error} Throws an error if menu creation fails or if required
 *  configuration (like opener) is missing.
 * 
 * @category Components
 */
const createMenu = (config: MenuConfig): MenuComponent => {
  try {
    // Validate and create the base configuration
    const baseConfig = createBaseConfig(config);
    
    // Create the component through functional composition
    const menu = pipe(
      createBase,                                // Base component
      withEvents(),                              // Event handling
      withElement(getElementConfig(baseConfig)), // DOM element
      withPosition(baseConfig),                  // Position management
      withKeyboard(baseConfig),                  // Keyboard navigation
      withSubmenu(baseConfig),                   // Submenu management
      withController(baseConfig),                // Menu controller
      withOpener(baseConfig),                    // Opener management
      withLifecycle(),                           // Lifecycle management
      comp => withAPI(getApiConfig(comp))(comp)  // Public API
    )(baseConfig);
    
    // The menu will be added to the DOM when opened and removed when closed
    
    return menu;
  } catch (error) {
    console.error('Menu creation error:', error);
    throw new Error(`Failed to create menu: ${(error as Error).message}`);
  }
};

export default createMenu;