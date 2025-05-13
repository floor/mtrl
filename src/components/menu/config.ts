// src/components/menu/config.ts

import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component';
import { MenuConfig } from './types';
import { MENU_POSITION, MENU_DEFAULTS, MENU_CLASSES } from './constants';

/**
 * Default configuration for the Menu component
 * These values will be used when not explicitly specified by the user.
 * 
 * @category Components
 */

export const defaultConfig: Partial<MenuConfig> = {
  items: [],
  position: MENU_DEFAULTS.POSITION,
  closeOnSelect: MENU_DEFAULTS.CLOSE_ON_SELECT,
  closeOnClickOutside: MENU_DEFAULTS.CLOSE_ON_CLICK_OUTSIDE,
  closeOnEscape: MENU_DEFAULTS.CLOSE_ON_ESCAPE,
  openSubmenuOnHover: MENU_DEFAULTS.OPEN_SUBMENU_ON_HOVER,
  offset: MENU_DEFAULTS.OFFSET,
  autoFlip: MENU_DEFAULTS.AUTO_FLIP,
  visible: false
};

/**
 * Creates the base configuration for Menu component by merging user-provided
 * config with default values.
 * 
 * @param {MenuConfig} config - User provided configuration
 * @returns {MenuConfig} Complete configuration with defaults applied
 * @category Components
 * @internal
 */
export const createBaseConfig = (config: MenuConfig): MenuConfig => {
  // First, ensure we have an opener element
  if (!config.opener) {
    throw new Error('Menu component requires an opener element or selector');
  }
  
  // Apply default configuration
  return createComponentConfig(defaultConfig, config, 'menu') as MenuConfig;
};

/**
 * Generates element configuration for the Menu component.
 * This function creates the necessary attributes and configuration
 * for the DOM element creation process.
 * 
 * @param {MenuConfig} config - Menu configuration
 * @returns {Object} Element configuration object for withElement
 * @category Components
 * @internal
 */
export const getElementConfig = (config: MenuConfig) => {
  // Custom styles based on configuration
  const styles: Record<string, string> = {};
  
  if (config.width) {
    styles.width = config.width;
  }
  
  if (config.maxHeight) {
    styles.maxHeight = config.maxHeight;
  }
  
  // Element attributes
  const attrs: Record<string, any> = {
    role: 'menu',
    tabindex: '-1',
    'aria-hidden': (!config.visible).toString(),
    style: Object.entries(styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join(';')
  };
  
  return createElementConfig(config, {
    tag: 'div',
    attrs,
    className: [
      config.visible ? MENU_CLASSES.VISIBLE : null,
      config.class
    ].filter(Boolean),
    forwardEvents: {
      keydown: true
    }
  });
};

/**
 * Creates API configuration for the Menu component.
 * This connects the core component features to the public API.
 * 
 * @param {Object} component - Component with menu features
 * @returns {Object} API configuration object
 * @category Components
 * @internal
 */
export const getApiConfig = (component) => ({
  menu: {
    open: (event, interactionType) => component.menu?.open(event, interactionType),
    close: (event, restoreFocus, skipAnimation) => component.menu?.close(event, restoreFocus, skipAnimation),
    toggle: (event, interactionType) => component.menu?.toggle(event, interactionType),
    isOpen: () => component.menu?.isOpen() || false,
    setItems: (items) => component.menu?.setItems(items),
    getItems: () => component.menu?.getItems() || [],
    setPosition: (position) => component.menu?.setPosition(position),
    getPosition: () => component.menu?.getPosition(),
    setSelected: (itemId) => component.menu?.setSelected(itemId),
    getSelected: () => component.menu?.getSelected()
  },
  opener: {
    setOpener: (opener) => component.opener?.setOpener(opener),
    getOpener: () => component.opener?.getOpener()
  },
  submenu: {
    hasOpenSubmenu: () => component.submenu?.hasOpenSubmenu() || false,
    closeAllSubmenus: () => component.submenu?.closeAllSubmenus()
  },
  events: {
    on: (event, handler) => component.on?.(event, handler),
    off: (event, handler) => component.off?.(event, handler)
  },
  lifecycle: {
    destroy: () => component.lifecycle?.destroy()
  }
});

export default defaultConfig;