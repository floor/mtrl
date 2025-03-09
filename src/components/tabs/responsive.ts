// src/components/tabs/responsive.ts
import { TabsComponent, TabComponent } from './types';

/**
 * Breakpoints for responsive behavior
 */
export const RESPONSIVE_BREAKPOINTS = {
  /** Small screens (mobile) */
  SMALL: 600,
  /** Medium screens (tablet) */
  MEDIUM: 904,
  /** Large screens (desktop) */
  LARGE: 1240
};

/**
 * Configuration for responsive behavior
 */
export interface ResponsiveConfig {
  /** Whether to enable responsive behavior */
  responsive?: boolean;
  /** Options for small screens */
  smallScreen?: {
    /** Layout to use on small screens */
    layout?: 'icon-only' | 'text-only' | 'icon-and-text';
    /** Maximum tabs to show before scrolling */
    maxVisibleTabs?: number;
  };
  /** Custom breakpoint values */
  breakpoints?: {
    small?: number;
    medium?: number;
    large?: number;
  };
}

/**
 * Enhances tabs with responsive behavior
 * @param tabs - The tabs component to enhance
 * @param config - Responsive configuration
 */
export const setupResponsiveBehavior = (
  tabs: TabsComponent, 
  config: ResponsiveConfig = {}
): void => {
  if (config.responsive === false) return;
  
  // Merge custom breakpoints with defaults
  const breakpoints = {
    small: config.breakpoints?.small || RESPONSIVE_BREAKPOINTS.SMALL,
    medium: config.breakpoints?.medium || RESPONSIVE_BREAKPOINTS.MEDIUM,
    large: config.breakpoints?.large || RESPONSIVE_BREAKPOINTS.LARGE
  };
  
  // Default small screen configuration
  const smallScreen = {
    layout: config.smallScreen?.layout || 'icon-only',
    maxVisibleTabs: config.smallScreen?.maxVisibleTabs || 4
  };
  
  // Store original tab layouts to restore later
  const originalLayouts = new Map<TabComponent, string>();
  
  // Get all tabs
  const allTabs = tabs.getTabs();
  
  // Save original layouts
  allTabs.forEach(tab => {
    // Determine current layout
    let layout = 'text-only';
    if (tab.getIcon() && tab.getText()) {
      layout = 'icon-and-text';
    } else if (tab.getIcon()) {
      layout = 'icon-only';
    }
    
    originalLayouts.set(tab, layout);
  });
  
  /**
   * Update tabs layout based on screen size
   */
  const updateLayout = (): void => {
    const width = window.innerWidth;
    
    if (width < breakpoints.small) {
      // Small screen behavior
      allTabs.forEach(tab => {
        // Skip if tab has no icon but we want icon-only
        if (smallScreen.layout === 'icon-only' && !tab.getIcon()) {
          return;
        }
        
        // Apply layout according to small screen config
        if (smallScreen.layout === 'icon-only' && tab.getIcon()) {
          // Keep text for accessibility but visually show only icon
          tab.element.classList.remove(`${tab.getClass('tab')}--icon-and-text`);
          tab.element.classList.remove(`${tab.getClass('tab')}--text-only`);
          tab.element.classList.add(`${tab.getClass('tab')}--icon-only`);
        } else if (smallScreen.layout === 'text-only') {
          tab.element.classList.remove(`${tab.getClass('tab')}--icon-and-text`);
          tab.element.classList.remove(`${tab.getClass('tab')}--icon-only`);
          tab.element.classList.add(`${tab.getClass('tab')}--text-only`);
        }
      });
      
      // Add responsive class
      tabs.element.classList.add(`${tabs.getClass('tabs')}--responsive-small`);
    } else {
      // Restore original layouts for medium and large screens
      allTabs.forEach(tab => {
        const originalLayout = originalLayouts.get(tab) || 'text-only';
        
        tab.element.classList.remove(`${tab.getClass('tab')}--icon-only`);
        tab.element.classList.remove(`${tab.getClass('tab')}--text-only`);
        tab.element.classList.remove(`${tab.getClass('tab')}--icon-and-text`);
        
        tab.element.classList.add(`${tab.getClass('tab')}--${originalLayout}`);
      });
      
      // Remove responsive class
      tabs.element.classList.remove(`${tabs.getClass('tabs')}--responsive-small`);
    }
  };
  
  // Initial layout update
  updateLayout();
  
  // Set up resize listener
  const resizeObserver = new ResizeObserver(updateLayout);
  resizeObserver.observe(document.body);
  
  // Store the observer on the component for cleanup
  (tabs as any)._resizeObserver = resizeObserver;
  
  // Enhance destroy method to clean up observer
  const originalDestroy = tabs.destroy;
  tabs.destroy = function() {
    if ((this as any)._resizeObserver) {
      (this as any)._resizeObserver.disconnect();
    }
    originalDestroy.call(this);
  };
};