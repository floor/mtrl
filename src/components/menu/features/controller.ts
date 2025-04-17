// src/components/menu/features/controller.ts

import { MenuConfig, MenuContent, MenuItem, MenuDivider, MenuEvent, MenuSelectEvent } from '../types';
import { createPositioner } from './position';
import { createKeyboardNavigation } from './keyboard';

let ignoreNextDocumentClick = false;

/**
 * Adds controller functionality to the menu component
 * Manages state, rendering, positioning, and event handling
 * 
 * @param config - Menu configuration
 * @returns Component enhancer with menu controller functionality
 */
const withController = (config: MenuConfig) => component => {
  if (!component.element) {
    console.warn('Cannot initialize menu controller: missing element');
    return component;
  }

  // Initialize state
  const state = {
    visible: config.visible || false,
    items: config.items || [],
    position: config.position,
    selectedItemId: null as string | null,
    activeSubmenu: null as HTMLElement,
    activeSubmenuItem: null as HTMLElement,
    activeItemIndex: -1,
    submenuLevel: 0, // Track nesting level of submenus
    activeSubmenus: [] as Array<{
      element: HTMLElement, 
      menuItem: HTMLElement, 
      level: number,
      isOpening: boolean // Track if submenu is in opening transition
    }>,
    submenuTimer: null,
    hoverIntent: {
      timer: null,
      activeItem: null
    },
    component
  };

  // Create positioner
  const positioner = createPositioner(component, config);
  
  // Create keyboard navigation controller
  const keyboard = createKeyboardNavigation(component);

  // Create event helpers
  const eventHelpers = {
    triggerEvent(eventName: string, data: any = {}, originalEvent?: Event) {
      const eventData = {
        menu: state.component,
        ...data,
        originalEvent,
        preventDefault: () => { eventData.defaultPrevented = true; },
        defaultPrevented: false
      };
      
      component.emit(eventName, eventData);
      return eventData;
    }
  };

  /**
   * Gets the anchor element from config
   */
  const getAnchorElement = (): HTMLElement => {
    // First try to get the resolved anchor from the anchor feature
    if (component.anchor && typeof component.anchor.getAnchor === 'function') {
      return component.anchor.getAnchor();
    }

    // Fall back to config anchor for initial positioning
    const { anchor } = config;
    
    if (typeof anchor === 'string') {
      const element = document.querySelector(anchor);
      if (!element) {
        console.warn(`Menu anchor not found: ${anchor}`);
        return null;
      }
      return element as HTMLElement;
    }
    
    // Handle component with element property
    if (typeof anchor === 'object' && anchor !== null && 'element' in anchor) {
      return anchor.element;
    }
    
    // Handle direct HTML element
    return anchor as HTMLElement;
  };

  /**
   * Creates a DOM element for a menu item
   */
  const createMenuItem = (item: MenuItem, index: number): HTMLElement => {
    const itemElement = document.createElement('li');
    const itemClass = `${component.getClass('menu-item')}`;
    
    itemElement.className = itemClass;
    itemElement.setAttribute('role', 'menuitem');
    itemElement.setAttribute('tabindex', '-1'); // Set to -1 by default, will update when needed
    itemElement.setAttribute('data-id', item.id);
    itemElement.setAttribute('data-index', index.toString());
    
    if (item.disabled) {
      itemElement.classList.add(`${itemClass}--disabled`);
      itemElement.setAttribute('aria-disabled', 'true');
    } else {
      itemElement.setAttribute('aria-disabled', 'false');
    }
    
    if (state.selectedItemId && item.id === state.selectedItemId) {
      itemElement.classList.add(`${itemClass}--selected`);
      itemElement.setAttribute('aria-selected', 'true');
    } else {
      itemElement.setAttribute('aria-selected', 'false');
    }


    if (item.hasSubmenu) {
      itemElement.classList.add(`${itemClass}--submenu`);
      itemElement.setAttribute('aria-haspopup', 'true');
      itemElement.setAttribute('aria-expanded', 'false');
    }
    
    // Create content container for flexible layout
    const contentContainer = document.createElement('span');
    contentContainer.className = `${component.getClass('menu-item-content')}`;
    
    // Add icon if provided
    if (item.icon) {
      const iconElement = document.createElement('span');
      iconElement.className = `${component.getClass('menu-item-icon')}`;
      iconElement.innerHTML = item.icon;
      contentContainer.appendChild(iconElement);
    }
    
    // Add text
    const textElement = document.createElement('span');
    textElement.className = `${component.getClass('menu-item-text')}`;
    textElement.textContent = item.text;
    contentContainer.appendChild(textElement);
    
    // Add shortcut if provided
    if (item.shortcut) {
      const shortcutElement = document.createElement('span');
      shortcutElement.className = `${component.getClass('menu-item-shortcut')}`;
      shortcutElement.textContent = item.shortcut;
      contentContainer.appendChild(shortcutElement);
    }
    
    itemElement.appendChild(contentContainer);
    
    // Add event listeners
    if (!item.disabled) {
      // Mouse events
      itemElement.addEventListener('click', (e) => handleItemClick(e, item, index));
      
      // Additional keyboard event handler for accessibility
      itemElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleItemClick(e, item, index);
        }
      });
      
      // Focus handling - only set keyboard mode when focus comes from keyboard
      // We'll check if the focus is from a pointer event instead of setting keyboard
      // mode on all focus events
      itemElement.addEventListener('focus', (e) => {
        state.activeItemIndex = index;
        
        // Only enable keyboard mode if focus wasn't triggered by a pointer
        if (!state.pointerFocusActive) {
          keyboard.setKeyboardActive(true);
        }
      });
      
      // Track pointer-initiated focus
      itemElement.addEventListener('mousedown', () => {
        state.pointerFocusActive = true;
        // Reset after a short delay
        setTimeout(() => { state.pointerFocusActive = false; }, 100);
      });
      
      if (item.hasSubmenu && config.openSubmenuOnHover) {
        itemElement.addEventListener('mouseenter', () => handleSubmenuHover(item, index, itemElement));
        itemElement.addEventListener('mouseleave', handleSubmenuLeave);
      }
    }
    
    return itemElement;
  };

  /**
   * Creates a DOM element for a menu divider
   */
  const createDivider = (divider: MenuDivider, index: number): HTMLElement => {
    const dividerElement = document.createElement('li');
    dividerElement.className = `${component.getClass('menu-divider')}`;
    dividerElement.setAttribute('role', 'separator');
    dividerElement.setAttribute('data-index', index.toString());
    
    if (divider.id) {
      dividerElement.setAttribute('id', divider.id);
    }
    
    return dividerElement;
  };

  /**
   * Renders the menu items
   */
  const renderMenuItems = (): void => {
    const menuList = document.createElement('ul');
    menuList.className = `${component.getClass('menu-list')}`;
    menuList.setAttribute('role', 'menu');
    
    // Create items
    state.items.forEach((item, index) => {
      if ('type' in item && item.type === 'divider') {
        menuList.appendChild(createDivider(item, index));
      } else {
        menuList.appendChild(createMenuItem(item as MenuItem, index));
      }
    });
    
    // Clear and append
    component.element.innerHTML = '';
    component.element.appendChild(menuList);
  };

  /**
   * Clean up hover intent timer
   */
  const clearHoverIntent = () => {
    if (state.hoverIntent.timer) {
      clearTimeout(state.hoverIntent.timer);
      state.hoverIntent.timer = null;
      state.hoverIntent.activeItem = null;
    }
  };

  /**
   * Handles click on a menu item
   */
  const handleItemClick = (e: MouseEvent, item: MenuItem, index: number): void => {
    console.log('handleItemClick', e, item, index)
    e.preventDefault();
    e.stopPropagation();
    
    // Don't process if disabled
    if (item.disabled) return;
    
    if (item.hasSubmenu) {
      handleSubmenuClick(item, index, e.currentTarget as HTMLElement);
      return;
    }
    
    // Trigger select event
    const selectEvent = eventHelpers.triggerEvent('select', {
      item,
      itemId: item.id,
      itemData: item.data
    }, e) as MenuSelectEvent;
    
    // Close menu if needed
    if (config.closeOnSelect && !selectEvent.defaultPrevented) {
      closeMenu(e);
    }
  };

  /**
   * Handles click on a submenu item
   */
  const handleSubmenuClick = (item: MenuItem, index: number, itemElement: HTMLElement, viaKeyboard = false): void => {
    if (!item.submenu || !item.hasSubmenu) return;
    
    // Check if the submenu is already open
    const isOpen = itemElement.getAttribute('aria-expanded') === 'true';
    
    // Find if any submenu is currently in opening transition
    const anySubmenuTransitioning = state.activeSubmenus.some(s => s.isOpening);
    
    // Completely ignore clicks during any submenu transition
    if (anySubmenuTransitioning) {
      return;
    }
    
    if (isOpen) {
      // Close submenu - only if fully open
      // Find the closest submenu level
      const currentLevel = parseInt(
        itemElement.closest(`.${component.getClass('menu--submenu')}`)?.getAttribute('data-level') || '0',
        10
      );
      
      // Close this level + 1 and deeper
      closeSubmenuAtLevel(currentLevel + 1);
      
      // Reset expanded state
      itemElement.setAttribute('aria-expanded', 'false');
      
      // FIX: After clicking to close a submenu, reset keyboard mode
      // This ensures hover events will work again
      keyboard.setKeyboardActive(false);
    } else {
      // Open new submenu
      openSubmenu(item, index, itemElement, viaKeyboard);
    }
  };

  /**
   * Handles hover on a submenu item
   */
  const handleSubmenuHover = (item: MenuItem, index: number, itemElement: HTMLElement): void => {
    if (!config.openSubmenuOnHover || !item.hasSubmenu) return;
    
    // If keyboard navigation is active, don't open submenu on hover
    if (keyboard.isKeyboardActive()) return;
    
    // Clear any existing timers
    clearHoverIntent();
    clearSubmenuTimer();
    
    // Set hover intent
    state.hoverIntent.activeItem = itemElement;
    state.hoverIntent.timer = setTimeout(() => {
      const isCurrentlyHovered = itemElement.matches(':hover');
      if (isCurrentlyHovered) {
        // Only close and reopen if this is a different submenu item
        if (state.activeSubmenuItem !== itemElement) {
          openSubmenu(item, index, itemElement);
        }
      }
      state.hoverIntent.timer = null;
    }, 100);
  };

  /**
   * Handles mouse leave from submenu
   */
  const handleSubmenuLeave = (e: MouseEvent): void => {
    // If keyboard navigation is active, don't close submenu on mouse leave
    if (keyboard.isKeyboardActive()) return;
    
    // Clear hover intent
    clearHoverIntent();
    
    // Don't close immediately to allow moving to submenu
    clearSubmenuTimer();
    
    // Set a timer to close the submenu if not re-entered
    state.submenuTimer = setTimeout(() => {
      // Check if mouse is over the submenu or the parent menu item
      const submenuElement = state.activeSubmenu;
      const menuItemElement = state.activeSubmenuItem;
      
      if (submenuElement && menuItemElement) {
        const overSubmenu = submenuElement.matches(':hover');
        const overMenuItem = menuItemElement.matches(':hover');
        
        if (!overSubmenu && !overMenuItem) {
          closeSubmenuAtLevel(state.submenuLevel);
        }
      }
      
      state.submenuTimer = null;
    }, 300);
  };

  /**
   * Opens a submenu with proper animation and positioning
   */
  const openSubmenu = (item: MenuItem, index: number, itemElement: HTMLElement, viaKeyboard = false): void => {
    if (!item.submenu || !item.hasSubmenu) return;
    
    // If opened via keyboard, update the keyboard navigation state
    if (viaKeyboard) {
      keyboard.setKeyboardActive(true);
    }
    
    // Get current level of the submenu we're opening
    const currentLevel = itemElement.closest(`.${component.getClass('menu--submenu')}`) 
      ? parseInt(itemElement.closest(`.${component.getClass('menu--submenu')}`).getAttribute('data-level') || '0', 10) + 1
      : 1;

    // Close any deeper level submenus first, preserving the current level
    closeSubmenuAtLevel(currentLevel);
    
    // Check if this submenu is already in opening state - if so, do nothing
    const existingSubmenuIndex = state.activeSubmenus.findIndex(
      s => s.menuItem === itemElement && s.isOpening
    );
    if (existingSubmenuIndex >= 0) {
      return; // Already opening this submenu, don't restart the process
    }
    
    // Set expanded state
    itemElement.setAttribute('aria-expanded', 'true');
    
    // Create submenu element with proper classes and attributes
    const submenuElement = document.createElement('div');
    submenuElement.className = `${component.getClass('menu')} ${component.getClass('menu--submenu')}`;
    submenuElement.setAttribute('role', 'menu');
    submenuElement.setAttribute('tabindex', '-1');
    submenuElement.setAttribute('data-level', currentLevel.toString());
    submenuElement.setAttribute('data-parent-item', item.id);
    
    // Increase z-index for each level of submenu
    submenuElement.style.zIndex = `${1000 + (currentLevel * 10)}`;
    
    // Create submenu list
    const submenuList = document.createElement('ul');
    submenuList.className = `${component.getClass('menu-list')}`;
    
    // Create submenu items
    const submenuItems = [];
    item.submenu.forEach((subitem, subindex) => {
      if ('type' in subitem && subitem.type === 'divider') {
        submenuList.appendChild(createDivider(subitem, subindex));
      } else {
        const subitemElement = createMenuItem(subitem as MenuItem, subindex);
        submenuList.appendChild(subitemElement);
        if (!(subitem as MenuItem).disabled) {
          submenuItems.push(subitemElement);
        }
      }
    });
    
    submenuElement.appendChild(submenuList);
    
    // Add to DOM to enable measurement and transitions
    document.body.appendChild(submenuElement);
    
    // Position the submenu using our positioner with the current nesting level
    positioner.positionSubmenu(submenuElement, itemElement, currentLevel);
    
    // Setup keyboard navigation for submenu using the keyboard controller
    const keyboardActions = {
      closeMenu,
      closeSubmenuAtLevel,
      findItemById: (id: string) => findItemById(id),
      handleSubmenuClick,
      handleNestedSubmenuClick
    };
    
    // Use the keyboard controller to set up keyboard handlers
    keyboard.setupKeyboardHandlers(submenuElement, state, keyboardActions);
    
    // Add mouseenter event to prevent closing
    submenuElement.addEventListener('mouseenter', () => {
      if (!keyboard.isKeyboardActive()) {
        clearSubmenuTimer();
      }
    });
    
    // Add mouseleave event to handle closing
    submenuElement.addEventListener('mouseleave', (e) => {
      if (!keyboard.isKeyboardActive()) {
        handleSubmenuLeave(e);
      }
    });
    
    // Setup submenu event handlers for nested submenus
    const setupNestedSubmenuHandlers = (parent: HTMLElement) => {
      const submenuItems = parent.querySelectorAll(`.${component.getClass('menu-item--submenu')}`) as NodeListOf<HTMLElement>;
      
      submenuItems.forEach((menuItem) => {
        const itemIndex = parseInt(menuItem.getAttribute('data-index'), 10);
        const menuItemData = item.submenu[itemIndex] as MenuItem;
        
        if (menuItemData && menuItemData.hasSubmenu) {
          // Add hover handler for nested submenus
          if (config.openSubmenuOnHover) {
            menuItem.addEventListener('mouseenter', () => {
              handleNestedSubmenuHover(menuItemData, itemIndex, menuItem);
            });
            menuItem.addEventListener('mouseleave', handleSubmenuLeave);
          }
          
          // Add click handler for nested submenus
          menuItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNestedSubmenuClick(menuItemData, itemIndex, menuItem, false);
          });
        }
      });
    };
    
    // Setup handlers for any nested submenus
    setupNestedSubmenuHandlers(submenuElement);
    
    // Update state with active submenu
    state.activeSubmenu = submenuElement;
    state.activeSubmenuItem = itemElement;
    
    // Add to active submenus array to maintain hierarchy
    state.activeSubmenus.push({
      element: submenuElement, 
      menuItem: itemElement, 
      level: currentLevel,
      isOpening: true // Mark as in opening transition
    });
    
    // Update submenu level
    state.submenuLevel = currentLevel;
    
    // Add document events for this submenu
    document.addEventListener('click', handleDocumentClickForSubmenu);
    window.addEventListener('resize', handleWindowResizeForSubmenu, { passive: true });
    window.addEventListener('scroll', handleWindowScrollForSubmenu, { passive: true });
    
    // Make visible with animation
    requestAnimationFrame(() => {
      submenuElement.classList.add(`${component.getClass('menu--visible')}`);
      
      // Wait for transition to complete before marking as fully opened
      // This should match your CSS transition duration
      setTimeout(() => {
        // Find this submenu in the active submenus array and update its state
        const index = state.activeSubmenus.findIndex(s => s.element === submenuElement);
        if (index !== -1) {
          state.activeSubmenus[index].isOpening = false;
        }
      }, 300); // Adjust to match your transition duration
      
      // If opened via keyboard, focus the first item in the submenu
      if (viaKeyboard && submenuItems.length > 0) {
        submenuItems[0].setAttribute('tabindex', '0');
        
        // Set other items to -1
        for (let i = 1; i < submenuItems.length; i++) {
          submenuItems[i].setAttribute('tabindex', '-1');
        }
        
        // Focus with a short delay to allow animation to start
        setTimeout(() => {
          submenuItems[0].focus();
        }, 50);
      }
    });
  };

  /**
   * Handles hover on a nested submenu item
   */
  const handleNestedSubmenuHover = (item: MenuItem, index: number, itemElement: HTMLElement): void => {
    if (!config.openSubmenuOnHover || !item.hasSubmenu || keyboard.isKeyboardActive()) return;
    
    // Clear any existing timers
    clearHoverIntent();
    clearSubmenuTimer();
    
    // Set hover intent with a slightly longer delay for nested menus
    state.hoverIntent.activeItem = itemElement;
    state.hoverIntent.timer = setTimeout(() => {
      const isCurrentlyHovered = itemElement.matches(':hover');
      if (isCurrentlyHovered) {
        // Find the closest submenu level of this item
        const currentLevel = parseInt(
          itemElement.closest(`.${component.getClass('menu--submenu')}`)?.getAttribute('data-level') || '1',
          10
        );
        
        // Open the nested submenu (will handle closing deeper levels properly)
        handleNestedSubmenuClick(item, index, itemElement, false);
      }
      state.hoverIntent.timer = null;
    }, 120); // Slightly longer delay for nested submenus
  };

  /**
   * Handles click on a nested submenu item
   */
  const handleNestedSubmenuClick = (item: MenuItem, index: number, itemElement: HTMLElement, viaKeyboard = false): void => {
    if (!item.submenu || !item.hasSubmenu) return;
    
    // Check if the submenu is already open
    const isOpen = itemElement.getAttribute('aria-expanded') === 'true';
    
    // Find if any submenu is currently in opening transition
    const anySubmenuTransitioning = state.activeSubmenus.some(s => s.isOpening);
    
    // Completely ignore clicks during any submenu transition
    if (anySubmenuTransitioning) {
      return;
    }
    
    if (isOpen) {
      // Find the closest submenu level
      const currentLevel = parseInt(
        itemElement.closest(`.${component.getClass('menu--submenu')}`)?.getAttribute('data-level') || '1',
        10
      );
      
      // Close submenus at and deeper than the next level
      closeSubmenuAtLevel(currentLevel + 1);
      
      // FIX: Also reset keyboard mode when closing via click
      keyboard.setKeyboardActive(false);
    } else {
      // Open the nested submenu
      openSubmenu(item, index, itemElement, viaKeyboard);
    }
  };

  /**
   * Clear submenu close timer
   */
  const clearSubmenuTimer = () => {
    if (state.submenuTimer) {
      clearTimeout(state.submenuTimer);
      state.submenuTimer = null;
    }
  };

  /**
   * Closes submenus at or deeper than the specified level
   * @param level - The level to start closing from
   */
  const closeSubmenuAtLevel = (level: number): void => {
    // Clear any hover intent or submenu timers
    clearHoverIntent();
    clearSubmenuTimer();
    
    // Find submenus at or deeper than the specified level
    const submenusCopy = [...state.activeSubmenus];
    const submenuIndicesToRemove = [];
    
    // Identify which submenus to remove, working from deepest level first
    for (let i = submenusCopy.length - 1; i >= 0; i--) {
      if (submenusCopy[i].level >= level) {
        const submenuToClose = submenusCopy[i];
        
        // Set aria-expanded attribute to false on the parent menu item
        if (submenuToClose.menuItem) {
          submenuToClose.menuItem.setAttribute('aria-expanded', 'false');
        }
        
        // Hide with animation
        submenuToClose.element.classList.remove(`${component.getClass('menu--visible')}`);
        
        // Schedule for removal
        setTimeout(() => {
          if (submenuToClose.element.parentNode) {
            submenuToClose.element.parentNode.removeChild(submenuToClose.element);
          }
        }, 200);
        
        // Mark for removal from state
        submenuIndicesToRemove.push(i);
      }
    }
    
    // Remove the closed submenus from state
    submenuIndicesToRemove.forEach(index => {
      state.activeSubmenus.splice(index, 1);
    });
    
    // Update active submenu references based on what's left
    if (state.activeSubmenus.length > 0) {
      const deepestRemaining = state.activeSubmenus[state.activeSubmenus.length - 1];
      state.activeSubmenu = deepestRemaining.element;
      state.activeSubmenuItem = deepestRemaining.menuItem;
      state.submenuLevel = deepestRemaining.level;
    } else {
      state.activeSubmenu = null;
      state.activeSubmenuItem = null;
      state.submenuLevel = 0;
    }
    
    // FIX: Reset keyboard mode when closing a submenu level
    // This ensures hover events will work again
    keyboard.setKeyboardActive(false);
  };

  /**
   * Closes all submenus
   */
  const closeSubmenu = (): void => {
    // Clear timers
    clearHoverIntent();
    clearSubmenuTimer();
    
    if (state.activeSubmenus.length === 0) return;
    
    // Close all active submenus
    [...state.activeSubmenus].forEach(submenu => {
      // Remove expanded state from parent item
      if (submenu.menuItem) {
        submenu.menuItem.setAttribute('aria-expanded', 'false');
      }
      
      // Remove submenu element with animation
      submenu.element.classList.remove(`${component.getClass('menu--visible')}`);
      
      // Remove after animation
      setTimeout(() => {
        if (submenu.element.parentNode) {
          submenu.element.parentNode.removeChild(submenu.element);
        }
      }, 200);
    });
    
    // Clear state
    state.activeSubmenu = null;
    state.activeSubmenuItem = null;
    state.activeSubmenus = [];
    state.submenuLevel = 0;
    
    // Remove document events
    document.removeEventListener('click', handleDocumentClickForSubmenu);
    window.removeEventListener('resize', handleWindowResizeForSubmenu);
    window.removeEventListener('scroll', handleWindowScrollForSubmenu);
    
    // FIX: Reset keyboard mode when closing all submenus
    keyboard.setKeyboardActive(false);
  };

  /**
   * Handles document click for submenu
   */
  const handleDocumentClickForSubmenu = (e: MouseEvent): void => {
    if (!state.activeSubmenu) return;
    
    const submenuElement = state.activeSubmenu;
    const menuItemElement = state.activeSubmenuItem;
    
    // Check if click was inside submenu or parent menu item
    if (submenuElement.contains(e.target as Node) || 
        (menuItemElement && menuItemElement.contains(e.target as Node))) {
      return;
    }
    
    // Close submenu if clicked outside
    closeSubmenu();
  };

  /**
   * Handles window resize for submenu
   */
  const handleWindowResizeForSubmenu = (): void => {
    // Reposition open submenu on resize
    if (state.activeSubmenu && state.activeSubmenuItem) {
      positioner.positionSubmenu(state.activeSubmenu, state.activeSubmenuItem, state.submenuLevel);
    }
  };

  /**
   * Handles window scroll for submenu
   * Repositions the submenu to stay attached to its parent during scrolling
   */
  const handleWindowScrollForSubmenu = (): void => {
    // Use requestAnimationFrame to optimize scroll performance
    window.requestAnimationFrame(() => {
      // Only reposition if we have an active submenu
      if (state.activeSubmenu && state.activeSubmenuItem) {
        positioner.positionSubmenu(state.activeSubmenu, state.activeSubmenuItem, state.submenuLevel);
      }
    });
  };

  /**
   * Opens the menu
   * @param {Event} [event] - Optional event that triggered the open
   * @param {'mouse'|'keyboard'} [interactionType='mouse'] - Type of interaction that triggered the open
   */
  const openMenu = (event?: Event, interactionType: 'mouse' | 'keyboard' = 'mouse'): void => {
    if (state.visible) return;
    
    // Set keyboard navigation state based on interaction type
    keyboard.setKeyboardActive(interactionType === 'keyboard');
    
    // Track pointer-initiated focus
    state.pointerFocusActive = interactionType === 'mouse';
    
    // Update state
    state.visible = true;
    
    // First, remove any existing document click listener
    document.removeEventListener('click', handleDocumentClick);
    
    // Step 1: Add the menu to the DOM if it's not already there with initial hidden state
    if (!component.element.parentNode) {
      // Apply explicit initial styling to ensure it doesn't flash
      component.element.classList.remove(`${component.getClass('menu--visible')}`);
      component.element.setAttribute('aria-hidden', 'true');
      component.element.style.transform = 'scaleY(0)';
      component.element.style.opacity = '0';
      
      // Add to DOM
      document.body.appendChild(component.element);
    }
    
    // Step 2: Position the menu (will be invisible)
    const anchorElement = getAnchorElement();
    if (anchorElement) {
      positioner.positionMenu(anchorElement);
    }
    
    // Step 3: Use a small delay to ensure DOM operations are complete
    setTimeout(() => {
      // Set attributes for accessibility
      component.element.setAttribute('aria-hidden', 'false');
      
      // Remove the inline styles we added
      component.element.style.transform = '';
      component.element.style.opacity = '';
      
      // Force a reflow before adding the visible class
      void component.element.getBoundingClientRect();
      
      // Add visible class to start the CSS transition
      component.element.classList.add(`${component.getClass('menu--visible')}`);
      
      // Step 4: Focus based on interaction type (after animation starts)
      setTimeout(() => {
        keyboard.handleInitialFocus(component.element, interactionType);
      }, 100);
      
      // Add the document click handler on the next event loop 
      // after the current click is fully processed
      setTimeout(() => {
        if (config.closeOnClickOutside && state.visible) {
          document.addEventListener('click', handleDocumentClick);
        }
        
        // Add other document events normally
        if (config.closeOnEscape) {
          document.addEventListener('keydown', handleDocumentKeydown);
        }
        window.addEventListener('resize', handleWindowResize, { passive: true });
        window.addEventListener('scroll', handleWindowScroll, { passive: true });
      }, 0);
    }, 20); // Short delay for browser to process
    
    // Trigger event
    eventHelpers.triggerEvent('open', {}, event);
  };

  /**
   * Closes the menu
   * @param {Event} [event] - Optional event that triggered the close
   * @param {boolean} [restoreFocus=true] - Whether to restore focus to the anchor element
   * @param {boolean} [skipAnimation=false] - Whether to skip animation (for focus changes)
   */
  const closeMenu = (event?: Event, restoreFocus: boolean = true, skipAnimation: boolean = false): void => {
    if (!state.visible) return;
    
    // Check if we're in a tab navigation - if so, don't restore focus
    const isTabNavigation = keyboard.isTabNavigationActive() || document.body.hasAttribute('data-menu-tab-navigation');
    if (isTabNavigation) {
      restoreFocus = false;
    }
    
    // Reset keyboard navigation state on close
    keyboard.setKeyboardActive(false);
    
    // Close any open submenu first
    closeSubmenu();
    
    // Update state
    state.visible = false;
    
    // Set attributes
    component.element.setAttribute('aria-hidden', 'true');
    component.element.classList.remove(`${component.getClass('menu--visible')}`);
    
    // Store anchor reference before potentially removing the menu
    const anchorElement = getAnchorElement();
    
    // Remove document events
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleDocumentKeydown);
    window.removeEventListener('resize', handleWindowResize);
    window.removeEventListener('scroll', handleWindowScroll);
    
    // Trigger event with added data
    eventHelpers.triggerEvent('close', {
      isFocusRelated: event instanceof FocusEvent,
      shouldRestoreFocus: restoreFocus,
      isTabNavigation: isTabNavigation || event?.key === 'Tab'
    }, event);
    
    // Determine animation duration - for tab navigation we want to close immediately
    const animationDuration = skipAnimation ? 0 : 300;
    
    // Remove from DOM after animation completes (or immediately if skipAnimation)
    setTimeout(() => {
      if (component.element.parentNode && !state.visible) {
        component.element.parentNode.removeChild(component.element);
        
        // Only restore focus if explicitly requested AND not in tab navigation
        if (restoreFocus && anchorElement && !isTabNavigation && event?.type !== 'click') {
          // Additional check to make sure we're not in an ongoing tab navigation
          if (!document.body.hasAttribute('data-menu-tab-navigation')) {
            requestAnimationFrame(() => {
              anchorElement.focus();
            });
          }
        }
      }
    }, animationDuration);
  };

  /**
   * Toggles the menu
   */
  const toggleMenu = (event?: Event, interactionType: 'mouse' | 'keyboard' = 'mouse'): void => {
    if (state.visible) {
      closeMenu(event);
    } else {
      // Determine interaction type from event
      if (event) {
        if (event instanceof KeyboardEvent) {
          interactionType = 'keyboard';
        } else if (event instanceof MouseEvent) {
          interactionType = 'mouse';
        }
      }
      openMenu(event, interactionType);
    }
  };

  /**
   * Find a menu item by its ID in the items array
   */
  const findItemById = (id: string): MenuItem | null => {
    // Search in top-level items
    for (const item of state.items) {
      if ('id' in item && item.id === id) {
        return item as MenuItem;
      }
      
      // Search in submenu items
      if ('submenu' in item && Array.isArray((item as MenuItem).submenu)) {
        for (const subItem of (item as MenuItem).submenu) {
          if ('id' in subItem && subItem.id === id) {
            return subItem as MenuItem;
          }
        }
      }
    }
    
    return null;
  };

  /**
   * Updates the selected state of menu items
   * @param itemId - The ID of the item to mark as selected, or null to clear selection
   */
  const updateSelectedState = (itemId: string | null): void => {
    if (!component.element) return;
    
    // Get all menu items
    const menuItems = component.element.querySelectorAll(`.${component.getClass('menu-item')}`) as NodeListOf<HTMLElement>;
    
    // Update selected state for each item
    menuItems.forEach(item => {
      const currentItemId = item.getAttribute('data-id');
      
      if (currentItemId === itemId) {
        item.classList.add(`${component.getClass('menu-item--selected')}`);
        item.setAttribute('aria-selected', 'true');
      } else {
        item.classList.remove(`${component.getClass('menu-item--selected')}`);
        item.setAttribute('aria-selected', 'false');
      }
    });
    
    // Also update state
    state.selectedItemId = itemId;
  };

  /**
   * Handles document click
   */
  const handleDocumentClick = (e: MouseEvent): void => {
    // If we should ignore this click (happens right after opening), reset the flag and return
    if (ignoreNextDocumentClick) {
      ignoreNextDocumentClick = false;
      return;
    }
    
    // Don't close if clicked inside menu
    if (component.element.contains(e.target as Node)) {
      return;
    }
    
    // Check if clicked on anchor element
    const anchor = getAnchorElement();
    if (anchor && anchor.contains(e.target as Node)) {
      return;
    }
    
    // Close menu
    closeMenu(e);
  };

  /**
   * Handles document keydown
   */
  const handleDocumentKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      // When closing with Escape, always restore focus
      closeMenu(e, true);
    }
  };

  /**
   * Handles window resize
   */
  const handleWindowResize = (): void => {
    if (state.visible) {
      const anchorElement = getAnchorElement();
      if (anchorElement) {
        positioner.positionMenu(anchorElement);
      }
    }
  };

  /**
   * Handles window scroll
   * Repositions the menu to stay attached to its anchor during scrolling
   */
  const handleWindowScroll = (): void => {
    if (state.visible) {
      // Use requestAnimationFrame to optimize scroll performance
      window.requestAnimationFrame(() => {
        // Reposition the main menu to stay attached to anchor when scrolling
        const anchorElement = getAnchorElement();
        if (anchorElement) {
          positioner.positionMenu(anchorElement);
        }
        
        // Also reposition any open submenu relative to its parent menu item
        if (state.activeSubmenu && state.activeSubmenuItem) {
          positioner.positionSubmenu(state.activeSubmenu, state.activeSubmenuItem, state.submenuLevel);
        }
      });
    }
  };

  /**
   * Sets up the menu
   */
  const initMenu = () => {
    // Initialize the state for pointer focus tracking
    state.pointerFocusActive = false;
    
    // Set up menu structure
    renderMenuItems();
    
    // Set up keyboard navigation for the main menu
    const keyboardActions = {
      closeMenu,
      closeSubmenuAtLevel,
      findItemById,
      handleSubmenuClick,
      handleNestedSubmenuClick
    };
    
    // Use the keyboard controller to set up keyboard handlers
    keyboard.setupKeyboardHandlers(component.element, state, keyboardActions);
    
    // Position if visible
    if (state.visible) {
      const anchorElement = getAnchorElement();
      if (anchorElement) {
        positioner.positionMenu(anchorElement);
      }
      
      // Show immediately
      component.element.classList.add(`${component.getClass('menu--visible')}`);
      
      // Set up document events
      if (config.closeOnClickOutside) {
        document.addEventListener('click', handleDocumentClick);
      }
      if (config.closeOnEscape) {
        document.addEventListener('keydown', handleDocumentKeydown);
      }
      window.addEventListener('resize', handleWindowResize);
      window.addEventListener('scroll', handleWindowScroll);
    }
  };

  // Initialize after DOM is ready
  setTimeout(initMenu, 0);

  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      // Clean up timers
      clearHoverIntent();
      clearSubmenuTimer();
      
      // Clean up document events
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleDocumentKeydown);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('scroll', handleWindowScroll);
      
      // Clean up submenu events
      document.removeEventListener('click', handleDocumentClickForSubmenu);
      window.removeEventListener('resize', handleWindowResizeForSubmenu);
      window.removeEventListener('scroll', handleWindowScrollForSubmenu);
      
      // Clean up submenu element
      if (state.activeSubmenus.length > 0) {
        state.activeSubmenus.forEach(submenu => {
          if (submenu.element.parentNode) {
            submenu.element.parentNode.removeChild(submenu.element);
          }
        });
      }
      
      originalDestroy();
    };
  }

  // Return enhanced component
  return {
    ...component,
    menu: {
      open: (event, interactionType = 'mouse') => {
        openMenu(event, interactionType);
        return component;
      },
      
      close: (event, restoreFocus = true, skipAnimation = false) => {
        closeMenu(event, restoreFocus, skipAnimation);
        return component;
      },
      
      toggle: (event, interactionType = 'mouse') => {
        toggleMenu(event, interactionType);
        return component;
      },
      
      isOpen: () => state.visible,
      
      setItems: (items) => {
        state.items = items;
        renderMenuItems();
        return component;
      },
      
      getItems: () => state.items,
      
      setPosition: (position) => {
        state.position = position;
        if (state.visible) {
          const anchorElement = getAnchorElement();
          if (anchorElement) {
            positioner.positionMenu(anchorElement);
          }
        }
        return component;
      },
      
      getPosition: () => state.position,

      setSelected: (itemId: string | null) => {
        updateSelectedState(itemId);
        return component;
      },
    
      getSelected: () => state.selectedItemId
    }
  };
};

export default withController;