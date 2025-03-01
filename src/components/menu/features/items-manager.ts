// src/components/menu/features/items-manager.ts
import { createMenuItem } from '../menu-item';
import { MENU_EVENTS } from '../constants';
import { BaseComponent, MenuConfig, MenuItemConfig, MenuItemData } from '../types';

interface SubmenuMap {
  [key: string]: BaseComponent;
}

/**
 * Adds menu items management functionality to a component
 * @param {MenuConfig} config - Menu configuration
 * @returns {Function} Component enhancer
 */
export const withItemsManager = (config: MenuConfig) => (component: BaseComponent): BaseComponent => {
  const submenus: Map<string, BaseComponent> = new Map();
  const itemsMap: Map<string, MenuItemConfig> = new Map();
  let activeSubmenu: BaseComponent | null = null;
  let currentHoveredItem: HTMLElement | null = null;
  const prefix = config.prefix || 'mtrl';

  // Create items container
  const list = document.createElement('ul');
  list.className = `${prefix}-menu-list`;
  list.setAttribute('role', 'menu');
  component.element.appendChild(list);

  /**
   * Factory function for creating a submenu
   * This will be defined after we've created a createMenu import 
   * to avoid circular dependency
   */
  let createSubmenuFunction: any = null;

  /**
   * Sets the submenu creation function
   * @param {Function} createMenuFn - Function to create a menu
   */
  const setCreateSubmenuFunction = (createMenuFn: any): void => {
    createSubmenuFunction = createMenuFn;
  };

  /**
   * Creates a submenu for a menu item
   * @param {string} name - Item name
   * @param {HTMLElement} item - Menu item element
   * @returns {BaseComponent|null} Submenu component
   */
  const createSubmenu = (name: string, item: HTMLElement): BaseComponent | null => {
    if (!createSubmenuFunction) {
      console.error('Submenu creation function not set. Call setCreateSubmenuFunction first.');
      return null;
    }

    const itemConfig = itemsMap.get(name);
    if (!itemConfig?.items) return null;

    const submenu = createSubmenuFunction({
      ...config,
      items: itemConfig.items,
      class: `${prefix}-menu--submenu`,
      parentItem: item
    });

    // Handle submenu selection
    submenu.on?.(MENU_EVENTS.SELECT, (detail: any) => {
      component.emit?.(MENU_EVENTS.SELECT, {
        name: `${name}:${detail.name}`,
        text: detail.text,
        path: [name, detail.name]
      });
    });

    return submenu;
  };

  /**
   * Opens a submenu
   * @param {string} name - Item name
   * @param {HTMLElement} item - Menu item element
   */
  const openSubmenu = (name: string, item: HTMLElement): void => {
    // Close any open submenu that's different
    if (activeSubmenu && submenus.get(name) !== activeSubmenu) {
      const activeItem = list.querySelector('[aria-expanded="true"]');
      if (activeItem && activeItem !== item) {
        activeItem.setAttribute('aria-expanded', 'false');
      }
      activeSubmenu.hide?.();
      activeSubmenu = null;
    }

    // If submenu doesn't exist yet, create it
    if (!submenus.has(name)) {
      const submenu = createSubmenu(name, item);
      if (submenu) {
        submenus.set(name, submenu);
      } else {
        return; // No items to show
      }
    }

    // Get submenu and show it if not already showing
    const submenu = submenus.get(name);
    if (submenu && (activeSubmenu !== submenu || item.getAttribute('aria-expanded') === 'false')) {
      item.setAttribute('aria-expanded', 'true');
      activeSubmenu = submenu;

      // Position submenu relative to item
      submenu.show?.();
      submenu.position?.(item, {
        align: 'right',
        vAlign: 'top',
        offsetX: 0,
        offsetY: 0
      });

      // Emit submenu open event
      component.emit?.(MENU_EVENTS.SUBMENU_OPEN, { name });
    }
  };

  /**
   * Closes a submenu
   * @param {string} name - Item name
   * @param {boolean} force - Whether to force close even if submenu is hovered
   */
  const closeSubmenu = (name: string, force = false): void => {
    const submenu = submenus.get(name);
    if (!submenu || activeSubmenu !== submenu) return;

    // Don't close if submenu is currently being hovered, unless forced
    if (!force && submenu.element && submenu.element.matches(':hover')) {
      return;
    }

    const item = list.querySelector(`[data-name="${name}"][aria-expanded="true"]`);
    if (item) {
      item.setAttribute('aria-expanded', 'false');
    }

    submenu.hide?.();
    activeSubmenu = null;

    // Emit submenu close event
    component.emit?.(MENU_EVENTS.SUBMENU_CLOSE, { name });
  };

  /**
   * Handles mouseenter for submenu items
   * @param {MouseEvent} event - Mouse event
   */
  const handleMouseEnter = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const item = target.closest(`.${prefix}-menu-item--submenu`) as HTMLElement;
    if (!item) return;

    const name = item.getAttribute('data-name');
    if (!name) return;
    
    // Cancel any pending close timer for this item
    if (closeTimers.has(name)) {
      window.clearTimeout(closeTimers.get(name));
      closeTimers.delete(name);
    }
    
    // Small delay before opening to prevent erratic behavior when moving quickly
    window.setTimeout(() => {
      // Only open if we're still hovering this item (prevents multiple open attempts)
      if (item.matches(':hover')) {
        openSubmenu(name, item);
        currentHoveredItem = item;
      }
    }, 50);
  };

  // Track pending close timers
  const closeTimers: Map<string, number> = new Map();

  /**
   * Handles mouseleave for submenu items
   * @param {MouseEvent} event - Mouse event
   */
  const handleMouseLeave = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const item = target.closest(`.${prefix}-menu-item--submenu`) as HTMLElement;
    if (!item) return;

    const name = item.getAttribute('data-name');
    if (!name) return;

    // Only close if we're not entering the submenu
    const submenu = submenus.get(name);
    if (submenu && submenu.element) {
      // Cancel any existing close timer for this item
      if (closeTimers.has(name)) {
        window.clearTimeout(closeTimers.get(name));
      }

      // Set a new close timer
      const timerId = window.setTimeout(() => {
        if (!submenu.element.matches(':hover') &&
            !item.matches(':hover')) {
          closeSubmenu(name);
        }
        closeTimers.delete(name);
      }, 300); // Longer delay for smoother experience

      closeTimers.set(name, timerId);
    }

    currentHoveredItem = null;
  };

  /**
   * Adds hover handlers to submenu items
   */
  const addHoverHandlers = (): void => {
    // First remove any existing handlers to prevent duplicates
    list.querySelectorAll(`.${prefix}-menu-item--submenu`).forEach(item => {
      item.removeEventListener('mouseenter', handleMouseEnter);
      item.removeEventListener('mouseleave', handleMouseLeave);

      // Add the event listeners
      item.addEventListener('mouseenter', handleMouseEnter);
      item.addEventListener('mouseleave', handleMouseLeave);
    });
  };

  /**
   * Handles click events on menu items
   * @param {MouseEvent} event - Click event
   */
  const handleItemClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const item = target.closest(`.${prefix}-menu-item`) as HTMLElement;
    if (!item || item.getAttribute('aria-disabled') === 'true') return;

    // For submenu items, toggle submenu
    if (item.classList.contains(`${prefix}-menu-item--submenu`)) {
      const name = item.getAttribute('data-name');
      if (!name) return;

      // If expanded, close it
      if (item.getAttribute('aria-expanded') === 'true') {
        closeSubmenu(name, true); // Force close
      } else {
        // Otherwise open it
        openSubmenu(name, item);
      }
      return;
    }

    // For regular items, emit select event
    const name = item.getAttribute('data-name');
    if (name) {
      component.emit?.(MENU_EVENTS.SELECT, { name, text: item.textContent });
      // Hide menu after selection unless configured otherwise
      if (!config.stayOpenOnSelect) {
        component.hide?.();
      }
    }
  };

  // Handle item clicks
  list.addEventListener('click', handleItemClick);

  // Create initial items
  if (config.items) {
    config.items.forEach(itemConfig => {
      const item = createMenuItem(itemConfig, prefix);
      list.appendChild(item);

      // Store item config for later use
      if (itemConfig.name) {
        itemsMap.set(itemConfig.name, itemConfig);
      }
    });
  }

  // Add hover handlers after all items are created
  addHoverHandlers();

  // Override show method to reset state and ensure hover handlers
  const originalShow = component.show;
  if (originalShow) {
    component.show = function (...args: any[]) {
      // Reset state when showing menu
      currentHoveredItem = null;

      // Ensure all items have hover handlers
      setTimeout(addHoverHandlers, 0);

      return originalShow.apply(this, args);
    };
  }

  // Override hide method to close all submenus
  const originalHide = component.hide;
  if (originalHide) {
    component.hide = function (...args: any[]) {
      // Close all submenus
      if (activeSubmenu) {
        activeSubmenu.hide?.();
        activeSubmenu = null;

        const expandedItems = list.querySelectorAll('[aria-expanded="true"]');
        expandedItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false');
        });
      }

      // Reset state
      currentHoveredItem = null;

      return originalHide.apply(this, args);
    };
  }

  // Add cleanup
  const originalDestroy = component.lifecycle?.destroy;
  if (component.lifecycle) {
    component.lifecycle.destroy = () => {
      // Remove hover handlers from all items
      list.querySelectorAll(`.${prefix}-menu-item--submenu`).forEach(item => {
        item.removeEventListener('mouseenter', handleMouseEnter);
        item.removeEventListener('mouseleave', handleMouseLeave);
      });

      // Remove click listener
      list.removeEventListener('click', handleItemClick);

      // Reset state
      currentHoveredItem = null;

      // Clear all pending timers
      closeTimers.forEach(timerId => window.clearTimeout(timerId));
      closeTimers.clear();

      // Destroy all submenus
      submenus.forEach(submenu => submenu.destroy?.());
      submenus.clear();
      itemsMap.clear();

      if (originalDestroy) {
        originalDestroy();
      }
    };
  }

  return {
    ...component,

    // Expose the setCreateSubmenuFunction method
    setCreateSubmenuFunction,

    /**
     * Closes any open submenus
     * @returns {BaseComponent} Component instance
     */
    closeSubmenus() {
      if (activeSubmenu) {
        activeSubmenu.hide?.();
        activeSubmenu = null;

        const expandedItems = list.querySelectorAll('[aria-expanded="true"]');
        expandedItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false');
        });
      }
      return this;
    },

    /**
     * Adds an item to the menu
     * @param {MenuItemConfig} itemConfig - Item configuration
     * @returns {BaseComponent} Component instance
     */
    addItem(itemConfig: MenuItemConfig) {
      if (!itemConfig) return this;

      const item = createMenuItem(itemConfig, prefix);
      list.appendChild(item);

      // Store item config for later use
      if (itemConfig.name) {
        itemsMap.set(itemConfig.name, itemConfig);
      }

      // If it's a submenu item, add hover handlers
      if (itemConfig.items?.length) {
        item.addEventListener('mouseenter', handleMouseEnter);
        item.addEventListener('mouseleave', handleMouseLeave);
      }

      return this;
    },

    /**
     * Removes an item from the menu
     * @param {string} name - Item name
     * @returns {BaseComponent} Component instance
     */
    removeItem(name: string) {
      if (!name) return this;

      // First, ensure we remove the item from our internal map
      itemsMap.delete(name);

      // Now try to remove the item from the DOM
      const item = list.querySelector(`[data-name="${name}"]`);
      if (item) {
        // Remove event listeners
        item.removeEventListener('mouseenter', handleMouseEnter);
        item.removeEventListener('mouseleave', handleMouseLeave);

        // Close any submenu associated with this item
        if (submenus.has(name)) {
          const submenu = submenus.get(name);
          submenu?.destroy?.();
          submenus.delete(name);
        }

        // Remove the item from the DOM
        item.remove();
      }

      return this;
    },

    /**
     * Gets all registered items
     * @returns {Map<string, MenuItemConfig>} Map of item names to configurations
     */
    getItems(): Map<string, MenuItemData> {
      const result = new Map<string, MenuItemData>();
      
      itemsMap.forEach((config, name) => {
        const element = list.querySelector(`[data-name="${name}"]`) as HTMLElement;
        if (element) {
          result.set(name, { element, config });
        }
      });
      
      return result;
    },

    /**
     * Refreshes all hover handlers
     * @returns {BaseComponent} Component instance
     */
    refreshHoverHandlers() {
      addHoverHandlers();
      return this;
    }
  };
};