// src/components/tabs/types.ts
import type { BadgeComponent } from '../badge';
import { TabIndicator } from './indicator';

/**
 * Available tabs variants
 */
export type TabsVariant = 'primary' | 'secondary';

/**
 * Available tabs states
 */

export type TabStates = 'active' | 'inactive' | 'disabled';

/**
 * Configuration for the tab indicator
 * @category Components
 */
export interface IndicatorConfig {
  /** Height of the indicator in pixels */
  height?: number;
  /** 
   * Width strategy for the indicator
   * - 'fixed': Uses a fixed width defined by fixedWidth
   * - 'dynamic': Uses half the tab width
   * - 'content': Uses the text content width
   * - 'auto': Adapts based on variant (primary: text width, secondary: full tab width)
   */
  widthStrategy?: 'fixed' | 'dynamic' | 'content' | 'auto';
  /** Fixed width in pixels (when using fixed strategy) */
  fixedWidth?: number;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Animation timing function */
  animationTiming?: string;
  /** Custom color for the indicator */
  color?: string;
  /** Tab variant (primary or secondary) */
  variant?: string;
}

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
  state?: TabStates | string;
  
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
  variant?: TabsVariant | string;
  
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
  
  /**
   * Tab indicator configuration
   */
  indicator?: IndicatorConfig;
  
  /**
   * Tab indicator height in pixels
   * @deprecated Use indicator.height instead
   */
  indicatorHeight?: number;
  
  /**
   * Tab indicator width strategy
   * @deprecated Use indicator.widthStrategy instead
   */
  indicatorWidthStrategy?: 'fixed' | 'dynamic' | 'content';
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
  
  /** The tab's badge component (if any) */
  badge?: BadgeComponent;
  
  /** Gets a class name with the component's prefix */
  getClass: (name: string) => string;
  
  /** Gets the tab's value attribute */
  getValue: () => string;
  
  /** Sets the tab's value attribute */
  setValue: (value: string) => TabComponent;
  
  /** Activates the tab (sets active state) */
  activate: () => TabComponent;
  
  /** Deactivates the tab (sets inactive state) */
  deactivate: () => TabComponent;
  
  /** Checks if the tab is active */
  isActive: () => boolean;
  
  /** Enables the tab (removes disabled attribute) */
  enable: () => TabComponent;
  
  /** Disables the tab (adds disabled attribute) */
  disable: () => TabComponent;
  
  /** Sets the tab's text content */
  setText: (content: string) => TabComponent;
  
  /** Gets the tab's text content */
  getText: () => string;
  
  /** Sets the tab's icon */
  setIcon: (icon: string) => TabComponent;
  
  /** Gets the tab's icon HTML content */
  getIcon: () => string;
  
  /** Sets the tab's badge */
  setBadge: (content: string | number) => TabComponent;
  
  /** Gets the tab's badge content */
  getBadge: () => string;
  
  /** Shows the tab's badge */
  showBadge: () => TabComponent;
  
  /** Hides the tab's badge */
  hideBadge: () => TabComponent;
  
  /** Gets the badge component instance */
  getBadgeComponent: () => BadgeComponent | undefined;
  
  /** Updates the tab's layout style based on content */
  updateLayoutStyle: () => void;
  
  /** Adds an event listener to the tab */
  on: (event: string, handler: Function) => TabComponent;
  
  /** Removes an event listener from the tab */
  off: (event: string, handler: Function) => TabComponent;
  
  /** Destroys the tab component and cleans up resources */
  destroy: () => void;
  
  /** API for managing disabled state */
  disabled?: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  
  /** API for managing component lifecycle */
  lifecycle?: {
    destroy: () => void;
  };
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
   * Gets the indicator component
   * @returns Tab indicator component
   */
  getIndicator?: () => TabIndicator;
  
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
  
  /**
   * Tab click event handler
   */
  handleTabClick: (event: any, tab: TabComponent) => void;
  
  /**
   * Scroll container for scrollable tabs
   */
  scrollContainer?: HTMLElement;
}