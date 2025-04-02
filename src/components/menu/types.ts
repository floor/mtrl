// src/components/menu/types.ts

/**
 * Menu horizontal alignment options
 * 
 * Determines how the menu is horizontally aligned relative to its anchor element.
 * 
 * @category Components
 * @example
 * ```typescript
 * // Position menu with right alignment
 * menu.position(buttonElement, { align: 'right' });
 * ```
 */
export type MenuAlign = 'left' | 'right' | 'center';

/**
 * Menu vertical alignment options
 * 
 * Determines how the menu is vertically positioned relative to its anchor element.
 * 
 * @category Components
 * @example
 * ```typescript
 * // Position menu above the anchor element
 * menu.position(buttonElement, { vAlign: 'top' });
 * ```
 */
export type MenuVerticalAlign = 'top' | 'bottom' | 'middle';

/**
 * Menu item types
 * 
 * Defines the different types of items that can be added to a menu.
 * - 'item': Standard selectable menu item (default)
 * - 'divider': Horizontal line separating groups of menu items
 * 
 * @category Components
 * @example
 * ```typescript
 * // Adding a divider between menu items
 * menu.addItem({ type: 'divider' });
 * ```
 */
export type MenuItemType = 'item' | 'divider';

/**
 * Menu events
 * 
 * Events that can be subscribed to for the Menu component.
 * - 'select': Fired when a menu item is selected
 * - 'open': Fired when the menu is shown
 * - 'close': Fired when the menu is hidden
 * - 'submenuOpen': Fired when a submenu is opened
 * - 'submenuClose': Fired when a submenu is closed
 * 
 * @category Components
 * @example
 * ```typescript
 * // Listen for menu open events
 * menu.on('open', () => {
 *   console.log('Menu opened');
 * });
 * 
 * // Listen for item selection
 * menu.on('select', (event) => {
 *   console.log(`Selected item: ${event.name}`);
 * });
 * ```
 */
export type MenuEvent = 'select' | 'open' | 'close' | 'submenuOpen' | 'submenuClose';

/**
 * Menu item configuration
 * 
 * Configuration object for individual menu items.
 * 
 * @category Components
 * @example
 * ```typescript
 * // Basic menu item
 * const basicItem: MenuItemConfig = { 
 *   name: 'edit', 
 *   text: 'Edit Document' 
 * };
 * 
 * // Disabled menu item
 * const disabledItem: MenuItemConfig = { 
 *   name: 'print', 
 *   text: 'Print', 
 *   disabled: true 
 * };
 * 
 * // Menu item with a submenu
 * const itemWithSubmenu: MenuItemConfig = { 
 *   name: 'share', 
 *   text: 'Share', 
 *   items: [
 *     { name: 'email', text: 'Email' },
 *     { name: 'link', text: 'Copy Link' }
 *   ]
 * };
 * 
 * // Divider item
 * const divider: MenuItemConfig = { type: 'divider' };
 * ```
 */
export interface MenuItemConfig {
  /** 
   * Unique identifier for the item
   * Used for identifying the item when handling selection events
   */
  name: string;
  
  /** 
   * Text content displayed for the item
   * This is the visible label shown in the menu
   */
  text: string;
  
  /** 
   * Type of menu item
   * Defaults to 'item' if not specified
   */
  type?: MenuItemType | string;
  
  /** 
   * Whether the item is disabled
   * Disabled items can't be selected and appear visually muted
   */
  disabled?: boolean;
  
  /** 
   * Additional CSS classes to apply to the item
   * Useful for custom styling or visual indicators
   */
  class?: string;
  
  /** 
   * Submenu items
   * Creates a nested menu that appears when this item is hovered
   */
  items?: MenuItemConfig[];
}

/**
 * Menu position configuration
 * 
 * Configures how a menu is positioned relative to an anchor element.
 * This allows for precise control over menu placement in the UI.
 * 
 * @category Components
 * @example
 * ```typescript
 * // Position menu at the bottom-right of the anchor with additional offset
 * menu.position(buttonElement, {
 *   align: 'right',
 *   vAlign: 'bottom',
 *   offsetX: 5,
 *   offsetY: 10
 * });
 * 
 * // Center align menu below the anchor
 * menu.position(buttonElement, {
 *   align: 'center',
 *   vAlign: 'bottom'
 * });
 * ```
 */
export interface MenuPositionConfig {
  /** 
   * Horizontal alignment
   * Controls how the menu aligns horizontally with the anchor element
   * @default 'left'
   */
  align?: MenuAlign | string;
  
  /** 
   * Vertical alignment
   * Controls how the menu aligns vertically with the anchor element
   * @default 'bottom'
   */
  vAlign?: MenuVerticalAlign | string;
  
  /** 
   * Horizontal offset in pixels
   * Additional horizontal offset from the aligned position
   * Positive values move the menu to the right
   * @default 0
   */
  offsetX?: number;
  
  /** 
   * Vertical offset in pixels
   * Additional vertical offset from the aligned position
   * Positive values move the menu downward
   * @default 0
   */
  offsetY?: number;
}

/**
 * Menu position result
 * 
 * Contains the calculated position values for a menu.
 * Used internally by the positioning system.
 * 
 * @category Components
 * @internal
 */
export interface MenuPosition {
  /** 
   * Left position in pixels
   * Absolute position from the left edge of the viewport
   */
  left: number;
  
  /** 
   * Top position in pixels
   * Absolute position from the top edge of the viewport
   */
  top: number;
}

/**
 * Menu item internal data structure
 * 
 * Used internally to track menu item DOM elements and their configurations.
 * This helps with item management and event handling.
 * 
 * @category Components
 * @internal
 */
export interface MenuItemData {
  /** 
   * DOM element for the item
   * Reference to the rendered menu item element
   */
  element: HTMLElement;
  
  /** 
   * Item configuration
   * The configuration that was used to create this item
   */
  config: MenuItemConfig;
}

/**
 * Menu selection event data
 * 
 * Contains information about a selected menu item.
 * This is passed to event handlers when an item is selected.
 * 
 * @category Components
 * @example
 * ```typescript
 * menu.on('select', (event: MenuSelectEvent) => {
 *   console.log(`Selected: ${event.name}`);
 *   console.log(`Text: ${event.text}`);
 *   
 *   // For submenu items, path contains the hierarchy
 *   if (event.path) {
 *     console.log(`From submenu path: ${event.path.join(' > ')}`);
 *   }
 * });
 * ```
 */
export interface MenuSelectEvent {
  /** 
   * Name of the selected item
   * Matches the name property from MenuItemConfig
   */
  name: string;
  
  /** 
   * Text content of the selected item
   * The visible text that was displayed in the menu
   */
  text: string;
  
  /** 
   * Path of parent item names (for submenus)
   * For nested menu selections, contains the names of all parent items
   * from top level to the selected item
   */
  path?: string[];
}

/**
 * Configuration interface for the Menu component
 * 
 * Provides options for creating and configuring a Menu component.
 * 
 * @category Components
 * @example
 * ```typescript
 * // Create a basic menu with initial items
 * const menu = createMenu({
 *   items: [
 *     { name: 'copy', text: 'Copy' },
 *     { name: 'paste', text: 'Paste' },
 *     { type: 'divider' },
 *     { name: 'delete', text: 'Delete' }
 *   ],
 *   stayOpenOnSelect: false,
 *   class: 'custom-menu'
 * });
 * 
 * // Create a submenu
 * const submenu = createMenu({
 *   items: [
 *     { name: 'option1', text: 'Option 1' },
 *     { name: 'option2', text: 'Option 2' }
 *   ],
 *   parentItem: parentElement
 * });
 * ```
 */
export interface MenuConfig {
  /** 
   * Initial menu items
   * Array of item configurations to populate the menu with
   */
  items?: MenuItemConfig[];
  
  /** 
   * Additional CSS classes
   * Custom classes to apply to the menu container element
   */
  class?: string;
  
  /** 
   * Whether to keep menu open after selection
   * When true, selecting an item will not automatically close the menu
   * @default false
   */
  stayOpenOnSelect?: boolean;
  
  /** 
   * Origin element that opens the menu
   * Element used to trigger the menu appearance (like a button)
   */
  origin?: HTMLElement | { element: HTMLElement };
  
  /** 
   * Parent item element (for submenus)
   * For submenus, references the parent menu item this menu belongs to
   */
  parentItem?: HTMLElement;
  
  /** 
   * Prefix for class names
   * Custom prefix for all CSS class names generated by the component
   * @default 'mtrl'
   */
  prefix?: string;
  
  /** 
   * Component name
   * Name identifier used in CSS classes and debugging
   * @default 'menu'
   */
  componentName?: string;
}

/**
 * Menu component interface
 * 
 * Represents a Material Design 3 menu component that provides a temporary
 * surface containing choices that users can interact with.
 * 
 * The menu supports positioning, item management, keyboard navigation,
 * and event handling for user interactions.
 * 
 * This interface is implemented by the object returned from the {@link ../menu!default | createMenu} function.
 * 
 * @category Components
 * @example
 * ```typescript
 * // Create a menu with items
 * const menu = createMenu({
 *   items: [
 *     { name: 'edit', text: 'Edit' },
 *     { name: 'duplicate', text: 'Duplicate' },
 *     { type: 'divider' },
 *     { name: 'delete', text: 'Delete' }
 *   ]
 * });
 * 
 * // Position and show the menu
 * const button = document.getElementById('menuButton');
 * button.addEventListener('click', () => {
 *   menu.position(button).show();
 * });
 * 
 * // Handle selection
 * menu.on('select', (event) => {
 *   console.log(`Selected: ${event.name}`);
 *   if (event.name === 'delete') {
 *     // Handle delete action
 *   }
 * });
 * ```
 * 
 * @see {@link ../menu!default | createMenu} for creating menu instances
 */
export interface MenuComponent {
  /** 
   * The root element of the menu
   * Access to the underlying DOM element for direct manipulation if needed
   */
  element: HTMLElement;
  
  /** 
   * Shows the menu
   * Makes the menu visible in the DOM
   * @returns The menu component for method chaining
   */
  show: () => MenuComponent;
  
  /** 
   * Hides the menu
   * Makes the menu invisible in the DOM
   * @returns The menu component for method chaining
   */
  hide: () => MenuComponent;
  
  /** 
   * Checks if the menu is visible
   * @returns True if the menu is currently visible
   */
  isVisible: () => boolean;
  
  /** 
   * Positions the menu relative to a target
   * Places the menu in relation to a target element with customizable alignment
   * @param target - The element to position the menu against
   * @param options - Configuration for how to align the menu
   * @returns The menu component for method chaining
   */
  position: (target: HTMLElement, options?: MenuPositionConfig) => MenuComponent;
  
  /** 
   * Adds a menu item
   * Dynamically adds a new item to the menu
   * @param config - Configuration for the new menu item
   * @returns The menu component for method chaining
   */
  addItem: (config: MenuItemConfig) => MenuComponent;
  
  /** 
   * Removes a menu item by name
   * Dynamically removes an item from the menu
   * @param name - Name identifier of the item to remove
   * @returns The menu component for method chaining
   */
  removeItem: (name: string) => MenuComponent;
  
  /** 
   * Gets all menu items
   * @returns A Map of all items in the menu, indexed by item name
   */
  getItems: () => Map<string, MenuItemData>;
  
  /** 
   * Adds event listener
   * Subscribes to menu events like 'select', 'open', etc.
   * @param event - The event name to listen for
   * @param handler - Callback function to execute when the event occurs
   * @returns The menu component for method chaining
   */
  on: (event: string, handler: Function) => MenuComponent;
  
  /** 
   * Removes event listener
   * Unsubscribes from menu events
   * @param event - The event name to stop listening for
   * @param handler - The handler function to remove
   * @returns The menu component for method chaining
   */
  off: (event: string, handler: Function) => MenuComponent;
  
  /** 
   * Destroys the menu component and cleans up resources
   * Removes event listeners and DOM elements to prevent memory leaks
   * @returns The menu component for method chaining
   */
  destroy: () => MenuComponent;
}

/**
 * Base component interface
 * 
 * Internal interface representing the base structure for menu components
 * before the public API is applied.
 * 
 * @internal
 * @category Components
 */
export interface BaseComponent {
  /** The root DOM element */
  element: HTMLElement;
  
  /** Method to emit events */
  emit?: (event: string, data: any) => void;
  
  /** Method to subscribe to events */
  on?: (event: string, handler: Function) => any;
  
  /** Method to unsubscribe from events */
  off?: (event: string, handler: Function) => any;
  
  /** Method to show the component */
  show?: () => any;
  
  /** Method to hide the component */
  hide?: () => any;
  
  /** Method to check visibility */
  isVisible?: () => boolean;
  
  /** Method to position relative to target */
  position?: (target: HTMLElement, options?: MenuPositionConfig) => any;
  
  /** Method to add an item */
  addItem?: (config: MenuItemConfig) => any;
  
  /** Method to remove an item */
  removeItem?: (name: string) => any;
  
  /** Method to get all items */
  getItems?: () => Map<string, MenuItemData>;
  
  /** Method to close submenus */
  closeSubmenus?: () => any;
  
  /** Method to refresh hover handlers */
  refreshHoverHandlers?: () => any;
  
  /** Lifecycle methods container */
  lifecycle?: {
    destroy: () => void;
  };
  
  /** Allow for additional properties */
  [key: string]: any;
}

/**
 * API options interface
 * 
 * Internal interface used when applying the API to a component.
 * 
 * @internal
 * @category Components
 */
export interface ApiOptions {
  /** Lifecycle methods to include */
  lifecycle: {
    destroy: () => void;
  };
}