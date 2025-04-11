// src/components/menu/types.ts

/**
 * Menu horizontal alignment options
 */
export type MenuAlign = 'left' | 'right' | 'center';

/**
 * Menu vertical alignment options
 */
export type MenuVerticalAlign = 'top' | 'bottom' | 'middle';

/**
 * Menu item types
 */
export type MenuItemType = 'item' | 'divider';

/**
 * Menu position configuration
 */
export interface MenuPositionConfig {
  /** Horizontal alignment */
  align?: MenuAlign;
  
  /** Vertical alignment */
  vAlign?: MenuVerticalAlign;
  
  /** Horizontal offset in pixels */
  offsetX?: number;
  
  /** Vertical offset in pixels */
  offsetY?: number;
}

/**
 * Menu item configuration
 */
export interface MenuItemConfig {
  /** Unique identifier for the item */
  name: string;
  
  /** Text content displayed for the item */
  text: string;
  
  /** Type of menu item */
  type?: MenuItemType;
  
  /** Whether the item is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes to apply to the item */
  class?: string;
  
  /** Submenu items */
  items?: MenuItemConfig[];
}

/**
 * Menu item internal data structure
 */
export interface MenuItemData {
  /** DOM element for the item */
  element: HTMLElement;
  
  /** Item configuration */
  config: MenuItemConfig;
}

/**
 * Menu selection event data
 */
export interface MenuSelectEvent {
  /** Name of the selected item */
  name: string;
  
  /** Text content of the selected item */
  text: string;
  
  /** Path of parent item names (for submenus) */
  path?: string[];
}

/**
 * Menu configuration options
 */
export interface MenuConfig {
  /** Initial menu items */
  items?: MenuItemConfig[];
  
  /** Additional CSS classes */
  class?: string;
  
  /** Whether to keep menu open after selection */
  stayOpenOnSelect?: boolean;
  
  /** Origin element that opens the menu */
  origin?: HTMLElement | { element: HTMLElement };
  
  /** Parent item element (for submenus) */
  parentItem?: HTMLElement;
  
  /** Prefix for class names */
  prefix?: string;
}

/**
 * Menu component interface
 */
export interface MenuComponent {
  /** The root element of the menu */
  element: HTMLElement;
  
  /** Shows the menu */
  show: () => MenuComponent;
  
  /** Hides the menu */
  hide: () => MenuComponent;
  
  /** Checks if the menu is visible */
  isVisible: () => boolean;
  
  /** Positions the menu relative to a target */
  position: (target: HTMLElement, options?: MenuPositionConfig) => MenuComponent;
  
  /** Adds a menu item */
  addItem: (config: MenuItemConfig) => MenuComponent;
  
  /** Removes a menu item by name */
  removeItem: (name: string) => MenuComponent;
  
  /** Gets all menu items */
  getItems: () => Map<string, MenuItemData>;
  
  /** Adds event listener */
  on: (event: string, handler: Function) => MenuComponent;
  
  /** Removes event listener */
  off: (event: string, handler: Function) => MenuComponent;
  
  /** Destroys the menu component and cleans up resources */
  destroy: () => MenuComponent;
}