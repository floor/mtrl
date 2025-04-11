// src/components/menu/features/keyboard-navigation.ts
import { PREFIX } from '../../../core/config';
import { BaseComponent, MenuConfig } from '../types';

/**
 * Adds keyboard navigation functionality to a menu component
 * 
 * This feature:
 * - Enables keyboard focus and navigation between menu items
 * - Implements arrow key navigation (up/down/left/right)
 * - Handles Enter/Space for selection
 * - Manages Escape for dismissal
 * - Implements submenu navigation
 * 
 * @param {MenuConfig} config - Menu configuration
 * @returns {Function} Component enhancer
 * 
 * @internal
 */
export const withKeyboardNavigation = (config: MenuConfig) => (component: BaseComponent): BaseComponent => {
  // Store references to original methods
  const originalShow = component.show;
  const originalHide = component.hide;
  const originalDestroy = component.lifecycle?.destroy;
  
  // Track event handlers
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  
  // Get prefix
  const prefix = config.prefix || PREFIX;
  
  /**
   * Handles keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeydown = (event: KeyboardEvent): void => {
    // Only process if menu is visible
    if (!component.isVisible?.()) return;
    
    // Get necessary elements
    const list = component.element.querySelector(`.${prefix}-menu-list`);
    if (!list) return;
    
    // Get all focusable items
    const items = Array.from(
      list.querySelectorAll(`.${prefix}-menu-item:not([aria-disabled="true"])`)
    ) as HTMLElement[];
    
    if (items.length === 0) return;
    
    // Get the currently focused item
    const focusedItem = document.activeElement as HTMLElement;
    const isFocusedInMenu = focusedItem && list.contains(focusedItem);
    
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        
        if (!isFocusedInMenu) {
          // Focus first item if nothing is focused
          items[0].focus();
        } else {
          // Find current index
          const currentIndex = items.indexOf(focusedItem);
          if (currentIndex >= 0) {
            // Focus next item (wrapping to first if needed)
            const nextItem = items[currentIndex + 1] || items[0];
            nextItem.focus();
          } else {
            // Focus first item as fallback
            items[0].focus();
          }
        }
        break;
      }
      
      case 'ArrowUp': {
        event.preventDefault();
        
        if (!isFocusedInMenu) {
          // Focus last item if nothing is focused
          items[items.length - 1].focus();
        } else {
          // Find current index
          const currentIndex = items.indexOf(focusedItem);
          if (currentIndex >= 0) {
            // Focus previous item (wrapping to last if needed)
            const prevItem = items[currentIndex - 1] || items[items.length - 1];
            prevItem.focus();
          } else {
            // Focus last item as fallback
            items[items.length - 1].focus();
          }
        }
        break;
      }
      
      case 'ArrowRight': {
        // Only handle if a submenu item is focused
        if (isFocusedInMenu && 
            focusedItem.classList.contains(`${prefix}-menu-item--submenu`) &&
            focusedItem.getAttribute('aria-expanded') !== 'true') {
          
          event.preventDefault();
          
          // Trigger the click event to open the submenu
          focusedItem.click();
        }
        break;
      }
      
      case 'ArrowLeft': {
        // Only handle in submenus
        if (component.element.classList.contains(`${prefix}-menu--submenu`)) {
          event.preventDefault();
          
          // Hide this submenu
          component.hide?.();
          
          // Focus the parent item if available
          if (config.parentItem) {
            (config.parentItem as HTMLElement).focus();
          }
        }
        break;
      }
      
      case 'Enter':
      case ' ': {
        // Only process if an item is focused
        if (isFocusedInMenu && focusedItem.classList.contains(`${prefix}-menu-item`)) {
          event.preventDefault();
          
          // Trigger click on the focused item
          focusedItem.click();
        }
        break;
      }
      
      case 'Escape': {
        event.preventDefault();
        
        // Hide the menu
        component.hide?.();
        
        // Focus the origin element if available
        if (component.origin) {
          (component.origin as HTMLElement).focus();
        }
        break;
      }
      
      case 'Home': {
        if (items.length > 0) {
          event.preventDefault();
          items[0].focus();
        }
        break;
      }
      
      case 'End': {
        if (items.length > 0) {
          event.preventDefault();
          items[items.length - 1].focus();
        }
        break;
      }
      
      case 'Tab': {
        // Allow normal tab behavior, but hide the menu when focus leaves
        setTimeout(() => {
          if (document.activeElement && !component.element.contains(document.activeElement)) {
            component.hide?.();
          }
        }, 0);
        break;
      }
    }
  };
  
  /**
   * Makes menu items focusable
   */
  const makeItemsFocusable = (): void => {
    const items = component.element.querySelectorAll(`.${prefix}-menu-item:not([aria-disabled="true"])`);
    items.forEach(item => {
      item.setAttribute('tabindex', '-1'); // Default all items to -1
    });
    
    // Make the menu itself focusable
    component.element.setAttribute('tabindex', '0');
  };
  
  /**
   * Setup keyboard event listeners
   */
  const setupKeyboardListeners = (): void => {
    if (!keydownHandler) {
      keydownHandler = handleKeydown;
      document.addEventListener('keydown', keydownHandler);
    }
  };
  
  /**
   * Cleanup keyboard event listeners
   */
  const cleanupKeyboardListeners = (): void => {
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }
  };
  
  // Return the enhanced component
  const enhancedComponent: BaseComponent = {
    ...component,
    
    /**
     * Shows the menu and sets up keyboard navigation
     */
    show() {
      // Call the original show method first
      const result = originalShow?.call(this) || this;
      
      // Make items focusable
      makeItemsFocusable();
      
      // Add keyboard event listeners
      setupKeyboardListeners();
      
      // Focus the menu container itself, not the first item
      // This allows keyboard navigation to start without auto-selecting anything
      component.element.focus();
      
      return result;
    },
    
    /**
     * Hides the menu and cleans up keyboard navigation
     */
    hide() {
      // Clean up keyboard listeners
      cleanupKeyboardListeners();
      
      // Call the original hide method
      return originalHide?.call(this) || this;
    }
  };
  
  // Add cleanup to lifecycle
  if (component.lifecycle) {
    component.lifecycle.destroy = () => {
      // Clean up keyboard listeners
      cleanupKeyboardListeners();
      
      // Call original destroy method if it exists
      if (originalDestroy) {
        originalDestroy();
      }
    };
  }
  
  return enhancedComponent;
};