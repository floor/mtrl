// src/components/navigation/system-types.ts

import { NavigationComponent, NavItemConfig } from './types';

/**
 * Structure for navigation section with its items
 */
export interface NavigationSection {
  /** Section label */
  label: string;
  
  /** Section icon HTML */
  icon?: string;
  
  /** Navigation items within this section */
  items: NavItemConfig[];
}

/**
 * Configuration for the navigation system
 */
export interface NavigationSystemConfig {
  /** Item structure by section ID */
  items: Record<string, NavigationSection>;
  
  /** Initial active section */
  activeSection?: string;
  
  /** Initial active subsection */
  activeSubsection?: string;
  
  /** Whether to animate drawer opening/closing */
  animateDrawer?: boolean;
  
  /** Whether to show labels on rail */
  showLabelsOnRail?: boolean;
  
  /** Whether to hide drawer when an item is clicked */
  hideDrawerOnClick?: boolean;
  
  /** Delay before showing drawer on hover (ms) */
  hoverDelay?: number;
  
  /** Delay before hiding drawer on mouse leave (ms) */
  closeDelay?: number;
  
  /** Configuration options passed to rail component */
  railOptions?: Record<string, any>;
  
  /** Configuration options passed to drawer component */
  drawerOptions?: Record<string, any>;
  
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Event data for section change events
 */
export interface SectionChangeEvent {
  /** ID of the selected section */
  section: string;
  
  /** Section data */
  sectionData: NavigationSection;
}

/**
 * Event data for item selection events
 */
export interface ItemSelectEvent {
  /** ID of the parent section */
  section: string;
  
  /** ID of the selected subsection */
  subsection: string;
  
  /** Selected item data */
  item: any;
}

/**
 * Navigation system API
 */
export interface NavigationSystem {
  /** Initialize the navigation system */
  initialize(): NavigationSystem;
  
  /** Clean up resources */
  cleanup(): void;
  
  /** Navigate to a specific section and subsection */
  navigateTo(section: string, subsection?: string): void;
  
  /** Get the rail component */
  getRail(): NavigationComponent | null;
  
  /** Get the drawer component */
  getDrawer(): NavigationComponent | null;
  
  /** Get the active section */
  getActiveSection(): string | null;
  
  /** Get the active subsection */
  getActiveSubsection(): string | null;
  
  /** Show the drawer */
  showDrawer(): void;
  
  /** Hide the drawer */
  hideDrawer(): void;
  
  /** Check if drawer is visible */
  isDrawerVisible(): boolean;
  
  /** Configure the navigation system */
  configure(config: Partial<NavigationSystemConfig>): NavigationSystem;
  
  /** Event handler for section changes */
  onSectionChange: ((section: string, subsection?: string) => void) | null;
  
  /** Event handler for item selection */
  onItemSelect: ((event: ItemSelectEvent) => void) | null;
}