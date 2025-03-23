// src/components/navigation/system.ts

import createNavigation from './navigation';

const log = console.log;

/**
 * Creates a complete navigation system with synchronized rail and drawer components
 * 
 * @param {Object} options - System configuration options
 * @returns {Object} Navigation system API
 */
export const createNavigationSystem = (options = {}) => {
  // Internal state
  const state = {
    rail: null,
    drawer: null,
    activeSection: options.activeSection || null,
    activeSubsection: options.activeSubsection || null,
    items: options.items || {},
    mouseInDrawer: false,
    hoverTimer: null,
    closeTimer: null,
    processingChange: false // Added to track if we're processing a change
  };

  // Config with defaults
  const config = {
    // Display options
    animateDrawer: true,
    showLabelsOnRail: options.showLabelsOnRail !== false,
    hideDrawerOnClick: options.hideDrawerOnClick || false,
    expanded: options.expanded === true, // Must be explicitly true
    
    // Timing options (ms)
    hoverDelay: options.hoverDelay || 200,
    closeDelay: options.closeDelay || 400,
    
    // Component options
    railOptions: options.railOptions || {},
    drawerOptions: options.drawerOptions || {},
    
    // Debug
    debug: options.debug || false
  };

  // Debug logger
  const log = (...args) => {
    if (config.debug) {
      console.log('[NavSystem]', ...args);
    }
  };

  /**
   * Update drawer content for a specific section WITHOUT changing visibility
   */
  const updateDrawerContent = (sectionId) => {
    log(`Updating drawer content for section: ${sectionId}`);
    
    if (!state.drawer) {
      log('ERROR: drawer not initialized');
      return;
    }
    
    // Validate section
    if (!sectionId || !state.items[sectionId]) {
      log(`ERROR: Invalid section ${sectionId} or not found in items`);
      return;
    }
    
    // Get section items
    const sectionData = state.items[sectionId];
    const items = sectionData.items || [];
    
    log(`Section ${sectionId} has ${items.length} items`);
    
    // If no items, hide drawer and exit
    if (items.length === 0) {
      log('No items for section, hiding drawer');
      hideDrawer();
      return;
    }
    
    // Clear existing drawer items first
    const currentItems = state.drawer.getAllItems();
    if (currentItems && currentItems.length > 0) {
      log(`Removing ${currentItems.length} existing drawer items`);
      currentItems.forEach(item => {
        state.drawer.removeItem(item.config.id);
      });
    }
    
    // Add new items to drawer
    log(`Adding ${items.length} items to drawer`);
    items.forEach(item => {
      state.drawer.addItem({
        ...item,
        active: item.id === state.activeSubsection
      });
    });
    
    // IMPORTANT: Do NOT automatically show drawer here!
    // This is the key change - it separates content updating from visibility
    
    log('Drawer content updated successfully');
  };

  /**
   * Create the rail navigation component
   */
  const createRailNavigation = () => {
    log('Creating rail navigation');
    
    // Build rail items from sections
    const railItems = Object.keys(state.items || {}).map(sectionId => ({
      id: sectionId,
      label: state.items[sectionId]?.label || sectionId,
      icon: state.items[sectionId]?.icon || '',
      active: sectionId === state.activeSection
    }));
    
    log(`Creating rail with ${railItems.length} items`);
    
    // Create the rail component
    const rail = createNavigation({
      variant: 'rail',
      position: 'left',
      showLabels: config.showLabelsOnRail,
      items: railItems,
      ...config.railOptions,
      debug: config.debug
    });

    log('Rail component structure:', {
      hasElement: !!rail.element,
      hasEmit: typeof rail.emit === 'function',
      hasOn: typeof rail.on === 'function',
      hasItems: rail.items instanceof Map,
      itemsCount: rail.items instanceof Map ? rail.items.size : 'N/A'
    });

    // CRITICAL: Set up internal event handling FIRST (before exposing the component)
    rail.on('change', (event) => {
      const id = event.id;
      console.log(`Rail change event received: ${id}`);
      
      if (!id) {
        log('No ID in event data, ignoring');
        return;
      }
      
      // Check if this is a user action
      const isUserAction = event.source === 'userAction';
      log(`Event source: ${isUserAction ? 'User clicked' : 'Programmatic'}`);
      
      // If it's not a user action and we're already on this section, do nothing
      if (!isUserAction && state.activeSection === id) {
        log(`Already on section ${id}, ignoring non-user event`);
        return;
      }
      
      // Set processing flag to prevent loops
      state.processingChange = true;
      
      // Update active section
      state.activeSection = id;
      
      // Handle internally first - update drawer content
      updateDrawerContent(id);
      
      // Show drawer if section has items
      if (state.items[id]?.items?.length > 0) {
        showDrawer();
      } else {
        hideDrawer();
      }
      
      // Then notify external handlers
      if (system.onSectionChange && isUserAction) {
        log(`Calling external onSectionChange handler for section: ${id}`);
        system.onSectionChange(id, { source: isUserAction ? 'userClick' : 'programmatic' });
      }
      
      // Clear the processing flag after a delay
      setTimeout(() => {
        state.processingChange = false;
      }, 50);
    });
    
    return rail;
  };
  
  /**
   * Create the drawer navigation component
   */
  const createDrawerNavigation = () => {
    log('Creating drawer navigation');
    
    // Create the drawer component (initially empty)
    const drawer = createNavigation({
      variant: 'drawer',
      position: 'left',
      items: [], // Start empty
      ...config.drawerOptions
    });
    
    // Mark drawer with identifier
    drawer.element.dataset.id = 'drawer';
    
    // IMPORTANT: Make drawer initially hidden unless explicitly expanded
    if (!config.expanded) {
      log('Drawer initially hidden');
      drawer.element.classList.add('mtrl-nav--hidden');
      drawer.element.setAttribute('aria-hidden', 'true');
    } else {
      log('Drawer initially visible');
    }
    
    // Use the component's native event system
    if (typeof drawer.on === 'function') {
      // Handle item selection
      drawer.on('change', (event) => {
        const id = event.id;
        log(`Drawer item selected: ${id}`);
        
        state.activeSubsection = id;
        
        // If configuration specifies to hide drawer on click, do so
        if (config.hideDrawerOnClick) {
          hideDrawer();
        }
        
        // Emit item selection event
        if (system.onItemSelect) {
          system.onItemSelect(event);
        }
      });
      
      // Handle mouseenter/mouseleave for drawer
      drawer.on('mouseenter', () => {
        log('Drawer mouseenter event');
        state.mouseInDrawer = true;
        
        // Clear any pending drawer hide timer
        if (state.closeTimer) {
          clearTimeout(state.closeTimer);
          state.closeTimer = null;
        }
      });
      
      drawer.on('mouseleave', () => {
        log('Drawer mouseleave event');
        state.mouseInDrawer = false;
        
        // Set timer to hide drawer
        state.closeTimer = setTimeout(() => {
          if (!state.mouseInDrawer) {
            hideDrawer();
          }
        }, config.closeDelay);
      });
    } else {
      log('WARNING: Drawer component does not have an "on" method for events');
    }
    
    return drawer;
  };
  
  /**
   * Show the drawer
   */
  const showDrawer = () => {
    if (!state.drawer) return;
    
    log('Showing drawer');
    state.drawer.element.classList.remove('mtrl-nav--hidden');
    state.drawer.element.setAttribute('aria-hidden', 'false');
  };
  
  /**
   * Hide the drawer
   */
  const hideDrawer = () => {
    if (!state.drawer) return;
    
    log('Hiding drawer');
    state.drawer.element.classList.add('mtrl-nav--hidden');
    state.drawer.element.setAttribute('aria-hidden', 'true');
  };
  
  /**
   * Check if drawer is visible
   */
  const isDrawerVisible = () => {
    if (!state.drawer) return false;
    return !state.drawer.element.classList.contains('mtrl-nav--hidden');
  };
  
  /**
   * Initialize the navigation system
   */
  const initialize = () => {
    log('Initializing navigation system');
    
    // Create rail component
    state.rail = createRailNavigation();
    
    // Create drawer component
    state.drawer = createDrawerNavigation();
    
    // Set active section if specified
    if (options.activeSection && state.items[options.activeSection]) {
      state.activeSection = options.activeSection;
      
      if (state.rail) {
        log(`Setting initial active rail item: ${options.activeSection}`);
        state.rail.setActive(options.activeSection);
      }
      
      // Update drawer content without showing it
      updateDrawerContent(options.activeSection);
      
      // Only show drawer if expanded is explicitly true
      if (config.expanded === true) {
        showDrawer();
      } else {
        // Explicitly ensure drawer is hidden
        hideDrawer();
      }
    }
    
    return system;
  };
  
  /**
   * Clean up resources
   */
  const cleanup = () => {
    log('Cleaning up navigation system');
    
    // Clear timers
    if (state.hoverTimer) {
      clearTimeout(state.hoverTimer);
      state.hoverTimer = null;
    }
    
    if (state.closeTimer) {
      clearTimeout(state.closeTimer);
      state.closeTimer = null;
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
    state.processingChange = false;
  };
  
  /**
   * Navigate to a specific section and subsection
   */
  const navigateTo = (section, subsection) => {
    log(`Navigating to section: ${section}, subsection: ${subsection}`);
    
    // Skip if section doesn't exist
    if (!section || !state.items[section]) {
      log(`ERROR: Section ${section} not found in items`);
      return;
    }
    
    // Check if we're already on this section and subsection
    if (state.activeSection === section && state.activeSubsection === subsection) {
      log(`Already at section ${section}${subsection ? ', subsection ' + subsection : ''}, no change needed`);
      return;
    }
    
    // Update active section
    state.activeSection = section;
    
    // Update rail if it exists
    if (state.rail) {
      log(`Setting rail active item: ${section}`);
      state.rail.setActive(section);
    }
    
    // Update drawer content
    updateDrawerContent(section);
    
    // Update active subsection if specified
    if (subsection && state.drawer) {
      state.activeSubsection = subsection;
      state.drawer.setActive(subsection);
    }
    
    // Show drawer if section has items (for explicit navigation)
    if (state.items[section]?.items?.length > 0) {
      showDrawer();
    } else {
      hideDrawer();
    }
  };
  
  // Create the public API
  const system = {
    initialize,
    cleanup,
    navigateTo,
    
    // Component access
    getRail: () => state.rail,
    getDrawer: () => state.drawer,
    
    // State getters
    getActiveSection: () => state.activeSection,
    getActiveSubsection: () => state.activeSubsection,
    
    // Drawer control
    showDrawer,
    hideDrawer,
    isDrawerVisible,
    
    // Configure
    configure: (newConfig) => {
      Object.assign(config, newConfig);
      return system;
    },
    
    // State processing management
    setProcessingChange: (isProcessing) => {
      state.processingChange = isProcessing;
    },
    
    isProcessingChange: () => state.processingChange,
    
    // Event handlers (to be set by user)
    onSectionChange: null,
    onItemSelect: null
  };
  
  // Return the uninitialized system
  return system;
};

export default createNavigationSystem;