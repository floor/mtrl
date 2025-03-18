// src/components/menu/menu-item.ts
import { MenuItemConfig } from './types';
import { MENU_ITEM_TYPE, getMenuClass } from './utils';

/**
 * Creates a menu item element
 * @param {MenuItemConfig} itemConfig - Item configuration
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Menu item element
 */
export const createMenuItem = (itemConfig: MenuItemConfig, prefix: string): HTMLElement => {
  const item = document.createElement('li');
  item.className = `${prefix}-${getMenuClass('ITEM')}`;

  if (itemConfig.type === MENU_ITEM_TYPE.DIVIDER) {
    item.className = `${prefix}-${getMenuClass('DIVIDER')}`;
    return item;
  }

  if (itemConfig.class) {
    item.className += ` ${itemConfig.class}`;
  }

  if (itemConfig.disabled) {
    item.setAttribute('aria-disabled', 'true');
    item.className += ` ${prefix}-${getMenuClass('ITEM')}--disabled`;
  }

  if (itemConfig.name) {
    item.setAttribute('data-name', itemConfig.name);
  }

  item.textContent = itemConfig.text || '';

  if (itemConfig.items?.length) {
    item.className += ` ${prefix}-${getMenuClass('ITEM')}--submenu`;
    item.setAttribute('aria-haspopup', 'true');
    item.setAttribute('aria-expanded', 'false');
    // We don't need to add a submenu indicator as it's handled by CSS ::after
  }

  return item;
}