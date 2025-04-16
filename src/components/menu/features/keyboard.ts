// src/components/menu/features/keyboard.ts

import { MenuContent, MenuItem } from '../types';

/**
 * Keyboard navigation handler for menus
 * Manages focus management and keyboard interactions for accessibility
 */
export const createKeyboardNavigation = (component) => {
  // Track keyboard navigation state
  let keyboardNavActive = false;
  let isTabNavigation = false;

  // Track document-level tab key detection
  const setupTabKeyDetection = () => {
    // Add event listener to detect Tab key navigation
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
   * Find a menu item by its ID in the items array
   */
  const findItemById = (items: MenuContent[], id: string): MenuItem | null => {
    // Search in top-level items
    for (const item of items) {
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
   * Sets focus appropriately based on interaction type
   * For keyboard interactions, focuses the first item
   * For mouse interactions, makes the menu container focusable but doesn't auto-focus
   * 
   * @param menuElement - The menu element to set focus within
   * @param interactionType - Type of interaction that opened the menu
   */
  const handleInitialFocus = (menuElement: HTMLElement, interactionType: 'keyboard' | 'mouse'): void => {
    // Set keyboard navigation state based on interaction type
    keyboardNavActive = interactionType === 'keyboard';
    
    if (interactionType === 'keyboard') {
      // Find all focusable items
      const items = Array.from(
        menuElement.querySelectorAll(`.${component.getClass('menu-item')}:not(.${component.getClass('menu-item--disabled')})`)
      ) as HTMLElement[];
      
      if (items.length > 0) {
        // Set all items to tabindex -1 except the first one
        items.forEach((item, index) => {
          item.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });
        
        // Focus the first item for keyboard navigation
        items[0].focus();
      } else {
        // If no items, focus the menu itself
        menuElement.setAttribute('tabindex', '0');
        menuElement.focus();
      }
    } else {
      // For mouse interaction, make the menu focusable but don't auto-focus
      menuElement.setAttribute('tabindex', '-1');
      
      // Still set up the tabindex correctly for potential keyboard navigation
      const items = Array.from(
        menuElement.querySelectorAll(`.${component.getClass('menu-item')}:not(.${component.getClass('menu-item--disabled')})`)
      ) as HTMLElement[];
      
      if (items.length > 0) {
        // Set all items to tabindex -1 except the first one
        items.forEach((item, index) => {
          item.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });
      }
    }
  };

  /**
   * Handles keydown events on the menu or submenu
   * 
   * @param e - Keyboard event
   * @param state - Current menu state
   * @param actions - Menu actions (closeMenu, openSubmenu, etc.)
   */
  const handleMenuKeydown = (
    e: KeyboardEvent, 
    state: any, 
    actions: {
      closeMenu: (event: Event, restoreFocus?: boolean, skipAnimation?: boolean) => void,
      closeSubmenuAtLevel: (level: number) => void,
      findItemById: (id: string) => MenuItem | null,
      handleSubmenuClick: (item: MenuItem, index: number, itemElement: HTMLElement, viaKeyboard: boolean) => void,
      handleNestedSubmenuClick: (item: MenuItem, index: number, itemElement: HTMLElement, viaKeyboard: boolean) => void
    }
  ): void => {
    // Set keyboard navigation active flag
    keyboardNavActive = true;
    
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
    
    // Function to update tabindex and focus a specific item
    const focusItem = (index: number) => {
      // Set all items to tabindex -1
      items.forEach(item => item.setAttribute('tabindex', '-1'));
      
      // Set the target item to tabindex 0 and focus it
      items[index].setAttribute('tabindex', '0');
      items[index].focus();
    };
    
    switch (e.key) {
      case 'ArrowDown':
      case 'Down':
        e.preventDefault();
        // If no item is active, select the first one
        if (focusedItemIndex < 0) {
          focusItem(0);
        } else if (focusedItemIndex < items.length - 1) {
          focusItem(focusedItemIndex + 1);
        } else {
          // Wrap to first item
          focusItem(0);
        }
        break;
        
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        // If no item is active, select the last one
        if (focusedItemIndex < 0) {
          focusItem(items.length - 1);
        } else if (focusedItemIndex > 0) {
          focusItem(focusedItemIndex - 1);
        } else {
          // Wrap to last item
          focusItem(items.length - 1);
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
            // Simulate click but specifying it's via keyboard
            const itemElement = items[focusedItemIndex];
            const itemIndex = parseInt(itemElement.getAttribute('data-index'), 10);
            
            // Get the parent submenu to find the correct data
            const parentMenu = itemElement.closest(`.${component.getClass('menu--submenu')}`);
            const parentItemId = parentMenu?.getAttribute('data-parent-item');
            
            // Find the parent item in the items array to get its submenu
            const parentItem = actions.findItemById(parentItemId);
            if (parentItem && parentItem.submenu) {
              const itemData = parentItem.submenu[itemIndex] as MenuItem;
              actions.handleNestedSubmenuClick(itemData, itemIndex, itemElement, true);
            }
          }
        } else {
          // In main menu, right arrow opens a submenu
          if (focusedItemIndex >= 0 && items[focusedItemIndex].classList.contains(`${component.getClass('menu-item--submenu')}`)) {
            // Get the correct menu item data
            const itemElement = items[focusedItemIndex];
            const itemIndex = parseInt(itemElement.getAttribute('data-index'), 10);
            const itemData = state.items[itemIndex] as MenuItem;
            
            // Open submenu via keyboard
            actions.handleSubmenuClick(itemData, itemIndex, itemElement, true);
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
            
            // Get the current level
            const currentLevel = parseInt(
              menuElement.getAttribute('data-level') || '1',
              10
            );
            
            // Close this level of submenu
            actions.closeSubmenuAtLevel(currentLevel);
            
            // Focus the parent item after closing
            if (parentItem) {
              parentItem.setAttribute('tabindex', '0');
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
              parentItem.setAttribute('tabindex', '0');
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
        // Modified Tab handling - we want to close the menu and move focus to the next focusable element
        e.preventDefault(); // Prevent default tab behavior
        
        // Find the focusable elements before closing the menu
        const focusableElements = getFocusableElements();
        const anchorElement = component.anchor?.getAnchor?.();
        const anchorIndex = anchorElement ? focusableElements.indexOf(anchorElement) : -1;
        
        // Calculate the next element to focus
        let nextElementIndex = -1;
        if (anchorIndex >= 0) {
          nextElementIndex = e.shiftKey ? 
            // For Shift+Tab, go to previous element or last element if we're at the start
            (anchorIndex > 0 ? anchorIndex - 1 : focusableElements.length - 1) : 
            // For Tab, go to next element or first element if we're at the end
            (anchorIndex < focusableElements.length - 1 ? anchorIndex + 1 : 0);
        }
        
        // Store the next element to focus before closing the menu
        const nextElementToFocus = nextElementIndex >= 0 ? focusableElements[nextElementIndex] : null;
        
        // Close the menu with focus restoration explicitly disabled
        actions.closeMenu(e, false, true);
        
        // Focus the next element if found, with a slight delay to ensure menu is closed
        if (nextElementToFocus) {
          // Use setTimeout with a very small delay to ensure this happens after all other operations
          setTimeout(() => {
            // Set a flag to prevent any other focus management from interfering
            document.body.setAttribute('data-menu-tab-navigation', 'true');
            
            // Focus the element
            nextElementToFocus.focus();
            
            // Remove the flag after focus is set
            setTimeout(() => {
              document.body.removeAttribute('data-menu-tab-navigation');
            }, 100);
          }, 10);
        }
        break;
    }
  };

  /**
   * Set up keydown handler for a menu element
   */
  const setupKeyboardHandlers = (menuElement: HTMLElement, state: any, actions: any) => {
    menuElement.addEventListener('keydown', (e) => handleMenuKeydown(e, state, actions));
  };

  /**
   * Checks if current interaction is tab navigation
   */
  const isTabNavigationActive = () => isTabNavigation;

  /**
   * Gets keyboard navigation state
   */
  const isKeyboardActive = () => keyboardNavActive;

  /**
   * Sets keyboard navigation state
   */
  const setKeyboardActive = (active: boolean) => {
    keyboardNavActive = active;
  };

  // Return the public API
  return {
    handleInitialFocus,
    handleMenuKeydown,
    setupKeyboardHandlers,
    isKeyboardActive,
    setKeyboardActive,
    isTabNavigationActive,
    getFocusableElements,
    findItemById
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