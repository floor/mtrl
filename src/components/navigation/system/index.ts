// src/components/navigation/system/index.ts

import { 
  NavigationSystemConfig, 
  NavigationSystemState, 
  NavigationSystem,
  ViewChangeEvent
} from './types';

import { 
  createInitialState, 
  createConfig, 
  createMobileConfig 
} from './state';

import {
  createRailNavigation,
  createDrawerNavigation,
  updateDrawerContent,
  showDrawer as showDrawerCore,
  hideDrawer as hideDrawerCore,
  isDrawerVisible as isDrawerVisibleCore,
  checkMobileState as checkMobileStateCore,
  cleanupResources,
  navigateTo as navigateToCore
} from './core';

import {
  registerRailEvents,
  registerDrawerEvents,
  setupResponsiveHandling,
  cleanupEvents
} from './events';

import {
  setupMobileMode as setupMobileModeCore,
  teardownMobileMode
} from './mobile';

/**
 * Creates a complete navigation system with synchronized rail and drawer components
 * 
 * @param options - System configuration options
 * @returns Navigation system API
 */
export const createNavigationSystem = (options: NavigationSystemConfig = {}): NavigationSystem => {
  // Initialize state and configuration
  const state = createInitialState(options);
  const config = createConfig(options);
  const mobileConfig = createMobileConfig(options);

  // Create system API object with placeholders
  const system: NavigationSystem = {
    initialize: () => system,
    cleanup: () => {},
    navigateTo: () => {},
    getRail: () => state.rail,
    getDrawer: () => state.drawer,
    getActiveSection: () => state.activeSection,
    getActiveSubsection: () => state.activeSubsection,
    showDrawer: () => {},
    hideDrawer: () => {},
    isDrawerVisible: () => false,
    configure: () => system,
    setProcessingChange: () => {},
    isProcessingChange: () => false,
    isMobile: () => state.isMobile,
    checkMobileState: () => {},
    onSectionChange: undefined,
    onItemSelect: undefined,
    onViewChange: undefined
  };

  // Implementation functions that use the state
  const showDrawer = () => showDrawerCore(state, mobileConfig);
  const hideDrawer = () => hideDrawerCore(state, mobileConfig);
  const isDrawerVisible = () => isDrawerVisibleCore(state);
  
  const updateDrawerContentWrapper = (sectionId: string) => {
    updateDrawerContent(state, sectionId, showDrawer, hideDrawer);
  };

  const setupMobileMode = () => {
    setupMobileModeCore(
      state, 
      mobileConfig, 
      hideDrawer, 
      isDrawerVisible
    );
  };

  const checkMobileState = () => {
    checkMobileStateCore(
      state, 
      mobileConfig, 
      setupMobileMode, 
      () => teardownMobileMode(state, mobileConfig), 
      system
    );
  };

  const navigateTo = (section: string, subsection?: string, silent?: boolean) => {
    navigateToCore(state, section, subsection, silent);
  };

  // Implementation of the initialize method
  const initialize = (): NavigationSystem => {
    // Create rail component
    state.rail = createRailNavigation(state, config);
    
    // Create drawer component
    state.drawer = createDrawerNavigation(state, config);
    
    // Register event handlers
    registerRailEvents(state, config, updateDrawerContentWrapper, showDrawer, hideDrawer, system);
    registerDrawerEvents(state, config, hideDrawer, system);
    
    // Set up responsive behavior
    setupResponsiveHandling(state, checkMobileState);
    
    // Set active section if specified
    if (options.activeSection && state.items[options.activeSection]) {
      state.activeSection = options.activeSection;
      
      if (state.rail) {
        state.rail.setActive(options.activeSection);
      }
      
      // Update drawer content without showing it
      updateDrawerContentWrapper(options.activeSection);
      
      // Only show drawer if expanded is explicitly true
      if (options.expanded === true) {
        showDrawer();
      } else {
        // Explicitly ensure drawer is hidden
        hideDrawer();
      }
    }
    
    // Check initial mobile state
    checkMobileState();
    
    return system;
  };

  // Implementation of the cleanup method
  const cleanup = (): void => {
    cleanupEvents(state, checkMobileState);
    cleanupResources(state);
  };

  // Configure method implementation
  const configure = (newConfig: Partial<NavigationSystemConfig>): NavigationSystem => {
    Object.assign(options, newConfig);
    Object.assign(config, createConfig({...options, ...newConfig}));
    Object.assign(mobileConfig, createMobileConfig({...options, ...newConfig}));
    return system;
  };

  // Assign implementations to system object
  system.initialize = initialize;
  system.cleanup = cleanup;
  system.navigateTo = navigateTo;
  system.showDrawer = showDrawer;
  system.hideDrawer = hideDrawer;
  system.isDrawerVisible = isDrawerVisible;
  system.configure = configure;
  system.setProcessingChange = (isProcessing: boolean) => {
    state.processingChange = isProcessing;
  };
  system.isProcessingChange = () => state.processingChange;
  system.isMobile = () => state.isMobile;
  system.checkMobileState = checkMobileState;

  // Return the uninitialized system
  return system;
};

export default createNavigationSystem;

// Re-export types for external use
export * from './types';