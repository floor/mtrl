// src/components/tabs/types.ts
import { TABS_VARIANTS } from './constants';

/**
 * Tab item configuration
 * @category Components
 */
export interface TabItem {
  /**
   * Unique identifier for the tab
   */
  id: string;
  
  /**
   * Display label for the tab
   */
  label: string;
  
  /**
   * Optional icon HTML content
   */
  icon?: string;
  
  /**
   * Whether the tab is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Additional data to associate with this tab
   */
  data?: any;
}

/**
 * Configuration interface for the Tabs component
 * @category Components
 */
export interface TabsConfig {
  /**
   * Tabs variant that determines visual styling
   * @default 'primary'
   */
  variant?: keyof typeof TABS_VARIANTS | string;
  
  /**
   * Initial tab items
   */
  items?: TabItem[];
  
  /**
   * Index of the initially active tab
   * @default 0
   */
  activeIndex?: number;
  
  /**
   * Whether the tabs component is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether to show tab indicator
   * @default true 
   */
  showIndicator?: boolean;
  
  /**
   * Whether to enable animated transitions
   * @default true
   */
  animated?: boolean;
  
  /**
   * Whether tabs should be scrollable when they overflow
   * @default true
   */
  scrollable?: boolean;
  
  /**
   * Additional CSS classes to add to the tabs component
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
}

/**
 * Tabs component interface
 * @category Components
 */
export interface TabsComponent {
  /** The tabs container DOM element */
  element: HTMLElement;
  
  /** The tabs list DOM element */
  tabsListElement: HTMLElement;
  
  /** The tab indicator DOM element */
  indicatorElement: HTMLElement;
  
  /** API for managing disabled state */
  disabled: {
    /** Enables the tabs component */
    enable: () => void;
    /** Disables the tabs component */
    disable: () => void;
    /** Checks if the tabs component is disabled */
    isDisabled: () => boolean;
  };
  
  /** API for managing component lifecycle */
  lifecycle: {
    /** Destroys the component and cleans up resources */
    destroy: () => void;
  };
  
  /**
   * Gets a class name with the component's prefix
   * @param name - Base class name
   * @returns Prefixed class name
   */
  getClass: (name: string) => string;
  
  /**
   * Enables the tabs component
   * @returns The tabs component for chaining
   */
  enable: () => TabsComponent;
  
  /**
   * Disables the tabs component
   * @returns The tabs component for chaining
   */
  disable: () => TabsComponent;
  
  /**
   * Gets all tab items
   * @returns Array of tab items
   */
  getItems: () => TabItem[];
  
  /**
   * Sets tab items, replacing any existing tabs
   * @param items - Array of tab items
   * @returns The tabs component for chaining
   */
  setItems: (items: TabItem[]) => TabsComponent;
  
  /**
   * Adds a new tab
   * @param item - Tab item configuration
   * @param index - Optional index to insert at (appends if omitted)
   * @returns The tabs component for chaining
   */
  addTab: (item: TabItem, index?: number) => TabsComponent;
  
  /**
   * Removes a tab by ID or index
   * @param idOrIndex - Tab ID or index
   * @returns The tabs component for chaining
   */
  removeTab: (idOrIndex: string | number) => TabsComponent;
  
  /**
   * Gets the currently active tab
   * @returns The active tab item or null if none active
   */
  getActiveTab: () => TabItem | null;
  
  /**
   * Gets the index of the currently active tab
   * @returns The active tab index or -1 if none active
   */
  getActiveIndex: () => number;
  
  /**
   * Sets the active tab by index
   * @param index - Index of the tab to activate
   * @returns The tabs component for chaining
   */
  setActiveTab: (index: number) => TabsComponent;
  
  /**
   * Sets the active tab by ID
   * @param id - ID of the tab to activate
   * @returns The tabs component for chaining
   */
  setActiveTabById: (id: string) => TabsComponent;
  
  /**
   * Destroys the tabs component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Adds an event listener to the tabs component
   * @param event - Event name ('change', 'click', etc.)
   * @param handler - Event handler function
   * @returns The tabs component for chaining
   */
  on: (event: string, handler: Function) => TabsComponent;
  
  /**
   * Removes an event listener from the tabs component
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The tabs component for chaining
   */
  off: (event: string, handler: Function) => TabsComponent;
}

/**
 * Event data for tab change events
 */
export interface TabChangeEventData {
  /**
   * Index of the newly activated tab
   */
  index: number;
  
  /**
   * The newly activated tab item
   */
  tab: TabItem;
  
  /**
   * Index of the previously active tab or -1
   */
  previousIndex: number;
  
  /**
   * The previously active tab item or null
   */
  previousTab: TabItem | null;
}