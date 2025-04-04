// src/components/menu/menu-item.ts
import { MenuItemConfig } from './types';
import { MENU_ITEM_TYPE, getMenuClass } from './utils';

/**
 * Creates a DOM element for a menu item
 * 
 * Generates an HTMLElement (li) based on the provided configuration.
 * Handles different types of menu items (standard, divider, submenu),
 * applies proper CSS classes, and sets appropriate ARIA attributes
 * for accessibility.
 * 
 * @param {MenuItemConfig} itemConfig - Item configuration
 * @param {string} prefix - CSS class prefix (default: 'mtrl')
 * @returns {HTMLElement} Menu item DOM element
 * 
 * @example
 * ```typescript
 * // Create a standard menu item
 * const itemElement = fMenuItem(
 *   { name: 'edit', text: 'Edit' },
 *   'mtrl'
 * );
 * 
 * // Create a disabled menu item
 * const disabledItem = fMenuItem(
 *   { name: 'print', text: 'Print', disabled: true },
 *   'mtrl'
 * );
 * 
 * // Create a divider
 * const divider = fMenuItem(
 *   { type: 'divider' },
 *   'mtrl'
 * );
 * 
 * // Create an item with submenu indicator
 * const submenuItem = fMenuItem(
 *   {
 *     name: 'share',
 *     text: 'Share',
 *     items: [
 *       { name: 'email', text: 'Email' },
 *       { name: 'link', text: 'Copy Link' }
 *     ]
 *   },
 *   'mtrl'
 * );
 * ```
 * 
 * @internal
 * @category Components
 */
export const fMenuItem = (itemConfig: MenuItemConfig, prefix: string): HTMLElement => {
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