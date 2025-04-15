// src/components/menu/features/position.ts

import { MenuConfig } from '../types';

/**
 * Menu position helper
 * Provides functions for positioning menus and submenus
 */
export const createPositioner = (component, config: MenuConfig) => {
  /**
   * Positions the menu relative to its anchor
   * Ensures the menu maintains proper spacing from viewport edges
   * Makes sure the menu stays attached to anchor during scrolling
   * 
   * @param menuElement - The menu element to position
   * @param anchorElement - The element to anchor against
   * @param preferredPosition - The preferred position
   * @param isSubmenu - Whether this is a submenu (affects positioning logic)
   */
  const positionElement = (
    menuElement: HTMLElement, 
    anchorElement: HTMLElement, 
    preferredPosition: string,
    isSubmenu = false
  ): void => {
    if (!menuElement || !anchorElement) return;
    
    // Ensure menu is positioned absolutely for proper scroll behavior
    menuElement.style.position = 'absolute';
    
    // Get current scroll position - critical for absolute positioning that tracks anchor
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // Make a copy of the menu for measurement without affecting the real menu
    const tempMenu = menuElement.cloneNode(true) as HTMLElement;
    
    // Make the temp menu visible but not displayed for measurement
    tempMenu.style.visibility = 'hidden';
    tempMenu.style.display = 'block';
    tempMenu.style.position = 'absolute';
    tempMenu.style.top = '0';
    tempMenu.style.left = '0';
    tempMenu.style.transform = 'none';
    tempMenu.style.opacity = '0';
    tempMenu.style.pointerEvents = 'none';
    tempMenu.classList.add(`${component.getClass('menu--visible')}`); // Add visible class for proper dimensions
    
    // Add it to the DOM temporarily
    document.body.appendChild(tempMenu);
    
    // Get measurements
    const anchorRect = anchorElement.getBoundingClientRect();
    const menuRect = tempMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Remove the temp element after measurements
    document.body.removeChild(tempMenu);
    
    // Get values needed for calculations
    const offset = config.offset !== undefined ? config.offset : 8;
    
    // Calculate position based on position
    let top = 0;
    let left = 0;
    let calculatedPosition = preferredPosition;
    
    // Different positioning logic for main menu vs submenu
    if (isSubmenu) {
      // Default position is to the right of parent
      calculatedPosition = preferredPosition || 'right-start';
      
      // Check if this would push the submenu out of the viewport
      if (calculatedPosition.startsWith('right') && anchorRect.right + menuRect.width + offset > viewportWidth - 16) {
        // Flip to the left side if it doesn't fit on the right
        calculatedPosition = calculatedPosition.replace('right', 'left');
      } else if (calculatedPosition.startsWith('left') && anchorRect.left - menuRect.width - offset < 16) {
        // Flip to the right side if it doesn't fit on the left
        calculatedPosition = calculatedPosition.replace('left', 'right');
      }
      
      // Check vertical positioning as well for submenus
      // If submenu would extend beyond the bottom of the viewport, adjust positioning
      if (anchorRect.top + menuRect.height > viewportHeight - 16) {
        if (calculatedPosition === 'right-start') {
          calculatedPosition = 'right-end';
        } else if (calculatedPosition === 'left-start') {
          calculatedPosition = 'left-end';
        }
      }
    } else {
      // For main menu, follow the standard position calculation
      // First determine correct position based on original position
      switch (preferredPosition) {
        case 'top-start':
        case 'top':
        case 'top-end':
          // Check if enough space above
          if (anchorRect.top < menuRect.height + offset + 16) {
            // Not enough space above, flip to bottom
            calculatedPosition = preferredPosition.replace('top', 'bottom');
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
              calculatedPosition = preferredPosition.replace('bottom', 'top');
            }
          }
          break;
          
        // Specifically handle right-start, right, left-start, and left positions
        case 'right-start':
        case 'right':
        case 'left-start':
        case 'left':
          // Check if enough space below for these side positions
          if (anchorRect.bottom + menuRect.height > viewportHeight - 16) {
            // Not enough space below, shift the menu upward
            if (preferredPosition === 'right-start') {
              calculatedPosition = 'right-end';
            } else if (preferredPosition === 'left-start') {
              calculatedPosition = 'left-end';
            } else if (preferredPosition === 'right') {
              // For center aligned, shift up by half menu height plus some spacing
              top = anchorRect.top - (menuRect.height - anchorRect.height) - offset;
            } else if (preferredPosition === 'left') {
              // For center aligned, shift up by half menu height plus some spacing
              top = anchorRect.top - (menuRect.height - anchorRect.height) - offset;
            }
          }
          break;
      }
    }
    
    // Reset any existing position classes
    const positionClasses = [
      'position-top', 'position-bottom', 'position-right', 'position-left'
    ];
    
    positionClasses.forEach(posClass => {
      menuElement.classList.remove(`${component.getClass('menu')}--${posClass}`);
    });
    
    // Determine transform origin based on vertical position
    // Start by checking the calculated position to determine transform origin
    const menuAppearsAboveAnchor = 
      calculatedPosition.startsWith('top') || 
      calculatedPosition === 'right-end' || 
      calculatedPosition === 'left-end' ||
      (calculatedPosition === 'right' && top < anchorRect.top) ||
      (calculatedPosition === 'left' && top < anchorRect.top);
    
    if (menuAppearsAboveAnchor) {
      menuElement.classList.add(`${component.getClass('menu')}--position-top`);
    } else if (calculatedPosition.startsWith('left')) {
      menuElement.classList.add(`${component.getClass('menu')}--position-left`);
    } else if (calculatedPosition.startsWith('right')) {
      menuElement.classList.add(`${component.getClass('menu')}--position-right`);
    } else {
      menuElement.classList.add(`${component.getClass('menu')}--position-bottom`);
    }
    
    // Position calculation - important: getBoundingClientRect() returns values relative to viewport
    // We need to add scroll position to get absolute position
    switch (calculatedPosition) {
      case 'top-start':
        top = anchorRect.top + scrollY - menuRect.height - offset;
        left = anchorRect.left + scrollX;
        break;
      case 'top':
        top = anchorRect.top + scrollY - menuRect.height - offset;
        left = anchorRect.left + scrollX + (anchorRect.width / 2) - (menuRect.width / 2);
        break;
      case 'top-end':
        top = anchorRect.top + scrollY - menuRect.height - offset;
        left = anchorRect.right + scrollX - menuRect.width;
        break;
      case 'right-start':
        top = anchorRect.top + scrollY;
        left = anchorRect.right + scrollX + offset;
        break;
      case 'right':
        // Custom top position might be set above; only set if not already defined
        if (top === 0) {
          top = anchorRect.top + scrollY + (anchorRect.height / 2) - (menuRect.height / 2);
        } else {
          top += scrollY;
        }
        left = anchorRect.right + scrollX + offset;
        break;
      case 'right-end':
        top = anchorRect.bottom + scrollY - menuRect.height;
        left = anchorRect.right + scrollX + offset;
        break;
      case 'bottom-start':
        top = anchorRect.bottom + scrollY + offset;
        left = anchorRect.left + scrollX;
        break;
      case 'bottom':
        top = anchorRect.bottom + scrollY + offset;
        left = anchorRect.left + scrollX + (anchorRect.width / 2) - (menuRect.width / 2);
        break;
      case 'bottom-end':
        top = anchorRect.bottom + scrollY + offset;
        left = anchorRect.right + scrollX - menuRect.width;
        break;
      case 'left-start':
        top = anchorRect.top + scrollY;
        left = anchorRect.left + scrollX - menuRect.width - offset;
        break;
      case 'left':
        // Custom top position might be set above; only set if not already defined
        if (top === 0) {
          top = anchorRect.top + scrollY + (anchorRect.height / 2) - (menuRect.height / 2);
        } else {
          top += scrollY;
        }
        left = anchorRect.left + scrollX - menuRect.width - offset;
        break;
      case 'left-end':
        top = anchorRect.bottom + scrollY - menuRect.height;
        left = anchorRect.left + scrollX - menuRect.width - offset;
        break;
    }
    
    // Ensure the menu has proper spacing from viewport edges
    
    // Top edge spacing - ensure the menu doesn't go above the viewport + padding
    const minTopSpacing = 16; // Minimum distance from top of viewport
    if (top - scrollY < minTopSpacing) {
      top = minTopSpacing + scrollY;
    }
    
    // Bottom edge spacing - ensure the menu doesn't go below the viewport - padding
    const viewportBottomMargin = 16; // Minimum space from bottom of viewport
    const bottomEdge = (top - scrollY) + menuRect.height;
    
    if (bottomEdge > viewportHeight - viewportBottomMargin) {
      // Option 1: We could adjust the top position
      // top = scrollY + viewportHeight - viewportBottomMargin - menuRect.height;
      
      // Option 2: Instead of moving the menu, adjust its height to fit (better UX)
      const availableHeight = viewportHeight - (top - scrollY) - viewportBottomMargin;
      
      // Set a minimum height to prevent tiny menus
      const minMenuHeight = Math.min(menuRect.height, 100);
      const newMaxHeight = Math.max(availableHeight, minMenuHeight);
      
      // Update maxHeight to fit within viewport
      menuElement.style.maxHeight = `${newMaxHeight}px`;
      
      // If user has explicitly set a maxHeight, respect it if smaller
      if (config.maxHeight) {
        const configMaxHeight = parseInt(config.maxHeight, 10);
        if (!isNaN(configMaxHeight) && configMaxHeight < parseInt(menuElement.style.maxHeight || '0', 10)) {
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
    if (config.width === '100%' && !isSubmenu) {
      menuElement.style.width = `${anchorRect.width}px`;
    }
    
    // Apply final positions, ensuring menu stays within viewport
    // The position is absolute, not fixed, so it must account for scroll
    menuElement.style.top = `${Math.max(minTopSpacing + scrollY, top)}px`;
    menuElement.style.left = `${Math.max(16 + scrollX, left)}px`;
    
    // Make sure menu doesn't extend past right edge 
    if ((left - scrollX) + menuRect.width > viewportWidth - 16) {
      // If we're going past the right edge, set right with fixed distance from edge
      menuElement.style.left = 'auto';
      menuElement.style.right = '16px';
    }
  };

  /**
   * Positions the main menu relative to its anchor
   */
  const positionMenu = (anchorElement: HTMLElement): void => {
    if (!anchorElement || !component.element) return;
    positionElement(component.element, anchorElement, config.position, false);
  };

  /**
   * Positions a submenu relative to its parent menu item
   * For deeply nested submenus, alternates side placement (right/left)
   * @param submenuElement - The submenu element to position
   * @param parentItemElement - The parent menu item element
   * @param level - Nesting level for calculating position
   */
  const positionSubmenu = (
    submenuElement: HTMLElement, 
    parentItemElement: HTMLElement,
    level: number = 1
  ): void => {
    if (!submenuElement || !parentItemElement) return;
    
    // Alternate between right and left positioning for deeper nesting levels
    // This helps prevent menus from cascading off the screen
    const prefPosition = level % 2 === 1 ? 'right-start' : 'left-start';
    
    // Use higher z-index for deeper nested menus to ensure proper layering
    submenuElement.style.zIndex = `${1000 + (level * 10)}`;
    
    positionElement(submenuElement, parentItemElement, prefPosition, true);
  };

  return {
    positionMenu,
    positionSubmenu,
    positionElement
  };
};

/**
 * Adds positioning functionality to the menu component
 * 
 * @param config - Menu configuration options
 * @returns Component enhancer with positioning functionality
 */
export const withPosition = (config: MenuConfig) => component => {
  // Do nothing if no element
  if (!component.element) {
    return component;
  }

  // Create the positioner
  const positioner = createPositioner(component, config);
  
  // Return enhanced component
  return {
    ...component,
    position: positioner
  };
};

export default withPosition;