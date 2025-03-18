// src/components/navigation/types.ts

/**
 * Navigation variants following Material Design 3
 * @category Components
 */
export type NavVariant = 'rail' | 'drawer' | 'bar' | 'modal' | 'standard';

/**
 * Navigation positions
 * @category Components
 */
export type NavPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * Navigation behaviors
 * @category Components
 */
export type NavBehavior = 'fixed' | 'dismissible' | 'modal';

/**
 * Navigation item state
 * @category Components
 */
export type NavItemState = 'active' | 'disabled' | 'expanded' | 'collapsed' | 'hovered' | 'focused' | 'pressed';

/**
 * Navigation element class names
 * Used internally to maintain consistent class names
 * @internal
 */
export const NavClass = {
  ITEM: 'nav-item',
  ITEM_CONTAINER: 'nav-item-container',
  ICON: 'nav-item-icon',
  LABEL: 'nav-item-label',
  BADGE: 'nav-item-badge',
  DIVIDER: 'nav-divider',
  SCRIM: 'nav-scrim',
  GROUP: 'nav-group',
  GROUP_TITLE: 'nav-group-title',
  SUBTITLE: 'nav-subtitle',
  NESTED_CONTAINER: 'nav-nested-container',
  NESTED_ITEM: 'nav-nested-item',
  EXPAND_ICON: 'nav-expand-icon'
} as const;

/**
 * Navigation item configuration
 */
export interface NavItemConfig {
  /** Unique identifier for the item */
  id: string;
  
  /** Icon HTML content */
  icon?: string;
  
  /** Text label */
  label?: string;
  
  /** Badge text */
  badge?: string;
  
  /** Whether the item is disabled */
  disabled?: boolean;
  
  /** Whether the item is active */
  active?: boolean;
  
  /** Whether nested items are expanded */
  expanded?: boolean;
  
  /** Subtitle text (for drawer items) */
  subtitle?: string;
  
  /** Group ID this item belongs to */
  groupId?: string;
  
  /** Nested navigation items */
  items?: NavItemConfig[];
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
 * Navigation item data
 */
export interface NavItemData {
  /** The item's DOM element */
  element: HTMLElement;
  
  /** Item configuration */
  config: NavItemConfig;
}

/**
 * Navigation change event data
 */
export interface NavChangeEvent {
  /** ID of the selected item */
  id: string;
  
  /** Selected item data */
  item: NavItemData;
  
  /** Previously selected item data */
  previousItem?: NavItemData | null;
  
  /** Path of parent item IDs */
  path: string[];
}

/**
 * Configuration interface for the Navigation component
 */
export interface NavigationConfig {
  /** Navigation variant */
  variant?: NavVariant | string;
  
  /** Navigation position */
  position?: NavPosition | string;
  
  /** Navigation behavior */
  behavior?: NavBehavior | string;
  
  /** Navigation items */
  items?: NavItemConfig[];
  
  /** Navigation groups */
  groups?: NavGroupConfig[];
  
  /** Whether the navigation is disabled */
  disabled?: boolean;
  
  /** Whether the navigation is expanded (for drawer) */
  expanded?: boolean;
  
  /** Whether to show item labels */
  showLabels?: boolean;
  
  /** Whether to enable background scrim (for modal drawer) */
  scrimEnabled?: boolean;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Accessibility label */
  ariaLabel?: string;
  
  /** Component prefix for class names */
  prefix?: string;
  
  /** Component name */
  componentName?: string;
}

/**
 * Navigation component interface
 */
export interface NavigationComponent {
  /** The navigation's DOM element */
  element: HTMLElement;
  
  /** Map of navigation items */
  items: Map<string, NavItemData>;
  
  /** Adds a navigation item */
  addItem: (config: NavItemConfig) => NavigationComponent;
  
  /** Removes a navigation item */
  removeItem: (id: string) => NavigationComponent;
  
  /** Gets a navigation item by ID */
  getItem: (id: string) => NavItemData | undefined;
  
  /** Gets all navigation items */
  getAllItems: () => NavItemData[];
  
  /** Gets the active navigation item */
  getActive: () => NavItemData | null;
  
  /** Gets the path to an item (parent IDs) */
  getItemPath: (id: string) => string[];
  
  /** Sets the active navigation item */
  setActive: (id: string) => NavigationComponent;
  
  /** Enables the navigation */
  enable: () => NavigationComponent;
  
  /** Disables the navigation */
  disable: () => NavigationComponent;
  
  /** Expands the navigation (for drawer) */
  expand: () => NavigationComponent;
  
  /** Collapses the navigation (for drawer) */
  collapse: () => NavigationComponent;
  
  /** Checks if the navigation is expanded */
  isExpanded: () => boolean;
  
  /** Toggles the navigation expansion state */
  toggle: () => NavigationComponent;
  
  /** Adds an event listener */
  on: (event: string, handler: Function) => NavigationComponent;
  
  /** Removes an event listener */
  off: (event: string, handler: Function) => NavigationComponent;
  
  /** Destroys the navigation component */
  destroy: () => void;
}

/**
 * Base component interface
 */
export interface BaseComponent {
  element: HTMLElement;
  prefix?: string;
  items?: Map<string, NavItemData>;
  emit?: (event: string, data: any) => void;
  on?: (event: string, handler: Function) => any;
  off?: (event: string, handler: Function) => any;
  lifecycle?: {
    destroy: () => void;
  };
  disabled?: {
    enable: () => any;
    disable: () => any;
  };
  [key: string]: any;
}

/**
 * API options interface
 */
export interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}