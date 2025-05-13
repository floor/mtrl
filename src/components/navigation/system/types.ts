// src/components/navigation/system/types.ts

/**
 * Configuration options for the navigation system
 */
export interface NavigationSystemConfig {
  /**
   * Screen width breakpoint for mobile mode (in pixels)
   * @default 960
   */
  breakpoint?: number;
  
  /**
   * Prevent body scrolling when mobile drawer is open
   * @default true
   */
  lockBodyScroll?: boolean;
  
  /**
   * Close drawer when clicking outside of it in mobile mode
   * @default true
   */
  hideOnClickOutside?: boolean;
  
  /**
   * Enable swipe gestures for mobile navigation
   * @default true
   */
  enableSwipeGestures?: boolean;
  
  /**
   * Optimize touch targets for mobile devices
   * @default true
   */
  optimizeForTouch?: boolean;
  
  /**
   * CSS class for the overlay element
   * @default 'mtrl-nav-overlay'
   */
  overlayClass?: string;
  
  /**
   * CSS class for the close button
   * @default 'mtrl-nav-close-btn'
   */
  closeButtonClass?: string;
  
  /**
   * CSS class applied to body when drawer is open (to prevent scrolling)
   * @default 'mtrl-body-drawer-open'
   */
  bodyLockClass?: string;
  
  /**
   * Show drawer transition animations
   * @default true
   */
  animateDrawer?: boolean;
  
  /**
   * Display labels on rail navigation items
   * @default true
   */
  showLabelsOnRail?: boolean;
  
  /**
   * Hide drawer when an item is clicked
   * @default false
   */
  hideDrawerOnClick?: boolean;
  
  /**
   * Start with drawer expanded
   * @default false
   */
  expanded?: boolean;
  
  /**
   * Delay before opening drawer on hover (in ms)
   * @default 200
   */
  hoverDelay?: number;
  
  /**
   * Delay before closing drawer after mouseleave (in ms)
   * @default 100
   */
  closeDelay?: number;
  
  /**
   * ID of the initially active section
   */
  activeSection?: string;
  
  /**
   * ID of the initially active subsection
   */
  activeSubsection?: string;
  
  /**
   * Navigation items configuration
   */
  items?: Record<string, NavigationSection>;
  
  /**
   * Additional options for the rail component
   */
  railOptions?: Record<string, any>;
  
  /**
   * Additional options for the drawer component
   */
  drawerOptions?: Record<string, any>;
}

/**
 * Navigation section configuration
 */
export interface NavigationSection {
  /**
   * Display label for the section
   */
  label: string;
  
  /**
   * Icon for the section
   */
  icon?: string;
  
  /**
   * Subsection items
   */
  items?: NavigationItem[];
}

/**
 * Navigation item configuration
 */
export interface NavigationItem {
  /**
   * Unique identifier for the item
   */
  id: string;
  
  /**
   * Display label for the item
   */
  label: string;
  
  /**
   * Icon for the item
   */
  icon?: string;
  
  /**
   * Whether the item is currently active
   */
  active?: boolean;
  
  /**
   * Additional properties
   */
  [key: string]: any;
}

/**
 * Navigation system state interface
 */
export interface NavigationSystemState {
  /**
   * Rail navigation component instance
   */
  rail: any;
  
  /**
   * Drawer navigation component instance
   */
  drawer: any;
  
  /**
   * ID of the active section
   */
  activeSection: string | null;
  
  /**
   * ID of the active subsection
   */
  activeSubsection: string | null;
  
  /**
   * Navigation items configuration
   */
  items: Record<string, NavigationSection>;
  
  /**
   * Whether the mouse is currently inside the drawer
   */
  mouseInDrawer: boolean;
  
  /**
   * Whether the mouse is currently inside the rail
   */
  mouseInRail: boolean;
  
  /**
   * Timer ID for hover delay
   */
  hoverTimer: number | null;
  
  /**
   * Timer ID for close delay
   */
  closeTimer: number | null;
  
  /**
   * Whether the system is currently processing a change
   */
  processingChange: boolean;
  
  /**
   * Whether the system is in mobile mode
   */
  isMobile: boolean;
  
  /**
   * Overlay element for mobile mode
   */
  overlayElement: HTMLElement | null;
  
  /**
   * Close button element for mobile mode
   */
  closeButtonElement: HTMLElement | null;
  
  /**
   * ResizeObserver instance for responsive behavior
   */
  resizeObserver: ResizeObserver | null;
  
  /**
   * Handler function for outside clicks
   */
  outsideClickHandler: ((event: Event) => void) | null;
  
  /**
   * Whether outside click handling is set up
   */
  outsideClickHandlerSet: boolean;
}

/**
 * View change event data
 */
export interface ViewChangeEvent {
  /**
   * Whether the system is now in mobile mode
   */
  mobile: boolean;
  
  /**
   * Whether the system was previously in mobile mode
   */
  previousMobile: boolean;
  
  /**
   * Current window width
   */
  width: number;
}

/**
 * Navigation system API interface
 */
export interface NavigationSystem {
  /**
   * Initialize the navigation system
   */
  initialize(): NavigationSystem;
  
  /**
   * Clean up resources
   */
  cleanup(): void;
  
  /**
   * Navigate to a specific section and subsection
   * @param section - Section ID
   * @param subsection - Subsection ID (optional)
   * @param silent - Whether to suppress change events
   */
  navigateTo(section: string, subsection?: string, silent?: boolean): void;
  
  /**
   * Get the rail navigation component
   */
  getRail(): any;
  
  /**
   * Get the drawer navigation component
   */
  getDrawer(): any;
  
  /**
   * Get the active section ID
   */
  getActiveSection(): string | null;
  
  /**
   * Get the active subsection ID
   */
  getActiveSubsection(): string | null;
  
  /**
   * Show the drawer
   */
  showDrawer(): void;
  
  /**
   * Hide the drawer
   */
  hideDrawer(): void;
  
  /**
   * Check if the drawer is visible
   */
  isDrawerVisible(): boolean;
  
  /**
   * Update configuration
   * @param newConfig - New configuration options
   */
  configure(newConfig: Partial<NavigationSystemConfig>): NavigationSystem;
  
  /**
   * Set processing change state
   * @param isProcessing - Whether a change is being processed
   */
  setProcessingChange(isProcessing: boolean): void;
  
  /**
   * Check if a change is being processed
   */
  isProcessingChange(): boolean;
  
  /**
   * Check if the system is in mobile mode
   */
  isMobile(): boolean;
  
  /**
   * Check and update mobile state
   */
  checkMobileState(): void;
  
  /**
   * Handler for section changes
   */
  onSectionChange?: (sectionId: string, eventData: any) => void;
  
  /**
   * Handler for item selection
   */
  onItemSelect?: (event: any) => void;
  
  /**
   * Handler for view changes (mobile/desktop)
   */
  onViewChange?: (event: ViewChangeEvent) => void;
}