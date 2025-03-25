// src/components/navigation/system.ts

import createNavigation from './navigation';
import { 
  isMobileDevice, 
  hasTouchSupport, 
  TOUCH_CONFIG,
  TOUCH_TARGETS,
  normalizeEvent 
} from '../../core/utils/mobile';

/**
 * Creates a complete navigation system with synchronized rail and drawer components
 * 
 * @param {Object} options - System configuration options
 * @returns {Object} Navigation system API
 */
export const createNavigationSystem = (options = {}) => {
  // Determine mobile configuration
  const mobileConfig = {
    breakpoint: options.breakpoint || 960,
    lockBodyScroll: options.lockBodyScroll !== false,
    hideOnClickOutside: options.hideOnClickOutside !== false,
    enableSwipeGestures: options.enableSwipeGestures !== false,
    optimizeForTouch: options.optimizeForTouch !== false,
    overlayClass: options.overlayClass || 'mtrl-nav-overlay',
    closeButtonClass: options.closeButtonClass || 'mtrl-nav-close-btn',
    bodyLockClass: options.bodyLockClass || 'mtrl-body-drawer-open'
  };

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
    processingChange: false,
    isMobile: false,
    overlayElement: null,
    closeButtonElement: null,
    resizeObserver: null,
    outsideClickHandler: null,
    outsideClickHandlerSet: false
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
      console.log('rail.on change', event)
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
   * Checks and updates the mobile state
   */
  const checkMobileState = () => {
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
      if (system.onViewChange) {
        system.onViewChange({
          mobile: state.isMobile,
          previousMobile: prevState,
          width: window.innerWidth
        });
      }
    }
  };
  
  /**
   * Creates and appends overlay element for mobile
   */
  const createOverlay = () => {
    if (state.overlayElement) return state.overlayElement;
    
    state.overlayElement = document.createElement('div');
    state.overlayElement.className = mobileConfig.overlayClass;
    state.overlayElement.setAttribute('aria-hidden', 'true');
    document.body.appendChild(state.overlayElement);
    
    state.overlayElement.addEventListener('click', (event) => {
      if (event.target === state.overlayElement) {
        hideDrawer();
      }
    });
    
    return state.overlayElement;
  };
  
  /**
   * Creates and adds close button to the drawer
   */
  const createCloseButton = () => {
    if (!state.drawer || state.closeButtonElement) return null;
    
    state.closeButtonElement = document.createElement('button');
    state.closeButtonElement.className = mobileConfig.closeButtonClass;
    state.closeButtonElement.setAttribute('aria-label', 'Close navigation');
    state.closeButtonElement.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    
    // Handle click event
    state.closeButtonElement.addEventListener('click', () => {
      hideDrawer();
    });
    
    // Apply touch-friendly styles if needed
    if (hasTouchSupport() && mobileConfig.optimizeForTouch) {
      state.closeButtonElement.style.minWidth = `${TOUCH_TARGETS.COMFORTABLE}px`;
      state.closeButtonElement.style.minHeight = `${TOUCH_TARGETS.COMFORTABLE}px`;
      
      // Add touch feedback
      state.closeButtonElement.addEventListener('touchstart', () => {
        state.closeButtonElement.classList.add('active');
      }, { passive: true });
      
      state.closeButtonElement.addEventListener('touchend', () => {
        setTimeout(() => {
          state.closeButtonElement.classList.remove('active');
        }, TOUCH_CONFIG.FEEDBACK_DURATION);
      }, { passive: true });
    }
    
    state.drawer.element.appendChild(state.closeButtonElement);
    return state.closeButtonElement;
  };
  
  /**
   * Sets up mobile mode features
   */
  const setupMobileMode = () => {
    const drawer = state.drawer;
    const rail = state.rail;
    
    if (!drawer || !rail) return;
    
    // Create mobile UI elements
    createOverlay();
    createCloseButton();
    
    // Setup outside click handling
    setupOutsideClickHandling();
    
    // Setup touch gestures if enabled
    if (mobileConfig.enableSwipeGestures && hasTouchSupport()) {
      setupTouchGestures();
    }
    
    // Hide drawer initially in mobile mode
    hideDrawer();
  };
  
  /**
   * Tears down mobile-specific features
   */
  const teardownMobileMode = () => {
    // Hide overlay
    if (state.overlayElement) {
      state.overlayElement.classList.remove('active');
      state.overlayElement.setAttribute('aria-hidden', 'true');
    }
    
    // Hide close button
    if (state.closeButtonElement) {
      state.closeButtonElement.style.display = 'none';
    }
    
    // Remove body scroll lock if applied
    document.body.classList.remove(mobileConfig.bodyLockClass);
  };
  
  /**
   * Sets up outside click handling for mobile
   */
  const setupOutsideClickHandling = () => {
    if (!mobileConfig.hideOnClickOutside) return;
    
    // Only set up once
    if (state.outsideClickHandlerSet) return;
    state.outsideClickHandlerSet = true;
    
    // Use either click or touchend event depending on device capability
    const eventType = hasTouchSupport() ? 'touchend' : 'click';
    
    // The handler function
    const handleOutsideClick = (event) => {
      if (!state.isMobile || !isDrawerVisible()) return;
      
      const normalizedEvent = normalizeEvent(event);
      const target = normalizedEvent.target as HTMLElement;
      
      // Don't close if clicking on drawer, rail, or excluded elements
      if (state.drawer.element.contains(target) || 
          state.rail.element.contains(target)) {
        return;
      }
      
      // Close drawer - it's an outside click/touch
      hideDrawer();
    };
    
    // Store handler for cleanup
    state.outsideClickHandler = handleOutsideClick;
    
    // Add listener
    document.addEventListener(eventType, handleOutsideClick,
      hasTouchSupport() ? { passive: true } : false);
  };
  
  /**
   * Sets up touch gestures for mobile
   */
  const setupTouchGestures = () => {
    const drawer = state.drawer;
    const rail = state.rail;
    
    if (!drawer || !rail) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    
    // Rail swipe right to open drawer
    rail.element.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });
    
    rail.element.addEventListener('touchmove', (event) => {
      if (!state.isMobile || isDrawerVisible()) return;
      
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      
      // Only consider horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) && 
          deltaX > TOUCH_CONFIG.SWIPE_THRESHOLD) {
        showDrawer();
      }
    }, { passive: true });
    
    // Drawer swipe left to close
    drawer.element.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }, { passive: true });
    
    // Use touchmove with transform for visual feedback
    drawer.element.addEventListener('touchmove', (event) => {
      if (!state.isMobile || !isDrawerVisible()) return;
      
      const touch = event.touches[0];
      const deltaX = touch.clientX - touchStartX;
      
      // Only apply transform for leftward swipes
      if (deltaX < 0) {
        // Apply transform with resistance
        drawer.element.style.transform = `translateX(${deltaX / 2}px)`;
        
        // Close if threshold reached
        if (deltaX < -TOUCH_CONFIG.SWIPE_THRESHOLD) {
          hideDrawer();
        }
      }
    }, { passive: true });
    
    // Reset transforms when touch ends
    drawer.element.addEventListener('touchend', () => {
      if (drawer.element.style.transform) {
        drawer.element.style.transition = 'transform 0.2s ease';
        drawer.element.style.transform = '';
        
        setTimeout(() => {
          drawer.element.style.transition = '';
        }, 200);
      }
    }, { passive: true });
  };
  
  /**
   * Show the drawer with mobile-specific behaviors
   */
  const showDrawer = () => {
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
   * Hide the drawer with mobile-specific behaviors
   */
  const hideDrawer = () => {
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
    
    // Set active section if specified
    if (options.activeSection && state.items[options.activeSection]) {
      state.activeSection = options.activeSection;
      
      if (state.rail) {
        state.rail.setActive(options.activeSection);
      }
      
      // Update drawer content without showing it
      updateDrawerContent(options.activeSection);
      
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
  
  /**
   * Clean up resources
   */
  const cleanup = () => {
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
      const eventType = hasTouchSupport() ? 'touchend' : 'click';
      document.removeEventListener(eventType, state.outsideClickHandler);
    }
    
    // Clean up overlay
    if (state.overlayElement && state.overlayElement.parentNode) {
      state.overlayElement.parentNode.removeChild(state.overlayElement);
      state.overlayElement = null;
    }
    
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
    state.isMobile = false;
  };
  
  /**
   * Navigate to a specific section and subsection
   */
  const navigateTo = (section, subsection, silent) => {
    console.error('navigateTo', section, subsection, silent)
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
    
    // Update drawer content
    // updateDrawerContent(section);
    
    // Update active subsection if specified
    if (subsection && state.drawer) {
      state.activeSubsection = subsection;
      state.drawer.setActive(subsection, silent);
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
      Object.assign(options, newConfig);
      return system;
    },
    
    // State processing management
    setProcessingChange: (isProcessing) => {
      state.processingChange = isProcessing;
    },
    
    isProcessingChange: () => state.processingChange,
    
    // Mobile-specific methods
    isMobile: () => state.isMobile,
    checkMobileState,
    
    // Event handlers (to be set by user)
    onSectionChange: null,
    onItemSelect: null,
    onViewChange: null
  };
  
  // Return the uninitialized system
  return system;
};

export default createNavigationSystem;