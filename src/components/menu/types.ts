// src/components/menu/types.ts

/**
 * Menu alignment options
 * @category Components
 */
export type MenuAlign = 'left' | 'right' | 'center';

/**
 * Menu vertical alignment options
 * @category Components
 */
export type MenuVerticalAlign = 'top' | 'bottom' | 'middle';

/**
 * Menu item types
 * @category Components
 */
export type MenuItemType = 'item' | 'divider';

/**
 * Menu events
 * @category Components
 */
export type MenuEvent = 'select' | 'open' | 'close' | 'submenuOpen' | 'submenuClose';

/**
 * Menu item configuration
 */
export interface MenuItemConfig {
  /** Unique identifier for the item */
  name: string;
  
  /** Text content for the item */
  text: string;
  
  /** Type of menu item */
  type?: MenuItemType | string;
  
  /** Whether the item is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Submenu items */
  items?: MenuItemConfig[];
}

/**
 * Position configuration
 */
export interface MenuPositionConfig {
  /** Horizontal alignment */
  align?: MenuAlign | string;
  
  /** Vertical alignment */
  vAlign?: MenuVerticalAlign | string;
  
  /** Horizontal offset in pixels */
  offsetX?: number;
  
  /** Vertical offset in pixels */
  offsetY?: number;
}

/**
 * Position result
 */
export interface MenuPosition {
  /** Left position in pixels */
  left: number;
  
  /** Top position in pixels */
  top: number;
}

/**
 * Stored item data
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
 * Configuration interface for the Menu component
 */
export interface MenuConfig {
  /** Initial menu items */
  items?: MenuItemConfig[];
  
  /** Additional CSS classes */
  class?: string;
  
  /** Whether to keep menu open after selection */
  stayOpenOnSelect?: boolean;
  
  /** Button element that opens the menu */
  openingButton?: HTMLElement | { element: HTMLElement };
  
  /** Parent item element (for submenus) */
  parentItem?: HTMLElement;
  
  /** Prefix for class names */
  prefix?: string;
  
  /** Component name */
  componentName?: string;
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

/**
 * Base component interface
 */
export interface BaseComponent {
  element: HTMLElement;
  emit?: (event: string, data: any) => void;
  on?: (event: string, handler: Function) => any;
  off?: (event: string, handler: Function) => any;
  show?: () => any;
  hide?: () => any;
  isVisible?: () => boolean;
  position?: (target: HTMLElement, options?: MenuPositionConfig) => any;
  addItem?: (config: MenuItemConfig) => any;
  removeItem?: (name: string) => any;
  getItems?: () => Map<string, MenuItemData>;
  closeSubmenus?: () => any;
  refreshHoverHandlers?: () => any;
  lifecycle?: {
    destroy: () => void;
  };
  [key: string]: any;
}

/**
 * API options interface
 */
export interface ApiOptions {
  lifecycle: {
    destroy: () => void;
  };
}