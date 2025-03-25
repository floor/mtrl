// src/components/navigation/system/events.ts

import { NavigationSystemState } from './types';
import { NavigationItem, NavigationSection } from './types';

/**
 * Registers rail navigation event handlers
 * 
 * @param state - System state
 * @param config - System configuration
 * @param updateDrawerContent - Function to update drawer content
 * @param showDrawer - Function to show the drawer
 * @param hideDrawer - Function to hide the drawer
 * @param systemApi - Reference to the public system API
 */
export const registerRailEvents = (
  state: NavigationSystemState,
  config: any,
  updateDrawerContent: (sectionId: string) => void,
  showDrawer: () => void,
  hideDrawer: () => void,
  systemApi: any
): void => {
  const rail = state.rail;
  if (!rail) return;

  // Register for change events - will listen for when rail items are clicked
  rail.on('change', (event: any) => {
    // Extract ID from event data
    const id = event?.id;
    
    if (!id || state.processingChange) {
      return;
    }
    
    // Check if this is a user action
    const isUserAction = event?.source === 'userAction';
    
    // Set processing flag to prevent loops
    state.processingChange = true;
    
    // Update active section
    state.activeSection = id;
    
    // Handle internally first - update drawer content
    updateDrawerContent(id);
    
    // Then notify external handlers
    if (systemApi.onSectionChange && isUserAction) {
      systemApi.onSectionChange(id, { source: isUserAction ? 'userClick' : 'programmatic' });
    }
    
    // Clear the processing flag after a delay
    setTimeout(() => {
      state.processingChange = false;
    }, 50);
  });

  rail.on('mouseover', (event: any) => {
    const id = event?.id;
    
    // Set rail mouse state
    state.mouseInRail = true;
    
    // Clear any existing hover timer
    clearTimeout(state.hoverTimer as number);
    state.hoverTimer = null;
    
    // Only schedule drawer operations if there's an ID
    if (id) {
      // Check if this section has items
      if (state.items[id]?.items?.length > 0) {
        // Has items - schedule drawer opening
        state.hoverTimer = window.setTimeout(() => {
          updateDrawerContent(id);
        }, config.hoverDelay) as unknown as number;
      } else {
        // No items - hide drawer after a delay to prevent flickering
        state.closeTimer = window.setTimeout(() => {
          // Only hide if we're still in the rail but not in the drawer
          if (state.mouseInRail && !state.mouseInDrawer) {
            hideDrawer();
          }
        }, config.hoverDelay) as unknown as number;
      }
    }
  });

  rail.on('mouseenter', () => {
    state.mouseInRail = true;
    
    // Clear any pending drawer close timer when entering rail
    clearTimeout(state.closeTimer as number);
    state.closeTimer = null;
  });

  rail.on('mouseleave', () => {
    state.mouseInRail = false;
    
    // Clear any existing hover timer
    clearTimeout(state.hoverTimer as number);
    state.hoverTimer = null;
    
    // Only set timer to hide drawer if we're not in drawer either
    if (!state.mouseInDrawer) {
      state.closeTimer = window.setTimeout(() => {
        // Double-check we're still not in rail or drawer before hiding
        if (!state.mouseInRail && !state.mouseInDrawer) {
          hideDrawer();
        }
      }, config.closeDelay) as unknown as number;
    }
  });
};

/**
 * Registers drawer navigation event handlers
 * 
 * @param state - System state
 * @param config - System configuration
 * @param hideDrawer - Function to hide the drawer
 * @param systemApi - Reference to the public system API
 */
export const registerDrawerEvents = (
  state: NavigationSystemState,
  config: any,
  hideDrawer: () => void,
  systemApi: any
): void => {
  const drawer = state.drawer;
  if (!drawer) return;

  // Use the component's native event system
  if (typeof drawer.on === 'function') {
    // Handle item selection
    drawer.on('change', (event: any) => {
      const id = event.id;
      
      state.activeSubsection = id;
      
      // If configuration specifies to hide drawer on click, do so
      if (config.hideDrawerOnClick) {
        hideDrawer();
      }
      
      // Emit item selection event
      if (systemApi.onItemSelect) {
        systemApi.onItemSelect(event);
      }
    });
    
    // Handle mouseenter/mouseleave for drawer
    drawer.on('mouseenter', () => {
      state.mouseInDrawer = true;
      
      // Clear any hover and close timers
      clearTimeout(state.hoverTimer as number);
      clearTimeout(state.closeTimer as number);
      state.hoverTimer = null;
      state.closeTimer = null;
    });
    
    drawer.on('mouseleave', () => {
      state.mouseInDrawer = false;
      
      // Only set timer to hide drawer if we're not in rail
      if (!state.mouseInRail) {
        state.closeTimer = window.setTimeout(() => {
          // Double-check we're still not in drawer or rail before hiding
          if (!state.mouseInDrawer && !state.mouseInRail) {
            hideDrawer();
          }
        }, config.closeDelay) as unknown as number;
      }
    });
  }
};

/**
 * Sets up window resize and orientation change handling
 * 
 * @param state - System state 
 * @param checkMobileState - Function to check and update mobile state
 */
export const setupResponsiveHandling = (
  state: NavigationSystemState,
  checkMobileState: () => void
): void => {
  // Setup responsive behavior
  if (window.ResizeObserver) {
    // Use ResizeObserver for better performance
    state.resizeObserver = new ResizeObserver(() => {
      checkMobileState();
    });
    state.resizeObserver.observe(document.body);
  } else {
    // Fallback to window resize event
    window.addEventListener('resize', checkMobileState);
  }
  
  // Listen for orientation changes on mobile
  window.addEventListener('orientationchange', () => {
    // Small delay to ensure dimensions have updated
    setTimeout(checkMobileState, 100);
  });
};

/**
 * Cleans up all event handlers and resources
 * 
 * @param state - System state
 * @param checkMobileState - Function reference to remove event handlers
 */
export const cleanupEvents = (
  state: NavigationSystemState,
  checkMobileState: () => void
): void => {
  // Clean up resize observer
  if (state.resizeObserver) {
    state.resizeObserver.disconnect();
    state.resizeObserver = null;
  } else {
    window.removeEventListener('resize', checkMobileState);
  }
  
  // Remove orientation change listener
  window.removeEventListener('orientationchange', checkMobileState);
  
  // Remove outside click handler
  if (state.outsideClickHandler) {
    const eventType = ('ontouchend' in window) ? 'touchend' : 'click';
    document.removeEventListener(eventType, state.outsideClickHandler);
  }
  
  // Clear timers
  clearTimeout(state.hoverTimer as number);
  clearTimeout(state.closeTimer as number);
  state.hoverTimer = null;
  state.closeTimer = null;
};