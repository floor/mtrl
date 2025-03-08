// src/components/tabs/types.ts
import { TABS_VARIANTS, TAB_STATES, TAB_LAYOUT } from './constants';
// Import the BadgeComponent for proper integration
import { BadgeComponent } from '../badge/types';

/**
 * Tab change event data interface
 * @category Events
 */
export interface TabChangeEventData {
  /**
   * The tab component that was activated
   */
  tab: TabComponent;
  
  /**
   * The value of the activated tab
   */
  value: string;
}

/**
 * Configuration interface for a single Tab
 * @category Components
 */
export interface TabConfig {
  /** 
   * Tab state that determines if it's the active destination
   * @default 'inactive'
   */
  state?: keyof typeof TAB_STATES | string;
  
  /** 
   * Whether the tab is initially disabled
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Initial tab text content (label)
   * @example 'Home'
   */
  text?: string;
  
  /** 
   * Initial tab icon HTML content
   * @example '<svg>...</svg>'
   */
  icon?: string;
  
  /** 
   * Badge text or value to display (if applicable)
   * @example '5'
   */
  badge?: string | number;
  
  /**
   * Badge configuration object
   * Pass additional options for the badge component
   */
  badgeConfig?: {
    variant?: string;
    color?: string;
    size?: string;
    position?: string;
    max?: number;
  };
  
  /** 
   * Icon size in pixels or other CSS units
   * @default '24px'
   */
  iconSize?: string;
  
  /** 
   * Additional CSS classes to add to the tab
   * @example 'home-tab main-navigation'
   */
  class?: string;
  
  /** 
   * Tab value attribute for identifying the selected tab
   */
  value?: string;
  
  /** 
   * Whether to enable ripple effect
   * @default true
   */
  ripple?: boolean;

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
   * Ripple effect configuration
   */
  rippleConfig?: {
    /** Duration of the ripple animation in milliseconds */
    duration?: number;
    /** Timing function for the ripple animation */
    timing?: string;
    /** Opacity values for ripple start and end [start, end] */
    opacity?: [string, string];
  };
  
  /**
   * Variant of the tab
   */
  variant?: string;
}

/**
 * Configuration interface for the Tabs component
 * @category Components
 */
export interface TabsConfig {
  /**
   * Tabs variant (primary or secondary)
   * @default 'primary'
   */
  variant?: keyof typeof TABS_VARIANTS | string;
  
  /**
   * Initial tabs to create
   */
  tabs?: TabConfig[];
  
  /**
   * Whether to show the divider
   * @default true
   */
  showDivider?: boolean;
  
  /**
   * Whether to enable horizontal scrolling
   * @default true
   */
  scrollable?: boolean;
  
  /**
   * Additional CSS classes for the container
   */
  class?: string;
  
  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;
  
  /**
   * Event handlers configuration
   */
  on?: {
    /**
     * Tab change event handler
     */
    change?: (event: TabChangeEventData) => void;
    
    /**
     * Event handlers for other events
     */
    [key: string]: Function | undefined;
  };
}

/**
 * Icon API interface for managing tab icons
 * @category Components
 */
export interface IconAPI {
  /**
   * Sets the icon HTML content
   * @param html - HTML string for the icon
   * @returns The icon API for chaining
   */
  setIcon: (html: string) => IconAPI;
  
  /**
   * Gets the current icon HTML content
   * @returns HTML string for the icon
   */
  getIcon: () => string;
  
  /**
   * Gets the icon DOM element
   * @returns The icon element or null if not present
   */
  getElement: () => HTMLElement | null;
}

/**
 * Text API interface for managing tab text
 * @category Components
 */
export interface TextAPI {
  /**
   * Sets the text content
   * @param content - Text content
   * @returns The text API for chaining
   */
  setText: (content: string) => TextAPI;
  
  /**
   * Gets the current text content
   * @returns Tab text content
   */
  getText: () => string;
  
  /**
   * Gets the text DOM element
   * @returns The text element or null if not present
   */
  getElement: () => HTMLElement | null;
}

/**
 * Tab component interface
 * @category Components
 */
export interface TabComponent {
  /** The tab's DOM element */
  element: HTMLElement;
  
  /** API for managing tab text */
  text: TextAPI;
  
  /** API for managing tab icons */
  icon: IconAPI;
  
  /** The tab's badge component */
  badge?: BadgeComponent;
  
  /** API for managing disabled state */
  disabled: {
    /** Enables the tab */
    enable: () => void;
    /** Disables the tab */
    disable: () => void;
    /** Checks if the tab is disabled */
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
   * Gets the tab's value attribute
   * @returns Tab value
   */
  getValue: () => string;
  
  /**
   * Sets the tab's value attribute
   * @param value - New value
   * @returns The tab component for chaining
   */
  setValue: (value: string) => TabComponent;
  
  /**
   * Activates the tab (sets active state)
   * @returns The tab component for chaining
   */
  activate: () => TabComponent;
  
  /**
   * Deactivates the tab (sets inactive state)
   * @returns The tab component for chaining
   */
  deactivate: () => TabComponent;
  
  /**
   * Checks if the tab is active
   * @returns Whether the tab is active
   */
  isActive: () => boolean;
  
  /**
   * Enables the tab (removes disabled attribute)
   * @returns The tab component for chaining
   */
  enable: () => TabComponent;
  
  /**
   * Disables the tab (adds disabled attribute)
   * @returns The tab component for chaining
   */
  disable: () => TabComponent;
  
  /**
   * Sets the tab's text content
   * @param content - Text content
   * @returns The tab component for chaining
   */
  setText: (content: string) => TabComponent;
  
  /**
   * Gets the tab's text content
   * @returns Tab text content
   */
  getText: () => string;
  
  /**
   * Sets the tab's icon
   * @param icon - Icon HTML content
   * @returns The tab component for chaining
   */
  setIcon: (icon: string) => TabComponent;
  
  /**
   * Gets the tab's icon HTML content
   * @returns Icon HTML
   */
  getIcon: () => string;
  
  /**
   * Sets the tab's badge
   * @param content - Badge content
   * @returns The tab component for chaining
   */
  setBadge: (content: string | number) => TabComponent;
  
  /**
   * Gets the tab's badge content
   * @returns Badge content
   */
  getBadge: () => string;
  
  /**
   * Shows the tab's badge
   * @returns The tab component for chaining
   */
  showBadge: () => TabComponent;
  
  /**
   * Hides the tab's badge
   * @returns The tab component for chaining
   */
  hideBadge: () => TabComponent;
  
  /**
   * Gets the badge component instance
   * @returns The badge component or undefined if not created
   */
  getBadgeComponent: () => BadgeComponent | undefined;
  
  /**
   * Destroys the tab component and cleans up resources
   */
  destroy: () => void;
  
  /**
   * Updates the tab's layout style based on content
   * Internal method used when changing content
   */
  updateLayoutStyle: () => void;
  
  /**
   * Adds an event listener to the tab
   * @param event - Event name ('click', 'focus', etc.)
   * @param handler - Event handler function
   * @returns The tab component for chaining
   */
  on: (event: string, handler: Function) => TabComponent;
  
  /**
   * Removes an event listener from the tab
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The tab component for chaining
   */
  off: (event: string, handler: Function) => TabComponent;
}

/**
 * Tabs component interface
 * @category Components
 */
export interface TabsComponent {
  /**
   * Container element
   */
  element: HTMLElement;
  
  /**
   * Creates and adds a new tab to the tabs component
   * @param config - Tab configuration
   * @returns The created tab component
   */
  addTab: (config: TabConfig) => TabComponent;
  
  /**
   * Adds a pre-created tab to the tabs component
   * @param tab - Tab component to add
   * @returns Tabs component for chaining
   */
  add: (tab: TabComponent) => TabsComponent;
  
  /**
   * Gets all tabs in the container
   * @returns Array of tab components
   */
  getTabs: () => TabComponent[];
  
  /**
   * Gets the active tab
   * @returns Active tab or null if none
   */
  getActiveTab: () => TabComponent | null;
  
  /**
   * Sets a tab as active
   * @param tabOrValue - Tab component or tab value
   * @returns Tabs component for chaining
   */
  setActiveTab: (tabOrValue: TabComponent | string) => TabsComponent;
  
  /**
   * Removes a tab from the container
   * @param tabOrValue - Tab component or tab value
   * @returns Tabs component for chaining
   */
  removeTab: (tabOrValue: TabComponent | string) => TabsComponent;
  
  /**
   * Adds an event listener
   * @param event - Event name
   * @param handler - Event handler
   * @returns Tabs component for chaining
   */
  on: (event: string, handler: Function) => TabsComponent;
  
  /**
   * Removes an event listener
   * @param event - Event name
   * @param handler - Event handler
   * @returns Tabs component for chaining
   */
  off: (event: string, handler: Function) => TabsComponent;
  
  /**
   * Emit an event
   * @param event - Event name
   * @param data - Event data
   * @returns Tabs component for chaining
   */
  emit?: (event: string, data: any) => TabsComponent;
  
  /**
   * Destroys the tabs component and all tabs
   */
  destroy: () => void;
}