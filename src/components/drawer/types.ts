// src/components/drawer/types.ts

import { BaseComponentConfig } from "../../core/config/component";

/**
 * Drawer variant type — controls layout behavior
 * @category Components
 * @remarks
 * - standard: Inline drawer, can be permanently visible or toggled. Best for expanded+ window sizes.
 * - modal: Overlay drawer with scrim. Best for compact/medium window sizes.
 */
export type DrawerVariant = "standard" | "modal";

/**
 * Drawer position — which edge the drawer anchors to
 * @category Components
 */
export type DrawerPosition = "start" | "end";

/**
 * Configuration for a navigation destination item
 * @category Components
 */
export interface DrawerItemConfig {
  /** Item type — defaults to 'item' if omitted */
  type?: "item" | "divider" | "section";

  /** Unique identifier for the item */
  id?: string;

  /** Destination label text */
  label?: string;

  /** Icon HTML content (placed before label) */
  icon?: string;

  /** Badge text (e.g. unread count) */
  badge?: string;

  /** Whether this item is initially active/selected */
  active?: boolean;

  /** Section label text (only when type is 'section') */
  sectionLabel?: string;

  /** Whether the item is disabled */
  disabled?: boolean;
}

/**
 * Event detail emitted when a drawer item is selected
 * @category Components
 */
export interface DrawerSelectEvent {
  /** The selected item's id */
  id: string;
  /** The selected item's label */
  label: string;
  /** The selected item's index within navigation items (excludes dividers/sections) */
  index: number;
  /** The underlying DOM event */
  originalEvent: Event;
}

/**
 * Configuration interface for the Drawer component
 * @category Components
 */
export interface DrawerConfig extends BaseComponentConfig {
  /**
   * Drawer variant that determines layout behavior
   * @default 'standard'
   */
  variant?: DrawerVariant | string;

  /**
   * Drawer anchor position
   * @default 'start'
   */
  position?: DrawerPosition | string;

  /**
   * Whether the drawer is initially open
   * @default false
   */
  open?: boolean;

  /**
   * Whether the modal drawer can be dismissed by clicking the scrim
   * @default true
   */
  dismissible?: boolean;

  /**
   * Optional headline text displayed at the top of the drawer
   * @example 'Mail'
   */
  headline?: string;

  /**
   * Navigation items configuration array.
   * Supports destination items, dividers, and section labels.
   * @example
   * [
   *   { id: 'inbox', label: 'Inbox', icon: '<svg>...</svg>', badge: '24', active: true },
   *   { type: 'divider' },
   *   { type: 'section', label: 'Labels' },
   *   { id: 'family', label: 'Family', icon: '<svg>...</svg>' },
   * ]
   */
  items?: DrawerItemConfig[];

  /**
   * Drawer width as a CSS value
   * @default '360px'
   */
  width?: string | number;

  /**
   * When true, renders a compact drawer with smaller items and tighter spacing.
   * Useful in dense UIs like admin panels where the standard 56px item height
   * is too large.
   * @default false
   */
  dense?: boolean;

  /**
   * Additional CSS classes to add to the drawer
   */
  class?: string;

  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;

  /**
   * Component name used in class generation
   */
  componentName?: string;

  /**
   * Callback when a navigation item is selected
   */
  onSelect?: (event: DrawerSelectEvent) => void;

  /**
   * Callback when the drawer opens
   */
  onOpen?: () => void;

  /**
   * Callback when the drawer closes
   */
  onClose?: () => void;
}

/**
 * Drawer component interface — public API
 * @category Components
 */
export interface DrawerComponent {
  /** The drawer's root DOM element */
  element: HTMLElement;

  /**
   * Gets a class name with the component's prefix
   * @param name - Base class name
   * @returns Prefixed class name
   */
  getClass: (name: string) => string;

  /**
   * Opens the drawer
   * @returns The drawer component for chaining
   */
  open: () => DrawerComponent;

  /**
   * Closes the drawer
   * @returns The drawer component for chaining
   */
  close: () => DrawerComponent;

  /**
   * Toggles the drawer open/closed state
   * @returns The drawer component for chaining
   */
  toggle: () => DrawerComponent;

  /**
   * Checks if the drawer is currently open
   * @returns True if the drawer is open
   */
  isOpen: () => boolean;

  /**
   * Sets the active navigation item by id
   * @param id - Item id to activate
   * @returns The drawer component for chaining
   */
  setActive: (id: string) => DrawerComponent;

  /**
   * Gets the currently active item id
   * @returns Active item id or null
   */
  getActive: () => string | null;

  /**
   * Sets the headline text
   * @param text - Headline text
   * @returns The drawer component for chaining
   */
  setHeadline: (text: string) => DrawerComponent;

  /**
   * Gets the headline text
   * @returns Headline text
   */
  getHeadline: () => string;

  /**
   * Sets the navigation items
   * @param items - Array of item configurations
   * @returns The drawer component for chaining
   */
  setItems: (items: DrawerItemConfig[]) => DrawerComponent;

  /**
   * Gets the current items configuration
   * @returns Array of item configurations
   */
  getItems: () => DrawerItemConfig[];

  /**
   * Sets a badge on a specific item
   * @param id - Item id
   * @param badge - Badge text or empty string to remove
   * @returns The drawer component for chaining
   */
  setBadge: (id: string, badge: string) => DrawerComponent;

  /**
   * Adds an event listener
   * @param event - Event name ('select', 'open', 'close')
   * @param handler - Event handler function
   * @returns The drawer component for chaining
   */
  on: (event: string, handler: Function) => DrawerComponent;

  /**
   * Removes an event listener
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The drawer component for chaining
   */
  off: (event: string, handler: Function) => DrawerComponent;

  /**
   * Adds CSS classes to the drawer element
   * @param classes - One or more class names to add
   * @returns The drawer component for chaining
   */
  addClass: (...classes: string[]) => DrawerComponent;

  /**
   * Destroys the drawer component and cleans up resources
   */
  destroy: () => void;

  /** API for managing component lifecycle */
  lifecycle: {
    /** Destroys the component and cleans up resources */
    destroy: () => void;
  };
}
