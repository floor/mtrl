// src/components/navigation/system/state.ts

import { NavigationSystemConfig, NavigationSystemState } from './types';

/**
 * Create the initial state for the navigation system
 * 
 * @param options - Configuration options
 * @returns Initial system state
 */
export const createInitialState = (options: NavigationSystemConfig = {}): NavigationSystemState => {
  return {
    rail: null,
    drawer: null,
    activeSection: options.activeSection || null,
    activeSubsection: options.activeSubsection || null,
    items: options.items || {},
    mouseInDrawer: false,
    mouseInRail: false,
    hoverTimer: null,
    closeTimer: null,
    processingChange: false,
    isMobile: false,
    overlayElement: null,
    closeButtonElement: null,
    resizeObserver: null,
    outsideClickHandler: null,
    outsideClickHandlerSet: false
  };
};

/**
 * Create default configuration with sensible defaults
 * 
 * @param options - User-provided configuration
 * @returns Complete configuration with defaults
 */
export const createConfig = (options: NavigationSystemConfig = {}): Required<Pick<NavigationSystemConfig, 
  'animateDrawer' | 'showLabelsOnRail' | 'hideDrawerOnClick' | 'expanded' | 
  'hoverDelay' | 'closeDelay' | 'railOptions' | 'drawerOptions'>> => {
  return {
    // Display options
    animateDrawer: options.animateDrawer !== false,
    showLabelsOnRail: options.showLabelsOnRail !== false,
    hideDrawerOnClick: options.hideDrawerOnClick || false,
    expanded: options.expanded === true,
    
    // Timing options (ms)
    hoverDelay: options.hoverDelay || 200,
    closeDelay: options.closeDelay || 100,
    
    // Component options
    railOptions: options.railOptions || {},
    drawerOptions: options.drawerOptions || {}
  };
};

/**
 * Create mobile configuration with defaults
 * 
 * @param options - User-provided configuration
 * @returns Mobile-specific configuration
 */
export const createMobileConfig = (options: NavigationSystemConfig = {}): Required<Pick<NavigationSystemConfig, 
  'breakpoint' | 'lockBodyScroll' | 'hideOnClickOutside' | 'enableSwipeGestures' | 
  'optimizeForTouch' | 'overlayClass' | 'closeButtonClass' | 'bodyLockClass'>> => {
  return {
    breakpoint: options.breakpoint || 960,
    lockBodyScroll: options.lockBodyScroll !== false,
    hideOnClickOutside: options.hideOnClickOutside !== false,
    enableSwipeGestures: options.enableSwipeGestures !== false,
    optimizeForTouch: options.optimizeForTouch !== false,
    overlayClass: options.overlayClass || 'mtrl-nav-overlay',
    closeButtonClass: options.closeButtonClass || 'mtrl-nav-close-btn',
    bodyLockClass: options.bodyLockClass || 'mtrl-body-drawer-open'
  };
};