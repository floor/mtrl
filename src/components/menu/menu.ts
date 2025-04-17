// src/components/menu/menu.ts

import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { withController, withAnchor, withPosition, withKeyboard } from './features';
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
 *  This must include an anchor element or selector, and an array of menu items.
 *  See {@link MenuConfig} for all available options.
 * 
 * @returns {MenuComponent} A fully configured menu component instance with
 *  all requested features applied. The returned component has methods for
 *  menu manipulation, event handling, and lifecycle management.
 * 
 * @throws {Error} Throws an error if menu creation fails or if required
 *  configuration (like anchor) is missing.
 * 
 * @category Components
 * 
 * @example
 * // Create a simple menu anchored to a button
 * const menuButton = document.getElementById('menu-button');
 * const menu = createMenu({
 *   anchor: menuButton,
 *   items: [
 *     { id: 'item1', text: 'Option 1' },
 *     { id: 'item2', text: 'Option 2' },
 *     { type: 'divider' },
 *     { id: 'item3', text: 'Option 3' }
 *   ]
 * });
 * 
 * // Add event listener for item selection
 * menu.on('select', (event) => {
 *   console.log('Selected item:', event.itemId);
 * });
 * 
 * // Menu will be added to the DOM when opened and removed when closed
 * menuButton.addEventListener('click', () => menu.toggle());
 * 
 * @example
 * // Create a menu with nested submenus
 * const menu = createMenu({
 *   anchor: '#more-button',
 *   items: [
 *     { id: 'edit', text: 'Edit', icon: '<svg>...</svg>' },
 *     { 
 *       id: 'share', 
 *       text: 'Share', 
 *       hasSubmenu: true,
 *       submenu: [
 *         { id: 'email', text: 'Email' },
 *         { id: 'link', text: 'Copy link' }
 *       ]
 *     },
 *     { type: 'divider' },
 *     { id: 'delete', text: 'Delete', icon: '<svg>...</svg>' }
 *   ],
 *   position: 'bottom-end'
 * });
 * 
 * @example
 * // Specify a custom position for the menu
 * const filterMenu = createMenu({
 *   anchor: filterButton,
 *   items: filterOptions,
 *   position: MENU_POSITION.TOP_START,
 *   width: '240px',
 *   maxHeight: '400px'
 * });
 * 
 * // Update the menu's position programmatically
 * filterMenu.setPosition(MENU_POSITION.BOTTOM_END);
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
      withController(baseConfig),                // Menu controller
      withAnchor(baseConfig),                    // Anchor management
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