// src/components/menu/features/keyboard.ts

import { MenuContent, MenuItem } from '../types';

/**
 * Keyboard navigation handler for menus
 * Manages focus management and keyboard interactions for accessibility
 */
export const createKeyboardNavigation = (component) => {
  // Track tab navigation state
  let isTabNavigation = false;

  // Add event listener to detect Tab key navigation
  const setupTabKeyDetection = () => {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // Set flag when Tab key is pressed
      isTabNavigation = e.key === 'Tab';
      
      // Reset flag after a short delay
      setTimeout(() => {
        isTabNavigation = false;
      }, 100);
    });
  };

  // Call setup once
  setupTabKeyDetection();

  /**
   * Gets all focusable elements in the document
   * Useful for Tab navigation management
   */
  const getFocusableElements = (): HTMLElement[] => {
    // Query all potentially focusable elements
    const focusableElementsString = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const elements = document.querySelectorAll(focusableElementsString) as NodeListOf<HTMLElement>;
    
    // Convert to array and filter out hidden elements
    return Array.from(elements).filter(element => {
      return element.offsetParent !== null && !element.classList.contains('hidden');
    });
  };

  /**
   * Sets up initial focus within the menu
   * @param menuElement - The menu element to set focus within
   * @param interactionType - Type of interaction that opened the menu
   */
  const handleInitialFocus = (menuElement: HTMLElement, interactionType: 'keyboard' | 'mouse'): void => {
    if (interactionType === 'keyboard') {
      // Find all focusable items
      const items = Array.from(
        menuElement.querySelectorAll(`.${component.getClass('menu-item')}:not(.${component.getClass('menu-item--disabled')})`)
      ) as HTMLElement[];
      
      if (items.length > 0) {
        // Set tabindex on first item and focus it
        items[0].setAttribute('tabindex', '0');
        items[0].focus();
      } else {
        // If no items, focus the menu itself
        menuElement.setAttribute('tabindex', '0');
        menuElement.focus();
      }
    } else {
      // For mouse interaction, make the menu focusable but don't auto-focus
      menuElement.setAttribute('tabindex', '-1');
      
      // Still set up the first item as focusable
      const firstItem = menuElement.querySelector(`.${component.getClass('menu-item')}:not(.${component.getClass('menu-item--disabled')})`) as HTMLElement;
      if (firstItem) {
        firstItem.setAttribute('tabindex', '0');
      }
    }
  };

  /**
   * Handles keydown events on the menu or submenu
   */
  const handleMenuKeydown = (
    e: KeyboardEvent, 
    state: any, 
    actions: {
      closeMenu: (event: Event, restoreFocus?: boolean) => void,
      closeSubmenuAtLevel: (level: number) => void,
      findItemById: (id: string) => MenuItem | null,
      handleSubmenuClick: (item: MenuItem, index: number, itemElement: HTMLElement) => void,
      handleNestedSubmenuClick: (item: MenuItem, index: number, itemElement: HTMLElement) => void
    }
  ): void => {
    // Determine if this event is from the main menu or a submenu
    const isSubmenu = state.activeSubmenu && state.activeSubmenu.contains(e.target as Node);
    
    // Get the appropriate menu element
    const menuElement = isSubmenu ? state.activeSubmenu : component.element;
    
    // Get all non-disabled menu items from the current menu
    const items = Array.from(menuElement.querySelectorAll(
      `.${component.getClass('menu-item')}:not(.${component.getClass('menu-item--disabled')})`
    )) as HTMLElement[];
    
    if (items.length === 0) return;
    
    // Find the currently focused item
    const focusedElement = document.activeElement as HTMLElement;
    let focusedItemIndex = -1;
    
    if (focusedElement && items.includes(focusedElement)) {
      focusedItemIndex = items.indexOf(focusedElement);
    }
    
    // Simplified focus function
    const focusItem = (index: number) => {
      if (items[index]) {
        items[index].focus();
      }
    };
    
    switch (e.key) {
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        if (focusedItemIndex < 0) {
          focusItem(0);
        } else if (focusedItemIndex < items.length - 1) {
          focusItem(focusedItemIndex + 1);
        } else {
          focusItem(0); // Wrap to first
        }
        break;
        
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        if (focusedItemIndex < 0) {
          focusItem(items.length - 1);
        } else if (focusedItemIndex > 0) {
          focusItem(focusedItemIndex - 1);
        } else {
          focusItem(items.length - 1); // Wrap to last
        }
        break;
        
      case 'Home':
        e.preventDefault();
        focusItem(0);
        break;
        
      case 'End':
        e.preventDefault();
        focusItem(items.length - 1);
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedItemIndex >= 0) {
          items[focusedItemIndex].click();
        }
        break;
        
      case 'ArrowRight':
      case 'Right':
        e.preventDefault();
        if (isSubmenu) {
          // In a submenu, right arrow opens nested submenus
          if (focusedItemIndex >= 0 && items[focusedItemIndex].classList.contains(`${component.getClass('menu-item--submenu')}`)) {
            const itemElement = items[focusedItemIndex];
            const itemIndex = parseInt(itemElement.getAttribute('data-index'), 10);
            const parentMenu = itemElement.closest(`.${component.getClass('menu--submenu')}`);
            const parentItemId = parentMenu?.getAttribute('data-parent-item');
            
            // Find the parent item in the items array to get its submenu
            const parentItem = actions.findItemById(parentItemId);
            if (parentItem && parentItem.submenu) {
              const itemData = parentItem.submenu[itemIndex] as MenuItem;
              actions.handleNestedSubmenuClick(itemData, itemIndex, itemElement);
            }
          }
        } else {
          // In main menu, right arrow opens a submenu
          if (focusedItemIndex >= 0 && items[focusedItemIndex].classList.contains(`${component.getClass('menu-item--submenu')}`)) {
            // Get the correct menu item data
            const itemElement = items[focusedItemIndex];
            const itemIndex = parseInt(itemElement.getAttribute('data-index'), 10);
            const itemData = state.items[itemIndex] as MenuItem;
            
            // Open submenu
            actions.handleSubmenuClick(itemData, itemIndex, itemElement);
          }
        }
        break;
        
      case 'ArrowLeft':
      case 'Left':
        e.preventDefault();
        if (isSubmenu) {
          // In a submenu, left arrow returns to the parent menu
          if (state.activeSubmenuItem) {
            // Store the reference to the parent item before closing the submenu
            const parentItem = state.activeSubmenuItem;
            
            // Get the current level
            const currentLevel = parseInt(
              menuElement.getAttribute('data-level') || '1',
              10
            );
            
            // Close this level of submenu
            actions.closeSubmenuAtLevel(currentLevel);
            
            // Focus the parent item after closing
            if (parentItem) {
              parentItem.focus();
            }
          } else {
            actions.closeSubmenuAtLevel(1);
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
            
            // Get the current level
            const currentLevel = parseInt(
              menuElement.getAttribute('data-level') || '1',
              10
            );
            
            // Close this level of submenu
            actions.closeSubmenuAtLevel(currentLevel);
            
            // Focus the parent item after closing
            if (parentItem) {
              parentItem.focus();
            }
          } else {
            actions.closeSubmenuAtLevel(1);
          }
        } else {
          // In main menu, Escape closes the entire menu and restores focus to anchor
          actions.closeMenu(e, true);
        }
        break;
        
      case 'Tab':
        // Close the menu when tabbing out and move focus to next focusable element
        e.preventDefault(); 
        
        // Find the focusable elements before closing the menu
        const focusableElements = getFocusableElements();
        const anchorElement = component.anchor?.getAnchor?.();
        const anchorIndex = anchorElement ? focusableElements.indexOf(anchorElement) : -1;
        
        // Calculate the next element to focus
        let nextElementIndex = -1;
        if (anchorIndex >= 0) {
          nextElementIndex = e.shiftKey ? 
            (anchorIndex > 0 ? anchorIndex - 1 : focusableElements.length - 1) : 
            (anchorIndex < focusableElements.length - 1 ? anchorIndex + 1 : 0);
        }
        
        // Store the next element to focus before closing the menu
        const nextElementToFocus = nextElementIndex >= 0 ? focusableElements[nextElementIndex] : null;
        
        // Close the menu with focus restoration explicitly disabled
        actions.closeMenu(e, false);
        
        // Focus the next element if found, with a slight delay to ensure menu is closed
        if (nextElementToFocus) {
          setTimeout(() => {
            nextElementToFocus.focus();
          }, 10);
        }
        break;
    }
  };

  /**
   * Set up keydown handler for a menu element
   */
  const setupKeyboardHandlers = (menuElement: HTMLElement, state: any, actions: any) => {
    // Make all menu items focusable via keyboard navigation
    const items = menuElement.querySelectorAll(`.${component.getClass('menu-item')}:not(.${component.getClass('menu-item--disabled')})`) as NodeListOf<HTMLElement>;
    items.forEach(item => {
      item.tabIndex = -1;
    });
    
    // Set first item as focusable
    if (items.length > 0) {
      items[0].tabIndex = 0;
    }
    
    menuElement.addEventListener('keydown', e => handleMenuKeydown(e, state, actions));
  };

  /**
   * Checks if current interaction is tab navigation
   */
  const isTabNavigationActive = () => isTabNavigation;

  // Return the public API
  return {
    handleInitialFocus,
    handleMenuKeydown,
    setupKeyboardHandlers,
    isTabNavigationActive,
    getFocusableElements
  };
};

/**
 * Adds keyboard navigation functionality to the menu component
 * 
 * @param config - Menu configuration
 * @returns Component enhancer with keyboard navigation functionality
 */
const withKeyboard = (config: any) => component => {
  if (!component.element) {
    return component;
  }

  // Create keyboard navigation controller
  const keyboard = createKeyboardNavigation(component);
  
  // Return enhanced component
  return {
    ...component,
    keyboard
  };
};

export default withKeyboard;