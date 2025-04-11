// src/components/menu/features/items-manager.ts
import { PREFIX } from '../../../core/config';
import { createMenuItem } from '../menu-item';
import { MENU_EVENT } from '../utils';
import { BaseComponent, MenuConfig, MenuItemConfig, MenuItemData } from '../types';

/**
 * Adds menu items management functionality to a component
 * 
 * This feature handles:
 * - Creating and managing menu items
 * - Handling item interactions (clicks, focus, hover)
 * - Managing submenus with proper hover behavior
 * - Selection events
 * 
 * @param {MenuConfig} config - Menu configuration
 * @returns {Function} Component enhancer
 * 
 * @internal
 */
export const withItemsManager = (config: MenuConfig) => (component: BaseComponent): BaseComponent => {
  // State tracking
  const itemsMap = new Map<string, MenuItemConfig>();
  const submenus = new Map<string, BaseComponent>();
  let activeSubmenu: BaseComponent | null = null;
  const prefix = config.prefix || PREFIX;
  
  // Track interaction state
  let processingClick = false;
  let lastSelectedTime = 0;
  let currentHoveredItem: HTMLElement | null = null;
  
  // Timer references
  const hoverTimers = new Map<string, number>();
  const closeTimers = new Map<string, number>();
  
  // Store references to original methods
  const originalShow = component.show;
  const originalHide = component.hide;
  const originalDestroy = component.lifecycle?.destroy;
  
  // Create items container
  const list = document.createElement('ul');
  list.className = `${prefix}-menu-list`;
  list.setAttribute('role', 'menu');
  component.element.appendChild(list);
  
  /**
   * Create menu factory function reference
   * This will be set after component creation to avoid circular dependencies
   */
  let createMenuFunction: ((config: MenuConfig) => BaseComponent) | null = null;
  
  /**
   * Set the menu creation function
   * @param {Function} fn - Menu creation function
   */
  const setCreateMenuFunction = (fn: (config: MenuConfig) => BaseComponent): void => {
    createMenuFunction = fn;
  };
  
  /**
   * Creates a submenu for a menu item
   * @param {string} name - Item name
   * @param {HTMLElement} item - Menu item element
   * @returns {BaseComponent|null} Submenu component
   */
  const createSubmenu = (name: string, item: HTMLElement): BaseComponent | null => {
    if (!createMenuFunction) {
      console.error('Menu creation function not set. Call setCreateMenuFunction first.');
      return null;
    }
    
    const itemConfig = itemsMap.get(name);
    if (!itemConfig?.items?.length) return null;
    
    // Create submenu with proper configuration
    const submenu = createMenuFunction({
      ...config,
      items: itemConfig.items,
      class: `${prefix}-menu--submenu`,
      parentItem: item
    });
    
    // Set up event propagation for nested selection
    submenu.on?.(MENU_EVENT.SELECT, (detail: any) => {
      // Create a complete path for nested selection
      const event = {
        name: `${name}:${detail.name}`,
        text: detail.text,
        path: [name, ...(detail.path || [detail.name])]
      };
      
      // Emit the selection event
      component.emit?.(MENU_EVENT.SELECT, event);
      
      // Hide parent menu after selection unless configured to stay open
      if (!config.stayOpenOnSelect) {
        // Use a small delay to prevent race conditions with click events
        setTimeout(() => {
          component.hide?.();
        }, 10);
      }
    });
    
    return submenu;
  };
  
  /**
   * Opens a submenu
   * @param {string} name - Item name
   * @param {HTMLElement} item - Menu item element
   */
  const openSubmenu = (name: string, item: HTMLElement): void => {
    // Clear any pending close timer for this submenu
    if (closeTimers.has(name)) {
      window.clearTimeout(closeTimers.get(name)!);
      closeTimers.delete(name);
    }
    
    // Close any open submenu that's different from this one
    if (activeSubmenu && submenus.get(name) !== activeSubmenu) {
      const activeItem = list.querySelector('[aria-expanded="true"]');
      if (activeItem && activeItem !== item) {
        activeItem.setAttribute('aria-expanded', 'false');
      }
      activeSubmenu.hide?.();
      activeSubmenu = null;
    }
    
    // Create the submenu if it doesn't exist
    if (!submenus.has(name)) {
      const submenu = createSubmenu(name, item);
      if (submenu) {
        submenus.set(name, submenu);
      } else {
        return; // No valid submenu to show
      }
    }
    
    // Get the submenu
    const submenu = submenus.get(name)!;
    
    // If submenu is already active and visible, do nothing
    if (activeSubmenu === submenu && submenu.isVisible?.()) {
      return;
    }
    
    // Update the expanded state
    item.setAttribute('aria-expanded', 'true');
    activeSubmenu = submenu;
    
    // Position and show the submenu
    submenu.position?.(item, {
      align: 'right',
      vAlign: 'top',
      offsetX: 0,
      offsetY: 0
    });
    submenu.show?.();
    
    // Emit event
    component.emit?.(MENU_EVENT.SUBMENU_OPEN, { name });
  };
  
  /**
   * Closes a submenu
   * @param {string} name - Item name
   * @param {boolean} force - Whether to force close even during transitions
   */
  const closeSubmenu = (name: string, force = false): void => {
    const submenu = submenus.get(name);
    if (!submenu || (!force && submenu !== activeSubmenu)) return;
    
    // Update expanded state
    const item = list.querySelector(`[data-name="${name}"][aria-expanded="true"]`);
    if (item) {
      item.setAttribute('aria-expanded', 'false');
    }
    
    // Hide the submenu
    submenu.hide?.();
    activeSubmenu = null;
    
    // Emit event
    component.emit?.(MENU_EVENT.SUBMENU_CLOSE, { name });
  };
  
  /**
   * Schedules submenu close with delay
   * @param {string} name - Item name
   * @param {number} delay - Delay in milliseconds
   */
  const scheduleSubmenuClose = (name: string, delay: number = 300): void => {
    // Clear any existing close timer
    if (closeTimers.has(name)) {
      window.clearTimeout(closeTimers.get(name)!);
    }
    
    // Set new timer
    const timerId = window.setTimeout(() => {
      const submenu = submenus.get(name);
      
      // Only close if neither the submenu nor parent item is being hovered
      if (submenu) {
        const parentItem = list.querySelector(`[data-name="${name}"]`) as HTMLElement;
        
        // Check if submenu or parent is hovered
        const submenuHovered = submenu.element && submenu.element.matches(':hover');
        const parentHovered = parentItem && parentItem.matches(':hover');
        
        if (!submenuHovered && !parentHovered) {
          closeSubmenu(name);
        }
      }
      
      closeTimers.delete(name);
    }, delay) as unknown as number;
    
    closeTimers.set(name, timerId);
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
    
    // Clear any existing hover timer
    if (hoverTimers.has(name)) {
      window.clearTimeout(hoverTimers.get(name)!);
    }
    
    // Clear any existing close timer
    if (closeTimers.has(name)) {
      window.clearTimeout(closeTimers.get(name)!);
      closeTimers.delete(name);
    }
    
    // Set current hovered item
    currentHoveredItem = item;
    
    // Set timer to open submenu with delay
    const timerId = window.setTimeout(() => {
      if (item.matches(':hover')) {
        openSubmenu(name, item);
      }
      hoverTimers.delete(name);
    }, 200) as unknown as number;
    
    hoverTimers.set(name, timerId);
  };
  
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
    
    // Clear any pending hover timer
    if (hoverTimers.has(name)) {
      window.clearTimeout(hoverTimers.get(name)!);
      hoverTimers.delete(name);
    }
    
    // Schedule submenu close with delay (allows moving to submenu)
    scheduleSubmenuClose(name, 300);
    
    // Reset current hovered item if it matches this one
    if (currentHoveredItem === item) {
      currentHoveredItem = null;
    }
  };
  
  /**
   * Handles submenu mouseenter to prevent closing
   * @param {BaseComponent} submenu - Submenu component
   * @param {string} parentName - Name of parent item
   */
  const handleSubmenuMouseEnter = (submenu: BaseComponent, parentName: string): void => {
    // Clear close timer if set
    if (closeTimers.has(parentName)) {
      window.clearTimeout(closeTimers.get(parentName)!);
      closeTimers.delete(parentName);
    }
  };
  
  /**
   * Handles submenu mouseleave
   * @param {BaseComponent} submenu - Submenu component
   * @param {string} parentName - Name of parent item
   */
  const handleSubmenuMouseLeave = (submenu: BaseComponent, parentName: string): void => {
    // Schedule submenu close
    scheduleSubmenuClose(parentName, 300);
  };
  
  /**
   * Set up mouse hover handlers for submenu items
   * @param {HTMLElement} element - Menu item element
   * @param {string} name - Item name
   */
  const setupHoverHandlers = (element: HTMLElement, name: string): void => {
    if (!element) return;
    
    // Remove existing listeners to prevent duplicates
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
    
    // Add new listeners
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
  };
  
  /**
   * Set up mouse events for a submenu
   * @param {BaseComponent} submenu - Submenu component
   * @param {string} parentName - Name of parent item
   */
  const setupSubmenuEvents = (submenu: BaseComponent, parentName: string): void => {
    if (!submenu || !submenu.element) return;
    
    // Set up mouse events on the submenu element
    submenu.element.addEventListener('mouseenter', () => {
      handleSubmenuMouseEnter(submenu, parentName);
    });
    
    submenu.element.addEventListener('mouseleave', () => {
      handleSubmenuMouseLeave(submenu, parentName);
    });
  };
  
  /**
   * Handles click events on menu items
   * @param {MouseEvent} event - Click event
   */
  const handleItemClick = (event: MouseEvent): void => {
    // Prevent handling click events while another is being processed
    if (processingClick) {
      event.stopPropagation();
      return;
    }
    
    // Set the processing flag to prevent re-entrancy issues
    processingClick = true;
    
    try {
      const target = event.target as HTMLElement;
      const item = target.closest(`.${prefix}-menu-item`) as HTMLElement;
      
      // If no item found or item is disabled, do nothing
      if (!item || item.getAttribute('aria-disabled') === 'true') {
        processingClick = false;
        return;
      }
      
      // Get item name
      const name = item.getAttribute('data-name');
      if (!name) {
        processingClick = false;
        return;
      }
      
      // Always stop event propagation
      event.stopPropagation();
      
      // Handle submenu items
      if (item.classList.contains(`${prefix}-menu-item--submenu`)) {
        const isExpanded = item.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
          closeSubmenu(name);
        } else {
          openSubmenu(name, item);
        }
        
        processingClick = false;
        return;
      }
      
      // For regular items, emit select event
      const now = Date.now();
      lastSelectedTime = now;
      
      component.emit?.(MENU_EVENT.SELECT, { name, text: item.textContent });
      
      // Hide menu after selection unless configured otherwise
      if (!config.stayOpenOnSelect) {
        // Use a small delay to avoid conflicts with document click handler
        setTimeout(() => {
          component.hide?.();
        }, 10);
      }
    } finally {
      // Always reset the processing flag
      processingClick = false;
    }
  };
  
  /**
   * Adds a single item to the menu
   * @param {MenuItemConfig} itemConfig - Item configuration
   */
  const addSingleItem = (itemConfig: MenuItemConfig): void => {
    if (!itemConfig) return;
    
    // Create the item element
    const item = createMenuItem(itemConfig, prefix);
    list.appendChild(item);
    
    // Store item config for reference
    if (itemConfig.name) {
      itemsMap.set(itemConfig.name, itemConfig);
      
      // Set up hover handlers for items with submenus
      if (Array.isArray(itemConfig.items) && itemConfig.items.length > 0) {
        setupHoverHandlers(item, itemConfig.name);
      }
    }
  };
  
  /**
   * Set up hover events for all submenu items
   */
  const setupAllHoverHandlers = (): void => {
    // Set up handlers for all submenu items
    const submenuItems = list.querySelectorAll(`.${prefix}-menu-item--submenu`);
    submenuItems.forEach(item => {
      const name = item.getAttribute('data-name');
      if (name) {
        setupHoverHandlers(item as HTMLElement, name);
      }
    });
    
    // Set up handlers for all existing submenus
    submenus.forEach((submenu, name) => {
      setupSubmenuEvents(submenu, name);
    });
  };
  
  /**
   * Clears all pending timers
   */
  const clearAllTimers = (): void => {
    // Clear hover timers
    hoverTimers.forEach(timerId => window.clearTimeout(timerId));
    hoverTimers.clear();
    
    // Clear close timers
    closeTimers.forEach(timerId => window.clearTimeout(timerId));
    closeTimers.clear();
  };
  
  // Add initial items
  if (config.items?.length) {
    config.items.forEach(itemConfig => {
      addSingleItem(itemConfig);
    });
  }
  
  // Set up initial hover handlers
  setupAllHoverHandlers();
  
  // Set up item click event
  list.addEventListener('click', handleItemClick);
  
  // Create the enhanced component
  const enhancedComponent: BaseComponent = {
    ...component,
    
    // Store the menu factory function setter
    setCreateMenuFunction,
    
    /**
     * Shows the menu
     * Override the show method to close any open submenus first
     */
    show() {
      // Close any open submenus first
      if (activeSubmenu) {
        const expandedItems = list.querySelectorAll('[aria-expanded="true"]');
        expandedItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false');
        });
        activeSubmenu.hide?.();
        activeSubmenu = null;
      }
      
      // Clear all pending timers
      clearAllTimers();
      
      // Ensure hover handlers are set up
      setTimeout(() => {
        setupAllHoverHandlers();
      }, 0);
      
      // Call the original show method
      return originalShow?.call(this) || this;
    },
    
    /**
     * Hides the menu
     * Override the hide method to close any open submenus first
     */
    hide() {
      // Close any open submenus first
      if (activeSubmenu) {
        const expandedItems = list.querySelectorAll('[aria-expanded="true"]');
        expandedItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false');
        });
        activeSubmenu.hide?.();
        activeSubmenu = null;
      }
      
      // Clear all pending timers
      clearAllTimers();
      
      // Reset interaction state
      currentHoveredItem = null;
      
      // Call the original hide method
      return originalHide?.call(this) || this;
    },
    
    /**
     * Closes any open submenus
     * @returns {BaseComponent} Component instance for chaining
     */
    closeSubmenus() {
      if (activeSubmenu) {
        const expandedItems = list.querySelectorAll('[aria-expanded="true"]');
        expandedItems.forEach(item => {
          item.setAttribute('aria-expanded', 'false');
        });
        activeSubmenu.hide?.();
        activeSubmenu = null;
      }
      
      clearAllTimers();
      return this;
    },
    
    /**
     * Adds an item to the menu
     * @param {MenuItemConfig} itemConfig - Item configuration
     * @returns {BaseComponent} Component instance for chaining
     */
    addItem(itemConfig: MenuItemConfig) {
      addSingleItem(itemConfig);
      setupAllHoverHandlers();
      return this;
    },
    
    /**
     * Removes an item from the menu
     * @param {string} name - Item name
     * @returns {BaseComponent} Component instance for chaining
     */
    removeItem(name: string) {
      if (!name) return this;
      
      // Remove from map
      itemsMap.delete(name);
      
      // Remove from DOM
      const item = list.querySelector(`[data-name="${name}"]`);
      if (item) {
        // Remove hover handlers
        item.removeEventListener('mouseenter', handleMouseEnter);
        item.removeEventListener('mouseleave', handleMouseLeave);
        
        // Clear any timers
        if (hoverTimers.has(name)) {
          window.clearTimeout(hoverTimers.get(name)!);
          hoverTimers.delete(name);
        }
        
        if (closeTimers.has(name)) {
          window.clearTimeout(closeTimers.get(name)!);
          closeTimers.delete(name);
        }
        
        // Close any associated submenu
        if (submenus.has(name)) {
          const submenu = submenus.get(name)!;
          submenu.destroy?.();
          submenus.delete(name);
          
          if (activeSubmenu === submenu) {
            activeSubmenu = null;
          }
        }
        
        // Remove the item
        item.remove();
      }
      
      return this;
    },
    
    /**
     * Gets all menu items
     * @returns {Map<string, MenuItemData>} Map of item names to data
     */
    getItems() {
      const result = new Map<string, MenuItemData>();
      
      itemsMap.forEach((config, name) => {
        const element = list.querySelector(`[data-name="${name}"]`) as HTMLElement;
        if (element) {
          result.set(name, { element, config });
        }
      });
      
      return result;
    }
  };
  
  // Add cleanup to lifecycle
  if (component.lifecycle) {
    component.lifecycle.destroy = () => {
      // Remove event listener
      list.removeEventListener('click', handleItemClick);
      
      // Remove hover handlers
      list.querySelectorAll(`.${prefix}-menu-item--submenu`).forEach(item => {
        item.removeEventListener('mouseenter', handleMouseEnter);
        item.removeEventListener('mouseleave', handleMouseLeave);
      });
      
      // Clear all timers
      clearAllTimers();
      
      // Destroy all submenus
      submenus.forEach(submenu => submenu.destroy?.());
      submenus.clear();
      
      // Clear item map
      itemsMap.clear();
      
      // Reset state
      activeSubmenu = null;
      processingClick = false;
      currentHoveredItem = null;
      
      // Call original destroy method if it exists
      if (originalDestroy) {
        originalDestroy();
      }
    };
  }
  
  return enhancedComponent;
};