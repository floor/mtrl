// src/components/navigation/system.ts

import createNavigation from './navigation';

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
    mouseInRail: false,
    hoverTimer: null,
    closeTimer: null,
    processingChange: false
  };

  // Config with defaults
  const config = {
    // Display options
    animateDrawer: true,
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

  /**
   * Update drawer content for a specific section WITHOUT changing visibility
   */
  const updateDrawerContent = (sectionId) => {
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
      currentItems.forEach(item => {
        state.drawer.removeItem(item.config.id);
      });
    }
    
    // Add new items to drawer through the API
    items.forEach(item => {
      state.drawer.addItem(item);
    });
    
    // Show the drawer
    showDrawer();
  };

  /**
   * Create the rail navigation component
   */
  const createRailNavigation = () => {
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

    // Register for change events - will listen for when rail items are clicked
    rail.on('change', (event) => {
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
      if (system.onSectionChange && isUserAction) {
        system.onSectionChange(id, { source: isUserAction ? 'userClick' : 'programmatic' });
      }
      
      // Clear the processing flag after a delay
      setTimeout(() => {
        state.processingChange = false;
      }, 50);
    });

    rail.on('mouseover', (event) => {
      const id = event?.id;
      
      // Set rail mouse state
      state.mouseInRail = true;
      
      // Clear any existing hover timer
      clearTimeout(state.hoverTimer);
      state.hoverTimer = null;
      
      // Only schedule drawer operations if there's an ID
      if (id) {
        // Check if this section has items
        if (state.items[id]?.items?.length > 0) {
          // Has items - schedule drawer opening
          state.hoverTimer = setTimeout(() => {
            updateDrawerContent(id);
          }, config.hoverDelay);
        } else {
          // No items - hide drawer after a delay to prevent flickering
          state.closeTimer = setTimeout(() => {
            // Only hide if we're still in the rail but not in the drawer
            if (state.mouseInRail && !state.mouseInDrawer) {
              hideDrawer();
            }
          }, config.hoverDelay);
        }
      }
    });

    rail.on('mouseenter', () => {
      state.mouseInRail = true;
      
      // Clear any pending drawer close timer when entering rail
      clearTimeout(state.closeTimer);
      state.closeTimer = null;
    });

    rail.on('mouseleave', () => {
      state.mouseInRail = false;
      
      // Clear any existing hover timer
      clearTimeout(state.hoverTimer);
      state.hoverTimer = null;
      
      // Only set timer to hide drawer if we're not in drawer either
      if (!state.mouseInDrawer) {
        state.closeTimer = setTimeout(() => {
          // Double-check we're still not in rail or drawer before hiding
          if (!state.mouseInRail && !state.mouseInDrawer) {
            hideDrawer();
          }
        }, config.closeDelay);
      }
    });
    
    return rail;
  };
  
  /**
   * Create the drawer navigation component
   */
  const createDrawerNavigation = () => {
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
    
    // Use the component's native event system
    if (typeof drawer.on === 'function') {
      // Handle item selection
      drawer.on('change', (event) => {
        const id = event.id;
        
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
        state.mouseInDrawer = true;
        
        // Clear any hover and close timers
        clearTimeout(state.hoverTimer);
        clearTimeout(state.closeTimer);
        state.hoverTimer = null;
        state.closeTimer = null;
      });
      
      drawer.on('mouseleave', () => {
        state.mouseInDrawer = false;
        
        // Only set timer to hide drawer if we're not in rail
        if (!state.mouseInRail) {
          state.closeTimer = setTimeout(() => {
            // Double-check we're still not in drawer or rail before hiding
            if (!state.mouseInDrawer && !state.mouseInRail) {
              hideDrawer();
            }
          }, config.closeDelay);
        }
      });
    }
    
    return drawer;
  };
  
  /**
   * Show the drawer
   */
  const showDrawer = () => {
    if (!state.drawer) return;
    
    state.drawer.element.classList.remove('mtrl-nav--hidden');
    state.drawer.element.setAttribute('aria-hidden', 'false');
  };
  
  /**
   * Hide the drawer
   */
  const hideDrawer = () => {
    if (!state.drawer) return;
    
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
    // Create rail component
    state.rail = createRailNavigation();
    
    // Create drawer component
    state.drawer = createDrawerNavigation();
    
    // Set active section if specified
    if (options.activeSection && state.items[options.activeSection]) {
      state.activeSection = options.activeSection;
      
      if (state.rail) {
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
    // Clear timers
    clearTimeout(state.hoverTimer);
    clearTimeout(state.closeTimer);
    state.hoverTimer = null;
    state.closeTimer = null;
    
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
  };
  
  /**
   * Navigate to a specific section and subsection
   */
  const navigateTo = (section, subsection) => {
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
      state.rail.setActive(section);
    }
    
    // Update drawer content
    updateDrawerContent(section);
    
    // Update active subsection if specified
    if (subsection && state.drawer) {
      state.activeSubsection = subsection;
      state.drawer.setActive(subsection);
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