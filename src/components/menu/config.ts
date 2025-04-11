// src/components/menu/config.ts

import { 
  createComponentConfig, 
  createElementConfig,
  BaseComponentConfig 
} from '../../core/config/component-config';
import { MenuConfig, MENU_PLACEMENT } from './types';

/**
 * Default configuration for the Menu component
 * These values will be used when not explicitly specified by the user.
 * 
 * @category Components
 */
export const defaultConfig: MenuConfig = {
  items: [],
  placement: MENU_PLACEMENT.BOTTOM_START,
  closeOnSelect: true,
  closeOnClickOutside: true,
  closeOnEscape: true,
  openSubmenuOnHover: true,
  offset: 8,
  autoFlip: true,
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
  // First, ensure we have an anchor element
  if (!config.anchor) {
    throw new Error('Menu component requires an anchor element or selector');
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
      config.visible ? 'menu--visible' : null,
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
    open: () => component.menu?.open(),
    close: () => component.menu?.close(),
    toggle: () => component.menu?.toggle(),
    isOpen: () => component.menu?.isOpen() || false,
    setItems: (items) => component.menu?.setItems(items),
    getItems: () => component.menu?.getItems() || [],
    setPlacement: (placement) => component.menu?.setPlacement(placement),
    getPlacement: () => component.menu?.getPlacement()
  },
  anchor: {
    setAnchor: (anchor) => component.anchor?.setAnchor(anchor),
    getAnchor: () => component.anchor?.getAnchor()
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