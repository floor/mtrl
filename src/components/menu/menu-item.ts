// src/components/menu/menu-item.ts
import { MenuItemConfig } from './types';
import { MENU_ITEM_TYPE } from './utils';

/**
 * Creates a DOM element for a menu item
 * 
 * @param {MenuItemConfig} itemConfig - Item configuration
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Menu item DOM element
 * 
 * @internal
 */
export const createMenuItem = (itemConfig: MenuItemConfig, prefix: string): HTMLElement => {
  if (!itemConfig) {
    throw new Error('Item configuration is required');
  }
  
  // For dividers, create a simple divider element
  if (itemConfig.type === MENU_ITEM_TYPE.DIVIDER) {
    const divider = document.createElement('li');
    divider.className = `${prefix}-menu-divider`;
    divider.setAttribute('role', 'separator');
    divider.setAttribute('aria-orientation', 'horizontal');
    return divider;
  }
  
  // Create a regular menu item
  const item = document.createElement('li');
  item.className = `${prefix}-menu-item`;
  item.setAttribute('role', 'menuitem');
  
  // Add item name as data attribute
  if (itemConfig.name) {
    item.setAttribute('data-name', itemConfig.name);
  }
  
  // Set text content
  item.textContent = itemConfig.text || '';
  
  // Apply custom class if provided
  if (itemConfig.class) {
    item.className += ` ${itemConfig.class}`;
  }
  
  // Handle disabled state
  if (itemConfig.disabled) {
    item.className += ` ${prefix}-menu-item--disabled`;
    item.setAttribute('aria-disabled', 'true');
  }
  
  // Handle submenu items
  if (Array.isArray(itemConfig.items) && itemConfig.items.length > 0) {
    item.className += ` ${prefix}-menu-item--submenu`;
    item.setAttribute('aria-haspopup', 'true');
    item.setAttribute('aria-expanded', 'false');
  }
  
  return item;
};