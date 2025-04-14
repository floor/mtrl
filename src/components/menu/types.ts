// src/components/menu/types.ts

/**
 * Menu position options
 * Controls where the menu will appear relative to its anchor element
 * 
 * @category Components
 */
export const MENU_POSITION = {
  /** Places menu below the anchor, aligned to left edge */
  BOTTOM_START: 'bottom-start',
  /** Places menu below the anchor, centered */
  BOTTOM: 'bottom',
  /** Places menu below the anchor, aligned to right edge */
  BOTTOM_END: 'bottom-end',
  /** Places menu above the anchor, aligned to left edge */
  TOP_START: 'top-start',
  /** Places menu above the anchor, centered */
  TOP: 'top',
  /** Places menu above the anchor, aligned to right edge */
  TOP_END: 'top-end',
  /** Places menu to the right of the anchor, aligned to top edge */
  RIGHT_START: 'right-start',
  /** Places menu to the right of the anchor, centered */
  RIGHT: 'right',
  /** Places menu to the right of the anchor, aligned to bottom edge */
  RIGHT_END: 'right-end',
  /** Places menu to the left of the anchor, aligned to top edge */
  LEFT_START: 'left-start',
  /** Places menu to the left of the anchor, centered */
  LEFT: 'left',
  /** Places menu to the left of the anchor, aligned to bottom edge */
  LEFT_END: 'left-end'
} as const;

/**
 * Position options for the menu
 * 
 * @category Components
 */
export type MenuPosition = typeof MENU_POSITION[keyof typeof MENU_POSITION];

/**
 * Configuration interface for a menu item
 * 
 * @category Components
 */
export interface MenuItem {
  /** 
   * Unique ID for the menu item
   * Required for accessibility and event handling
   */
  id: string;
  
  /**
   * Display text for the menu item
   */
  text: string;
  
  /**
   * Optional icon to display before the text
   * Accepts HTML string (typically SVG)
   */
  icon?: string;
  
  /**
   * Optional keyboard shortcut hint to display
   * Shown at the end of the menu item
   */
  shortcut?: string;
  
  /**
   * Whether the menu item is disabled
   * Disabled items cannot be clicked but remain visible
   */
  disabled?: boolean;
  
  /**
   * Whether this item has a submenu
   * If true, the item will show an indicator and can open a nested menu
   */
  hasSubmenu?: boolean;
  
  /**
   * Optional array of submenu items
   * Only used when hasSubmenu is true
   */
  submenu?: MenuItem[];
  
  /**
   * Additional data to associate with the menu item
   * This can be used for custom behavior in click handlers
   */
  data?: any;
}

/**
 * Menu item type for dividers
 * 
 * @category Components
 */
export interface MenuDivider {
  /**
   * Type must be 'divider' to differentiate from regular menu items
   */
  type: 'divider';
  
  /**
   * Optional ID for the divider (for accessibility)
   */
  id?: string;
}

/**
 * Combined type for menu content items (regular items or dividers)
 * 
 * @category Components
 */
export type MenuContent = MenuItem | MenuDivider;

/**
 * Configuration interface for the Menu component
 * 
 * @category Components
 */
export interface MenuConfig {
  /**
   * Element to which the menu will be anchored
   * Can be an HTML element, a CSS selector string, or a component with an element property
   */
  anchor: HTMLElement | string | { element: HTMLElement };
  
  /**
   * Array of menu items and dividers to display
   */
  items: MenuContent[];
  
  /**
   * Position of the menu relative to the anchor
   * @default 'bottom-start'
   */
  position?: MenuPosition;
  
  /**
   * Whether the menu should close when an item is clicked
   * @default true
   */
  closeOnSelect?: boolean;
  
  /**
   * Whether the menu should close when the user clicks outside
   * @default true
   */
  closeOnClickOutside?: boolean;
  
  /**
   * Whether the menu should close when the escape key is pressed
   * @default true
   */
  closeOnEscape?: boolean;
  
  /**
   * Whether submenus should open on hover
   * @default true
   */
  openSubmenuOnHover?: boolean;
  
  /**
   * Optional width for the menu (in CSS units)
   * If not provided, menu will size to its content
   */
  width?: string;
  
  /**
   * Optional maximum height for the menu (in CSS units)
   * If content exceeds this height, the menu will scroll
   */
  maxHeight?: string;
  
  /**
   * Optional offset from the anchor (in pixels)
   * @default 8
   */
  offset?: number;
  
  /**
   * Whether the menu should automatically flip position to stay in viewport
   * @default true
   */
  autoFlip?: boolean;
  
  /**
   * Whether the menu is initially visible
   * @default false
   */
  visible?: boolean;
  
  /**
   * Additional CSS classes to add to the menu
   */
  class?: string;
  
  /**
   * Component prefix for CSS class names
   * @default 'mtrl'
   */
  prefix?: string;
  
  /**
   * Component name used in CSS class generation
   * @default 'menu'
   */
  componentName?: string;
  
  /**
   * Event handlers for the menu
   */
  on?: {
    /**
     * Called when the menu is opened
     */
    open?: (event: MenuEvent) => void;
    
    /**
     * Called when the menu is closed
     */
    close?: (event: MenuEvent) => void;
    
    /**
     * Called when a menu item is selected
     */
    select?: (event: MenuSelectEvent) => void;
  };
}

/**
 * Menu event interface
 * 
 * @category Components
 */
export interface MenuEvent {
  /** The menu component that triggered the event */
  menu: MenuComponent;
  
  /** Original DOM event if available */
  originalEvent?: Event;
  
  /** Function to prevent default behavior */
  preventDefault: () => void;
  
  /** Whether default behavior was prevented */
  defaultPrevented: boolean;
}

/**
 * Menu selection event interface
 * 
 * @category Components
 */
export interface MenuSelectEvent extends MenuEvent {
  /** The selected menu item */
  item: MenuItem;
  
  /** ID of the selected menu item */
  itemId: string;
  
  /** Data associated with the menu item (if any) */
  itemData?: any;
}

/**
 * Menu component interface
 * 
 * @category Components
 */
export interface MenuComponent {
  /** The menu's root DOM element */
  element: HTMLElement;
  
  /**
   * Opens the menu
   * @param event - Optional event that triggered the open
   * @param interactionType - The type of interaction that triggered the open ('mouse' or 'keyboard')
   * @returns The menu component for chaining
   */
  open: (event?: Event, interactionType?: 'mouse' | 'keyboard') => MenuComponent;
  
  /**
   * Closes the menu
   * @param event - Optional event that triggered the close
   * @returns The menu component for chaining
   */
  close: (event?: Event) => MenuComponent;
  
  /**
   * Toggles the menu's open state
   * @param event - Optional event that triggered the toggle
   * @returns The menu component for chaining
   */
  toggle: (event?: Event) => MenuComponent;
  
  /**
   * Checks if the menu is currently open
   * @returns True if the menu is open
   */
  isOpen: () => boolean;
  
  /**
   * Updates the menu items
   * @param items - New array of menu items and dividers
   * @returns The menu component for chaining
   */
  setItems: (items: MenuContent[]) => MenuComponent;
  
  /**
   * Gets the current menu items
   * @returns Array of current menu items and dividers
   */
  getItems: () => MenuContent[];
  
  /**
   * Updates the menu's anchor element
   * @param anchor - New anchor element or selector
   * @returns The menu component for chaining
   */
  setAnchor: (anchor: HTMLElement | string) => MenuComponent;
  
  /**
   * Gets the current anchor element
   * @returns Current anchor element
   */
  getAnchor: () => HTMLElement;
  
  /**
   * Updates the menu's position
   * @param position - New position value
   * @returns The menu component for chaining
   */
  setPosition: (position: MenuPosition) => MenuComponent;
  
  /**
   * Gets the current menu position
   * @returns Current position
   */
  getPosition: () => MenuPosition;
  
  /**
   * Adds an event listener to the menu
   * @param event - Event name ('open', 'close', 'select')
   * @param handler - Event handler function
   * @returns The menu component for chaining
   */
  on: <T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]) => MenuComponent;
  
  /**
   * Removes an event listener from the menu
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The menu component for chaining
   */
  off: <T extends keyof MenuEvents>(event: T, handler: MenuEvents[T]) => MenuComponent;
  
  /**
   * Destroys the menu component and cleans up resources
   */
  destroy: () => void;
}

/**
 * Menu events interface for type-checking
 * 
 * @category Components
 * @internal
 */
export interface MenuEvents {
  'open': (event: MenuEvent) => void;
  'close': (event: MenuEvent) => void;
  'select': (event: MenuSelectEvent) => void;
}