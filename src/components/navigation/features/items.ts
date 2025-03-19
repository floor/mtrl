// src/components/navigation/features/items.ts
import { createNavItem, getAllNestedItems } from '../nav-item';
import { NavItemConfig, NavItemData, BaseComponent, NavClass } from '../types';

/**
 * Interface for a component with items management capabilities
 * @internal
 */
interface ItemsComponent extends BaseComponent {
  items: Map<string, NavItemData>;
  addItem: (config: NavItemConfig) => ItemsComponent;
  removeItem: (id: string) => ItemsComponent;
  getItem: (id: string) => NavItemData | undefined;
  getAllItems: () => NavItemData[];
  getActive: () => NavItemData | null;
  getItemPath: (id: string) => string[];
  setActive: (id: string) => ItemsComponent;
}

/**
 * Interface for navigation configuration
 * @internal
 */
interface NavigationConfig {
  prefix?: string;
  items?: NavItemConfig[];
  [key: string]: any;
}

/**
 * Helper to get element ID or component type
 * @internal
 */
function getElementId(element: HTMLElement | null, prefix: string): string | null {
  if (!element) return null;
  
  // Try to get data-id
  const id = element.getAttribute('data-id');
  if (id) return id;
  
  // Try to identify by component class
  if (element.classList.contains(`${prefix}-nav--rail`)) return 'rail';
  if (element.classList.contains(`${prefix}-nav--drawer`)) return 'drawer';
  
  return null;
}

/**
 * Adds navigation items management to a component
 * @param {NavigationConfig} config - Navigation configuration
 * @returns {Function} Component enhancer function
 */
export const withNavItems = (config: NavigationConfig) => (component: BaseComponent): ItemsComponent => {
  const items = new Map<string, NavItemData>();
  let activeItem: NavItemData | null = null;
  const prefix = config.prefix || 'mtrl';

  /**
   * Recursively stores items in the items Map
   * @param {NavItemConfig} itemConfig - Item configuration
   * @param {HTMLElement} item - Created item element
   */
  const storeItem = (itemConfig: NavItemConfig, item: HTMLElement): void => {
    items.set(itemConfig.id, { element: item, config: itemConfig });

    if (itemConfig.items?.length) {
      itemConfig.items.forEach(nestedConfig => {
        const container = item.closest(`.${prefix}-${NavClass.ITEM_CONTAINER}`);
        if (container) {
          const nestedContainer = container.querySelector(`.${prefix}-${NavClass.NESTED_CONTAINER}`);
          if (nestedContainer) {
            const nestedItem = nestedContainer.querySelector(`[data-id="${nestedConfig.id}"]`) as HTMLElement;
            if (nestedItem) {
              storeItem(nestedConfig, nestedItem);
            }
          }
        }
      });
    }
  };

  /**
   * Updates the active state for an item
   * @param {HTMLElement} item - Item element to activate
   * @param {NavItemData} itemData - Item data
   * @param {boolean} active - Whether to make active or inactive
   */
  const updateActiveState = (item: HTMLElement, itemData: NavItemData, active: boolean): void => {
    // Determine the correct active attribute based on role
    const role = item.getAttribute('role');
    
    if (active) {
      item.classList.add(`${prefix}-${NavClass.ITEM}--active`);
      
      // Set appropriate attribute based on role
      if (role === 'tab') {
        item.setAttribute('aria-selected', 'true');
        item.setAttribute('tabindex', '0');
      } else if (!item.getAttribute('aria-haspopup')) {
        // Use aria-current for navigation items that aren't expandable
        item.setAttribute('aria-current', 'page');
      }
    } else {
      item.classList.remove(`${prefix}-${NavClass.ITEM}--active`);
      
      // Remove appropriate attribute based on role
      if (role === 'tab') {
        item.setAttribute('aria-selected', 'false');
        item.setAttribute('tabindex', '-1');
      } else if (item.hasAttribute('aria-current')) {
        item.removeAttribute('aria-current');
      }
    }
  };

  // Create initial items
  if (config.items) {
    config.items.forEach(itemConfig => {
      const item = createNavItem(itemConfig, component.element, prefix);
      storeItem(itemConfig, item);

      if (itemConfig.active) {
        activeItem = { element: item, config: itemConfig };
        updateActiveState(item, activeItem, true);
      }
    });
  }

  // EXTENSION: Add mouse event handling
  if (component.emit) {
    // Mouse over event
    component.element.addEventListener('mouseover', (event: MouseEvent) => {
      // Find the closest item with data-id
      const target = event.target as HTMLElement;
      const item = target.closest(`[data-id]`) as HTMLElement;
      
      if (item) {
        const id = item.dataset.id;
        if (id) {
          // Emit mouseover event with necessary data
          component.emit('mouseover', {
            id,
            clientX: event.clientX,
            clientY: event.clientY,
            target: item,
            item: items.get(id)
          });
        }
      }
    });

    // Mouse enter event
    component.element.addEventListener('mouseenter', (event: MouseEvent) => {
      component.emit('mouseenter', {
        clientX: event.clientX,
        clientY: event.clientY,
        id: component.element.dataset.id || component.componentName || 'nav'
      });
    });

    // Mouse leave event
    component.element.addEventListener('mouseleave', (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget as HTMLElement;
      const relatedTargetId = getElementId(relatedTarget, prefix);
      
      component.emit('mouseleave', {
        clientX: event.clientX,
        clientY: event.clientY,
        relatedTargetId,
        id: component.element.dataset.id || component.componentName || 'nav'
      });
    });
  }

  // Handle item clicks
  component.element.addEventListener('click', (event: Event) => {
    const item = (event.target as HTMLElement).closest(`.${prefix}-${NavClass.ITEM}`) as HTMLElement;
    if (!item || (item as any).disabled || item.getAttribute('aria-haspopup') === 'menu') return;

    const id = item.dataset.id;
    if (!id) return;
    
    const itemData = items.get(id);
    if (!itemData) return;

    // Skip if this is an expandable item
    if (item.getAttribute('aria-expanded') !== null) return;

    // Store previous item before updating
    const previousItem = activeItem;

    // Update active state
    if (activeItem) {
      updateActiveState(activeItem.element, activeItem, false);
    }

    updateActiveState(item, itemData, true);
    activeItem = itemData;

    // Emit change event with item data
    if (component.emit) {
      component.emit('change', {
        id,
        item: itemData,
        previousItem,
        path: getItemPath(id)
      });
    }
  });

  /**
   * Gets the path to an item (parent IDs)
   * @param {string} id - Item ID to get path for
   * @returns {Array<string>} Array of parent item IDs
   */
  const getItemPath = (id: string): string[] => {
    const path: string[] = [];
    let currentItem = items.get(id);

    if (!currentItem) return path;

    let parentContainer = currentItem.element.closest(`.${prefix}-${NavClass.NESTED_CONTAINER}`);
    while (parentContainer) {
      const parentItemContainer = parentContainer.parentElement;
      if (!parentItemContainer) break;

      const parentItem = parentItemContainer.querySelector(`.${prefix}-${NavClass.ITEM}`);
      if (!parentItem) break;

      const parentId = parentItem.getAttribute('data-id');
      if (!parentId) break;

      path.unshift(parentId);
      
      // Move up to next level
      parentContainer = parentItemContainer.closest(`.${prefix}-${NavClass.NESTED_CONTAINER}`);
    }

    return path;
  };

  // Clean up when component is destroyed
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy;
    component.lifecycle.destroy = () => {
      items.clear();
      if (originalDestroy) {
        originalDestroy();
      }
    };
  }

  return {
    ...component,
    items,

    addItem(itemConfig: NavItemConfig) {
      if (items.has(itemConfig.id)) return this;

      const item = createNavItem(itemConfig, component.element, prefix);
      storeItem(itemConfig, item);

      if (itemConfig.active) {
        this.setActive(itemConfig.id);
      }

      if (component.emit) {
        component.emit('itemAdded', {
          id: itemConfig.id,
          item: { element: item, config: itemConfig }
        });
      }
      return this;
    },

    removeItem(id: string) {
      const item = items.get(id);
      if (!item) return this;

      // Remove all nested items first
      const nestedItems = getAllNestedItems(item.element, prefix);
      nestedItems.forEach(nestedItem => {
        const nestedId = nestedItem.dataset.id;
        if (nestedId) items.delete(nestedId);
      });

      if (activeItem?.config.id === id) {
        activeItem = null;
      }

      // Remove the entire item container
      const container = item.element.closest(`.${prefix}-${NavClass.ITEM_CONTAINER}`);
      if (container) {
        container.remove();
      }
      items.delete(id);

      if (component.emit) {
        component.emit('itemRemoved', { id, item });
      }
      return this;
    },

    getItem: (id: string) => items.get(id),
    getAllItems: () => Array.from(items.values()),
    getActive: () => activeItem,
    getItemPath: (id: string) => getItemPath(id),

    setActive(id: string) {
      const item = items.get(id);
      if (!item || item.config.disabled) return this;

      if (activeItem) {
        updateActiveState(activeItem.element, activeItem, false);
      }

      updateActiveState(item.element, item, true);
      activeItem = item;

      // Ensure all parent items are expanded
      const path = getItemPath(id);
      path.forEach(parentId => {
        const parentItem = items.get(parentId);
        if (parentItem) {
          const parentButton = parentItem.element;
          const container = parentButton.closest(`.${prefix}-${NavClass.ITEM_CONTAINER}`);
          if (container) {
            const nestedContainer = container.querySelector(`.${prefix}-${NavClass.NESTED_CONTAINER}`);
            if (nestedContainer) {
              parentButton.setAttribute('aria-expanded', 'true');
              nestedContainer.hidden = false;
            }
          }
        }
      });

      if (component.emit) {
        component.emit('activeChanged', {
          id,
          item,
          previousItem: activeItem,
          path: getItemPath(id)
        });
      }
      return this;
    }
  };
};