// src/components/navigation/system/core.ts

import { NavigationSystemState, NavigationSystemConfig, NavigationItem } from './types';
import { isMobileDevice } from '../../../core/utils/mobile';
import createNavigation from '../navigation';

/**
 * Update drawer content for a specific section WITHOUT changing visibility
 * 
 * @param state - System state
 * @param sectionId - Section ID to display
 * @param showDrawer - Function to show the drawer
 * @param hideDrawer - Function to hide the drawer
 */
export const updateDrawerContent = (
  state: NavigationSystemState,
  sectionId: string,
  showDrawer: () => void,
  hideDrawer: () => void
): void => {
  if (!state.drawer || !sectionId || !state.items[sectionId]) {
    return;
  }
  
  // Get section items
  const sectionData = state.items[sectionId];
  const items = sectionData.items || [];
  
  // If no items, hide drawer and exit
  if (items.length === 0) {
    hideDrawer();
    return;
  }
  
  // Clear existing drawer items first using the API
  const currentItems = state.drawer.getAllItems();
  if (currentItems?.length > 0) {
    currentItems.forEach((item: any) => {
      state.drawer.removeItem(item.config.id);
    });
  }
  
  // Add new items to drawer through the API
  items.forEach((item: NavigationItem) => {
    state.drawer.addItem(item);
  });
  
  // Show the drawer
  showDrawer();
};

/**
 * Creates the rail navigation component
 * 
 * @param state - System state
 * @param config - System configuration
 * @returns Rail navigation component
 */
export const createRailNavigation = (
  state: NavigationSystemState,
  config: any
): any => {
  // Build rail items from sections
  const railItems = Object.keys(state.items || {}).map(sectionId => ({
    id: sectionId,
    label: state.items[sectionId]?.label || sectionId,
    icon: state.items[sectionId]?.icon || '',
    active: sectionId === state.activeSection
  }));
  
  // Create the rail component
  const rail = createNavigation({
    variant: 'rail',
    position: 'left',
    showLabels: config.showLabelsOnRail,
    items: railItems,
    ...config.railOptions
  });

  document.body.appendChild(rail.element);
  return rail;
};

/**
 * Creates the drawer navigation component
 * 
 * @param state - System state
 * @param config - System configuration
 * @returns Drawer navigation component
 */
export const createDrawerNavigation = (
  state: NavigationSystemState,
  config: any
): any => {
  // Create the drawer component (initially empty)
  const drawer = createNavigation({
    variant: 'drawer',
    position: 'left',
    items: [], // Start empty
    ...config.drawerOptions
  });
  
  document.body.appendChild(drawer.element);

  // Mark drawer with identifier
  drawer.element.dataset.id = 'drawer';
  
  // IMPORTANT: Make drawer initially hidden unless explicitly expanded
  if (!config.expanded) {
    drawer.element.classList.add('mtrl-nav--hidden');
    drawer.element.setAttribute('aria-hidden', 'true');
  }
  
  return drawer;
};

/**
 * Shows the drawer with mobile-specific behaviors
 * 
 * @param state - System state
 * @param mobileConfig - Mobile configuration
 */
export const showDrawer = (
  state: NavigationSystemState,
  mobileConfig: any
): void => {
  if (!state.drawer) return;
  
  state.drawer.element.classList.remove('mtrl-nav--hidden');
  state.drawer.element.setAttribute('aria-hidden', 'false');
  
  // Apply mobile-specific behaviors
  if (state.isMobile) {
    if (state.overlayElement) {
      state.overlayElement.classList.add('active');
      state.overlayElement.setAttribute('aria-hidden', 'false');
    }
    
    // Lock body scroll if enabled
    if (mobileConfig.lockBodyScroll) {
      document.body.classList.add(mobileConfig.bodyLockClass);
    }
    
    // Ensure close button is visible
    if (state.closeButtonElement) {
      state.closeButtonElement.style.display = 'flex';
    }
  }
};

/**
 * Hides the drawer with mobile-specific behaviors
 * 
 * @param state - System state
 * @param mobileConfig - Mobile configuration
 */
export const hideDrawer = (
  state: NavigationSystemState,
  mobileConfig: any
): void => {
  if (!state.drawer) return;
  
  state.drawer.element.classList.add('mtrl-nav--hidden');
  state.drawer.element.setAttribute('aria-hidden', 'true');
  
  // Remove mobile-specific effects
  if (state.overlayElement) {
    state.overlayElement.classList.remove('active');
    state.overlayElement.setAttribute('aria-hidden', 'true');
  }
  
  // Unlock body scroll
  if (mobileConfig.lockBodyScroll) {
    document.body.classList.remove(mobileConfig.bodyLockClass);
  }
};

/**
 * Checks if drawer is visible
 * 
 * @param state - System state
 * @returns true if drawer is visible
 */
export const isDrawerVisible = (
  state: NavigationSystemState
): boolean => {
  if (!state.drawer) return false;
  return !state.drawer.element.classList.contains('mtrl-nav--hidden');
};

/**
 * Checks and updates the mobile state
 * 
 * @param state - System state
 * @param mobileConfig - Mobile configuration
 * @param setupMobileMode - Function to set up mobile mode
 * @param teardownMobileMode - Function to tear down mobile mode
 * @param systemApi - Reference to the public system API
 */
export const checkMobileState = (
  state: NavigationSystemState,
  mobileConfig: any,
  setupMobileMode: () => void,
  teardownMobileMode: () => void,
  systemApi: any
): void => {
  const prevState = state.isMobile;
  state.isMobile = window.innerWidth <= mobileConfig.breakpoint || isMobileDevice();
  
  // If state changed, adjust UI
  if (prevState !== state.isMobile) {
    if (state.isMobile) {
      // Switched to mobile mode
      setupMobileMode();
    } else {
      // Switched to desktop mode
      teardownMobileMode();
    }
    
    // Emit a view change event
    if (systemApi.onViewChange) {
      systemApi.onViewChange({
        mobile: state.isMobile,
        previousMobile: prevState,
        width: window.innerWidth
      });
    }
  }
};

/**
 * Clean up resources when the system is destroyed
 * 
 * @param state - System state
 */
export const cleanupResources = (
  state: NavigationSystemState
): void => {
  // Clean up overlay
  if (state.overlayElement && state.overlayElement.parentNode) {
    state.overlayElement.parentNode.removeChild(state.overlayElement);
    state.overlayElement = null;
  }
  
  // Destroy components
  if (state.rail) {
    state.rail.destroy();
    state.rail = null;
  }
  
  if (state.drawer) {
    state.drawer.destroy();
    state.drawer = null;
  }
  
  // Reset state
  state.activeSection = null;
  state.activeSubsection = null;
  state.mouseInDrawer = false;
  state.mouseInRail = false;
  state.processingChange = false;
  state.isMobile = false;
};

/**
 * Navigate to a specific section and subsection
 * 
 * @param state - System state
 * @param section - Section ID
 * @param subsection - Subsection ID (optional)
 * @param silent - Whether to suppress change events
 */
export const navigateTo = (
  state: NavigationSystemState,
  section: string,
  subsection?: string,
  silent?: boolean
): void => {
  // Skip if section doesn't exist
  if (!section || !state.items[section]) {
    return;
  }
  
  // Check if we're already on this section and subsection
  if (state.activeSection === section && state.activeSubsection === subsection) {
    return;
  }
  
  // Update active section
  state.activeSection = section;
  
  // Update rail if it exists
  if (state.rail) {
    state.rail.setActive(section, silent);
  }
  
  // Update active subsection if specified
  if (subsection && state.drawer) {
    state.activeSubsection = subsection;
    state.drawer.setActive(subsection, silent);
  }
};