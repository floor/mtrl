// src/components/navigation/types.ts
import { 
  NAV_VARIANTS, 
  NAV_POSITIONS, 
  NAV_BEHAVIORS 
} from './constants';

/**
 * Navigation item configuration
 */
export interface NavItemConfig {
  /** Unique identifier for the item */
  id: string;
  
  /** HTML content for the icon */
  icon: string;
  
  /** Text label for the item */
  label: string;
  
  /** Optional badge text (notifications, etc.) */
  badge?: string;
  
  /** Whether the item is disabled */
  disabled?: boolean;
  
  /** Whether the item is active */
  active?: boolean;
  
  /** Optional subtitle (for drawer variant) */
  subtitle?: string;
  
  /** ID of the group this item belongs to */
  groupId?: string;
  
  /** Nested navigation items */
  items?: NavItemConfig[];
  
  /** Whether nested items are expanded */
  expanded?: boolean;
}

/**
 * Navigation group configuration
 */
export interface NavGroupConfig {
  /** Unique identifier for the group */
  id: string;
  
  /** Group title text */
  title: string;
  
  /** Whether the group is expanded */
  expanded?: boolean;
}

/**
 * Stored item data
 */
export interface NavItemData {
  /** DOM element for the item */
  element: HTMLElement;
  
  /** Item configuration */
  config: NavItemConfig;
}

/**
 * Navigation change event data
 */
export interface NavChangeEvent {
  /** ID of the active item */
  id: string;
  
  /** Item data */
  item: NavItemData;
  
  /** Previously active item */
  previousItem: NavItemData | null;
  
  /** Path of parent item IDs */
  path: string[];
}

/**
 * Configuration interface for the Navigation component
 */
export interface NavigationConfig {
  /** Navigation variant */
  variant?: keyof typeof NAV_VARIANTS | string;
  
  /** Navigation position */
  position?: keyof typeof NAV_POSITIONS | string;
  
  /** Navigation behavior */
  behavior?: keyof typeof NAV_BEHAVIORS | string;
  
  /** Initial navigation items */
  items?: NavItemConfig[];
  
  /** Navigation groups */
  groups?: NavGroupConfig[];
  
  /** Whether the navigation is disabled */
  disabled?: boolean;
  
  /** Whether drawer is initially expanded */
  expanded?: boolean;
  
  /** Whether to show labels */
  showLabels?: boolean;
  
  /** Whether backdrop scrim is enabled */
  scrimEnabled?: boolean;
  
  /** ARIA label for accessibility */
  ariaLabel?: string;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Prefix for class names */
  prefix?: string;
  
  /** Component name */
  componentName?: string;
}

/**
 * Navigation component interface
 */
export interface NavigationComponent {
  /** The root element of the navigation */
  element: HTMLElement;
  
  /** Map of all navigation items */
  items: Map<string, NavItemData>;
  
  /** Adds a new navigation item */
  addItem: (itemConfig: NavItemConfig) => NavigationComponent;
  
  /** Removes a navigation item by ID */
  removeItem: (id: string) => NavigationComponent;
  
  /** Retrieves a navigation item by ID */
  getItem: (id: string) => NavItemData | undefined;
  
  /** Retrieves all navigation items */
  getAllItems: () => NavItemData[];
  
  /** Gets the currently active item */
  getActive: () => NavItemData | null;
  
  /** Gets the path to an item (parent IDs) */
  getItemPath: (id: string) => string[];
  
  /** Sets an item as active by ID */
  setActive: (id: string) => NavigationComponent;
  
  /** Adds event listener */
  on: (event: string, handler: Function) => NavigationComponent;
  
  /** Removes event listener */
  off: (event: string, handler: Function) => NavigationComponent;
  
  /** Enables the navigation */
  enable: () => NavigationComponent;
  
  /** Disables the navigation */
  disable: () => NavigationComponent;
  
  /** Destroys the navigation component and cleans up resources */
  destroy: () => void;
}

/**
 * API options interface
 */
export interface ApiOptions {
  disabled: {
    enable: () => any;
    disable: () => any;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Base component interface
 */
export interface BaseComponent {
  element: HTMLElement;
  emit?: (event: string, data: any) => void;
  on?: (event: string, handler: Function) => any;
  off?: (event: string, handler: Function) => any;
  addItem?: (itemConfig: NavItemConfig) => any;
  removeItem?: (id: string) => any;
  getItem?: (id: string) => NavItemData | undefined;
  getAllItems?: () => NavItemData[];
  getActive?: () => NavItemData | null;
  getItemPath?: (id: string) => string[];
  setActive?: (id: string) => any;
  disabled?: {
    enable: () => any;
    disable: () => any;
  };
  lifecycle?: {
    destroy: () => void;
  };
  [key: string]: any;
}