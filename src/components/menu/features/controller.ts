// src/components/menu/features/controller.ts

import { MenuConfig, MenuContent, MenuItem, MenuDivider, MenuEvent, MenuSelectEvent } from '../types';

/**
 * Adds controller functionality to the menu component
 * Manages state, rendering, positioning, and event handling
 * 
 * @param config - Menu configuration
 * @returns Component enhancer with menu controller functionality
 */
export const withController = (config: MenuConfig) => component => {
  if (!component.element) {
    console.warn('Cannot initialize menu controller: missing element');
    return component;
  }

  // Initialize state
  const state = {
    visible: config.visible || false,
    items: config.items || [],
    placement: config.placement,
    activeSubmenu: null,
    activeSubmenuItem: null,
    activeItemIndex: -1,
    submenuTimer: null,
    hoverIntent: {
      timer: null,
      activeItem: null
    },
    component
  };

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
      
      // Focus and blur events for proper focus styling
      itemElement.addEventListener('focus', () => {
        state.activeItemIndex = index;
      });
      
      // Additional keyboard event handler for accessibility
      itemElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleItemClick(e, item, index);
        }
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
   * Positions the menu relative to its anchor
   * Ensures the menu maintains proper spacing from viewport edges
   */
  const positionMenu = (): void => {
    const anchor = getAnchorElement();
    if (!anchor) return;
    
    const menuElement = component.element;
    const anchorRect = anchor.getBoundingClientRect();
    const { placement } = state;
    const offset = config.offset !== undefined ? config.offset : 0;
    
    // Reset styles for measurement
    menuElement.style.top = '0';
    menuElement.style.left = '0';
    menuElement.style.right = 'auto';
    menuElement.style.bottom = 'auto';
    
    // Clear any previously set max-height
    menuElement.style.maxHeight = '';
    
    // Take measurements
    const menuRect = menuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate position based on placement
    let top = 0;
    let left = 0;
    let calculatedPlacement = placement;
    
    // First determine correct position based on original placement
    switch (placement) {
      case 'top-start':
      case 'top':
      case 'top-end':
        // Check if enough space above
        if (anchorRect.top < menuRect.height + offset + 16) {
          // Not enough space above, flip to bottom
          calculatedPlacement = placement.replace('top', 'bottom');
        }
        break;
      
      case 'bottom-start':
      case 'bottom':
      case 'bottom-end':
        // Check if enough space below
        if (anchorRect.bottom + menuRect.height + offset + 16 > viewportHeight) {
          // Not enough space below, check if more space above
          if (anchorRect.top > (viewportHeight - anchorRect.bottom)) {
            // More space above, flip to top
            calculatedPlacement = placement.replace('bottom', 'top');
          }
        }
        break;
    }
    
    // Now position based on the potentially flipped placement
    switch (calculatedPlacement) {
      case 'top-start':
        top = anchorRect.top - menuRect.height - offset;
        left = anchorRect.left;
        break;
      case 'top':
        top = anchorRect.top - menuRect.height - offset;
        left = anchorRect.left + (anchorRect.width / 2) - (menuRect.width / 2);
        break;
      case 'top-end':
        top = anchorRect.top - menuRect.height - offset;
        left = anchorRect.right - menuRect.width;
        break;
      case 'right-start':
        top = anchorRect.top;
        left = anchorRect.right + offset;
        break;
      case 'right':
        top = anchorRect.top + (anchorRect.height / 2) - (menuRect.height / 2);
        left = anchorRect.right + offset;
        break;
      case 'right-end':
        top = anchorRect.bottom - menuRect.height;
        left = anchorRect.right + offset;
        break;
      case 'bottom-start':
        top = anchorRect.bottom + offset;
        left = anchorRect.left;
        break;
      case 'bottom':
        top = anchorRect.bottom + offset;
        left = anchorRect.left + (anchorRect.width / 2) - (menuRect.width / 2);
        break;
      case 'bottom-end':
        top = anchorRect.bottom + offset;
        left = anchorRect.right - menuRect.width;
        break;
      case 'left-start':
        top = anchorRect.top;
        left = anchorRect.left - menuRect.width - offset;
        break;
      case 'left':
        top = anchorRect.top + (anchorRect.height / 2) - (menuRect.height / 2);
        left = anchorRect.left - menuRect.width - offset;
        break;
      case 'left-end':
        top = anchorRect.bottom - menuRect.height;
        left = anchorRect.left - menuRect.width - offset;
        break;
    }
    
    // Ensure the menu has proper spacing from viewport edges
    
    // Top edge spacing
    const minTopSpacing = 16; // Minimum distance from top of viewport
    if (top < minTopSpacing) {
      top = minTopSpacing;
    }
    
    // Bottom edge spacing
    const viewportBottomMargin = 16; // Minimum space from bottom of viewport
    const bottomEdge = top + menuRect.height;
    
    if (bottomEdge > viewportHeight - viewportBottomMargin) {
      // If menu would extend beyond bottom with margin, adjust maxHeight
      const availableHeight = viewportHeight - top - viewportBottomMargin;
      
      // Only set maxHeight if we're not flipping from top to bottom
      // Fixed: Only apply maxHeight in specific cases
      if (calculatedPlacement.startsWith('top') || 
          (calculatedPlacement.startsWith('bottom') && placement.startsWith('bottom'))) {
        // Set a minimum height to prevent tiny menus
        const minMenuHeight = Math.min(menuRect.height, 100);
        const newMaxHeight = Math.max(availableHeight, minMenuHeight);
        
        // Update maxHeight to fit within viewport
        menuElement.style.maxHeight = `${newMaxHeight}px`;
      }
      
      // If user has explicitly set a maxHeight, respect it if smaller than our calculated value
      if (config.maxHeight) {
        const configMaxHeight = parseInt(config.maxHeight, 10);
        if (!isNaN(configMaxHeight) && configMaxHeight < parseInt(menuElement.style.maxHeight, 10)) {
          menuElement.style.maxHeight = config.maxHeight;
        }
      }
    } else {
      // If there's plenty of space, use the config's maxHeight (if provided)
      if (config.maxHeight) {
        menuElement.style.maxHeight = config.maxHeight;
      }
    }
    
    // For 'width: 100%' configuration, match the anchor width
    if (config.width === '100%') {
      menuElement.style.width = `${anchorRect.width}px`;
    }
    
    // Apply final positions, ensuring menu stays within viewport
    menuElement.style.top = `${Math.max(minTopSpacing, top)}px`;
    menuElement.style.left = `${Math.max(16, left)}px`;
    
    // Make sure menu doesn't extend past right edge
    if (left + menuRect.width > viewportWidth - 16) {
      menuElement.style.left = 'auto';
      menuElement.style.right = '16px';
    }
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
   * Sets focus appropriately based on interaction type
   * For keyboard interactions, focuses the first item
   * For mouse interactions, makes the menu container focusable but doesn't auto-focus
   * 
   * @param {'keyboard'|'mouse'} interactionType - Type of interaction that opened the menu
   */
  const handleFocus = (interactionType: 'keyboard' | 'mouse'): void => {
    // Reset active item index
    state.activeItemIndex = -1;
    
    if (interactionType === 'keyboard') {
      // Find all focusable items
      const items = Array.from(
        component.element.querySelectorAll(`.${component.getClass('menu-item')}:not(.${component.getClass('menu-item--disabled')})`)
      ) as HTMLElement[];
      
      if (items.length > 0) {
        // Focus the first item for keyboard navigation
        items[0].setAttribute('tabindex', '0');
        items[0].focus();
        state.activeItemIndex = 0;
      } else {
        // If no items, focus the menu itself
        component.element.setAttribute('tabindex', '0');
        component.element.focus();
      }
    } else {
      // For mouse interaction, make the menu focusable but don't auto-focus
      component.element.setAttribute('tabindex', '-1');
    }
  };

  /**
   * Handles click on a menu item
   */
  const handleItemClick = (e: MouseEvent, item: MenuItem, index: number): void => {
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
    
    const isOpen = itemElement.getAttribute('aria-expanded') === 'true';
    
    if (isOpen) {
      // Close submenu
      closeSubmenu();
    } else {
      // Close any open submenu
      closeSubmenu();
      
      // Open new submenu
      openSubmenu(item, index, itemElement, viaKeyboard);
    }
  };

  /**
   * Handles hover on a submenu item
   */
  const handleSubmenuHover = (item: MenuItem, index: number, itemElement: HTMLElement): void => {
    if (!config.openSubmenuOnHover || !item.hasSubmenu) return;
    
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
          closeSubmenu();
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
          closeSubmenu();
        }
      }
      
      state.submenuTimer = null;
    }, 300);
  };

  /**
   * Opens a submenu
   */
  const openSubmenu = (item: MenuItem, index: number, itemElement: HTMLElement, viaKeyboard = false): void => {
    if (!item.submenu || !item.hasSubmenu) return;
    
    // Close any existing submenu
    closeSubmenu();
    
    // Set expanded state
    itemElement.setAttribute('aria-expanded', 'true');
    
    // Create submenu element
    const submenuElement = document.createElement('div');
    submenuElement.className = `${component.getClass('menu')} ${component.getClass('menu--submenu')}`;
    submenuElement.setAttribute('role', 'menu');
    submenuElement.setAttribute('tabindex', '-1');
    
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
    document.body.appendChild(submenuElement);
    
    // Setup keyboard navigation for submenu
    submenuElement.addEventListener('keydown', handleMenuKeydown);
    
    // Add mouseenter event to prevent closing
    submenuElement.addEventListener('mouseenter', () => {
      clearSubmenuTimer();
    });
    
    // Add mouseleave event to handle closing
    submenuElement.addEventListener('mouseleave', (e) => {
      handleSubmenuLeave(e);
    });
    
    // Position the submenu next to its parent item
    const itemRect = itemElement.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;


    // Default position is to the right
    submenuElement.style.top = `${itemRect.top + scrollY}px`; // Add scrollY to account for vertical scroll
    submenuElement.style.left = `${itemRect.right + scrollX}px`; // Add scrollX to account for horizontal scroll
    
    // Check if submenu would be outside viewport and adjust if needed
    const submenuRect = submenuElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    if (submenuRect.right > viewportWidth) {
      // Position to the left instead
      submenuElement.style.left = 'auto';
      submenuElement.style.right = `${window.innerWidth - itemRect.left + 8}px`;
    }
    
    // Add to state
    state.activeSubmenu = submenuElement;
    state.activeSubmenuItem = itemElement;
    
    // Add submenu events
    document.addEventListener('click', handleDocumentClickForSubmenu);
    window.addEventListener('resize', handleWindowResizeForSubmenu);
    window.addEventListener('scroll', handleWindowScrollForSubmenu);
    
    // Make visible
    setTimeout(() => {
      submenuElement.classList.add(`${component.getClass('menu--visible')}`);
      
      // If opened via keyboard, focus the first item in the submenu
      if (viaKeyboard && submenuItems.length > 0) {
        setTimeout(() => {
          submenuItems[0].focus();
        }, 50);
      }
    }, 10);
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
   * Closes any open submenu
   */
  const closeSubmenu = (): void => {
    // Clear timers
    clearHoverIntent();
    clearSubmenuTimer();
    
    if (!state.activeSubmenu) return;
    
    // Remove expanded state from all items
    if (state.activeSubmenuItem) {
      state.activeSubmenuItem.setAttribute('aria-expanded', 'false');
    }
    
    // Remove submenu element with animation
    state.activeSubmenu.classList.remove(`${component.getClass('menu--visible')}`);
    
    // Store reference for cleanup
    const submenuToRemove = state.activeSubmenu;
    
    // Remove after animation
    setTimeout(() => {
      if (submenuToRemove && submenuToRemove.parentNode) {
        submenuToRemove.parentNode.removeChild(submenuToRemove);
      }
    }, 200);
    
    // Clear state
    state.activeSubmenu = null;
    state.activeSubmenuItem = null;
    
    // Remove document events
    document.removeEventListener('click', handleDocumentClickForSubmenu);
    window.removeEventListener('resize', handleWindowResizeForSubmenu);
    window.removeEventListener('scroll', handleWindowScrollForSubmenu);
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
    // Reposition or close submenu on resize
    closeSubmenu();
  };

  /**
   * Handles window scroll for submenu
   */
  const handleWindowScrollForSubmenu = (): void => {
    // Reposition or close submenu on scroll
    closeSubmenu();
  };

  /**
   * Opens the menu
   * @param {Event} [event] - Optional event that triggered the open
   * @param {'mouse'|'keyboard'} [interactionType='mouse'] - The type of interaction that triggered the open
   */
  const openMenu = (event?: Event, interactionType: 'mouse' | 'keyboard' = 'mouse'): void => {
    if (state.visible) return;
    
    // Update state
    state.visible = true;
    
    // Add the menu to the DOM if it's not already there
    if (!component.element.parentNode) {
      document.body.appendChild(component.element);
    }
    
    // Set attributes
    component.element.setAttribute('aria-hidden', 'false');
    component.element.classList.add(`${component.getClass('menu--visible')}`);
    
    // Position
    positionMenu();
    
    // Focus based on interaction type
    setTimeout(() => {
      handleFocus(interactionType);
    }, 100);
    
    // Add document events
    if (config.closeOnClickOutside) {
      document.addEventListener('click', handleDocumentClick);
    }
    if (config.closeOnEscape) {
      document.addEventListener('keydown', handleDocumentKeydown);
    }
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('scroll', handleWindowScroll);
    
    // Trigger event
    eventHelpers.triggerEvent('open', {}, event);
  };

  /**
   * Closes the menu
   */
  const closeMenu = (event?: Event): void => {
    if (!state.visible) return;
    
    // Close any open submenu first
    closeSubmenu();
    
    // Update state
    state.visible = false;
    
    // Set attributes
    component.element.setAttribute('aria-hidden', 'true');
    component.element.classList.remove(`${component.getClass('menu--visible')}`);
    
    // Remove document events
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleDocumentKeydown);
    window.removeEventListener('resize', handleWindowResize);
    window.removeEventListener('scroll', handleWindowScroll);
    
    // Trigger event
    eventHelpers.triggerEvent('close', {}, event);
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      if (component.element.parentNode && !state.visible) {
        component.element.parentNode.removeChild(component.element);
      }
    }, 300); // Match the animation duration in CSS
  };

  /**
   * Toggles the menu
   */
  const toggleMenu = (event?: Event): void => {
    if (state.visible) {
      closeMenu(event);
    } else {
      openMenu(event);
    }
  };

  /**
   * Handles document click
   */
  const handleDocumentClick = (e: MouseEvent): void => {
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
      closeMenu(e);
    }
  };

  /**
   * Handles window resize
   */
  const handleWindowResize = (): void => {
    if (state.visible) {
      positionMenu();
    }
  };

  /**
   * Handles window scroll
   */
  const handleWindowScroll = (): void => {
    if (state.visible) {
      positionMenu();
    }
  };

  /**
   * Sets focus to the menu itself, but doesn't auto-select the first item
   * This improves usability by not having an item automatically selected
   */
  const focusFirstItem = (): void => {
    // Instead of focusing the first item directly, focus the menu container
    // which will still allow keyboard navigation to work
    component.element.setAttribute('tabindex', '0');
    component.element.focus();
    
    // Reset active item index
    state.activeItemIndex = -1;
  };

  /**
   * Handles keydown events on the menu or submenu
   */
  const handleMenuKeydown = (e: KeyboardEvent): void => {
    // Determine if this event is from the main menu or a submenu
    const isSubmenu = state.activeSubmenu && state.activeSubmenu.contains(e.target as Node);
    
    // Get the appropriate menu element
    const menuElement = isSubmenu ? state.activeSubmenu : component.element;
    
    // Get all non-disabled menu items from the current menu
    const items = Array.from(menuElement.querySelectorAll(
      `.${component.getClass('menu-item')}:not(.${component.getClass('menu-item--disabled')})`
    )) as HTMLElement[];
    
    if (items.length === 0) return;
    
    // Get the currently focused item index
    let focusedItemIndex = -1;
    const focusedElement = menuElement.querySelector(':focus') as HTMLElement;
    if (focusedElement && focusedElement.classList.contains(component.getClass('menu-item'))) {
      focusedItemIndex = items.indexOf(focusedElement);
    }
    
    switch (e.key) {
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        // If no item is active, select the first one
        if (focusedItemIndex < 0) {
          items[0].focus();
        } else if (focusedItemIndex < items.length - 1) {
          items[focusedItemIndex + 1].focus();
        } else {
          items[0].focus();
        }
        break;
        
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        // If no item is active, select the last one
        if (focusedItemIndex < 0) {
          items[items.length - 1].focus();
        } else if (focusedItemIndex > 0) {
          items[focusedItemIndex - 1].focus();
        } else {
          items[items.length - 1].focus();
        }
        break;
        
      case 'Home':
        e.preventDefault();
        items[0].focus();
        break;
        
      case 'End':
        e.preventDefault();
        items[items.length - 1].focus();
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        // If an item is focused, click it
        if (focusedItemIndex >= 0) {
          items[focusedItemIndex].click();
        }
        break;
        
      case 'ArrowRight':
      case 'Right':
        e.preventDefault();
        // Handle right arrow in different contexts
        if (isSubmenu) {
          // In a submenu, right arrow opens nested submenus
          if (focusedItemIndex >= 0 && items[focusedItemIndex].classList.contains(`${component.getClass('menu-item--submenu')}`)) {
            items[focusedItemIndex].click();
          }
        } else {
          // In main menu, right arrow opens a submenu
          if (focusedItemIndex >= 0 && items[focusedItemIndex].classList.contains(`${component.getClass('menu-item--submenu')}`)) {
            // Get the correct menu item data
            const itemElement = items[focusedItemIndex];
            const itemIndex = parseInt(itemElement.getAttribute('data-index'), 10);
            const itemData = state.items[itemIndex] as MenuItem;
            
            // Open submenu via keyboard
            handleSubmenuClick(itemData, itemIndex, itemElement, true);
          }
        }
        break;
        
      case 'ArrowLeft':
      case 'Left':
        e.preventDefault();
        // Handle left arrow in different contexts
        if (isSubmenu) {
          // In a submenu, left arrow returns to the parent menu
          if (state.activeSubmenuItem) {
            // Store the reference to the parent item before closing the submenu
            const parentItem = state.activeSubmenuItem;
            closeSubmenu();
            // Focus the parent item after closing
            parentItem.focus();
          } else {
            closeSubmenu();
          }
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        if (isSubmenu) {
          // In a submenu, Escape closes just the submenu
          if (state.activeSubmenuItem) {
            // Store the reference to the parent item before closing the submenu
            const parentItem = state.activeSubmenuItem;
            closeSubmenu();
            // Focus the parent item after closing
            parentItem.focus();
          } else {
            closeSubmenu();
          }
        } else {
          // In main menu, Escape closes the entire menu
          closeMenu(e);
        }
        break;
        
      case 'Tab':
        // Close the menu when tabbing out
        if (!isSubmenu) {
          closeMenu();
        }
        break;
    }
  };

  /**
   * Sets up the menu
   */
  const initMenu = () => {
    // Set up menu structure
    renderMenuItems();
    
    // Set up keyboard navigation
    component.element.addEventListener('keydown', handleMenuKeydown);
    
    // Position if visible
    if (state.visible) {
      positionMenu();
      
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
      if (state.activeSubmenu && state.activeSubmenu.parentNode) {
        state.activeSubmenu.parentNode.removeChild(state.activeSubmenu);
      }
      
      originalDestroy();
    };
  }

  // Return enhanced component
  return {
    ...component,
    menu: {
      open: (event) => {
        openMenu(event);
        return component;
      },
      
      close: (event) => {
        closeMenu(event);
        return component;
      },
      
      toggle: (event) => {
        toggleMenu(event);
        return component;
      },
      
      isOpen: () => state.visible,
      
      setItems: (items) => {
        state.items = items;
        renderMenuItems();
        return component;
      },
      
      getItems: () => state.items,
      
      setPlacement: (placement) => {
        state.placement = placement;
        if (state.visible) {
          positionMenu();
        }
        return component;
      },
      
      getPlacement: () => state.placement
    }
  };
};

export default withController;