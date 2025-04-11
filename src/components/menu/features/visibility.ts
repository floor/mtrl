// src/components/menu/features/visibility.ts
import { BaseComponent, MenuConfig } from '../types';
import { PREFIX } from '../../../core/config';
import { MENU_EVENT } from '../utils';

/**
 * Adds visibility management functionality to a menu component
 * 
 * This feature adds the ability to show and hide the menu with smooth transitions,
 * proper event handling, and state management.
 * 
 * @param {MenuConfig} config - Menu configuration options
 * @returns {Function} Component enhancer function that adds visibility features
 * 
 * @internal
 */
export const withVisibility = (config: MenuConfig) => (component: BaseComponent): BaseComponent => {
  // State tracking
  let isVisible = false;
  let isTransitioning = false;
  let visibilityLock = false;
  let lockTimeout: number | null = null;
  
  // Document event listeners
  let clickListener: ((e: MouseEvent) => void) | null = null;
  let keydownListener: ((e: KeyboardEvent) => void) | null = null;
  
  // Get the prefix
  const prefix = config.prefix || PREFIX;
  
  // Store original lifecycle methods if they exist
  const originalDestroy = component.lifecycle?.destroy;
  
  /**
   * Handles clicks outside the menu
   * @param {MouseEvent} event - Click event
   */
  const handleOutsideClick = (event: MouseEvent) => {
    if (!isVisible || visibilityLock) return;
    
    // Don't close if click is inside the menu
    if (component.element.contains(event.target as Node)) {
      return;
    }
    
    // Check if the click is on the origin element
    const origin = config.origin?.element || config.origin;
    if (origin && (origin === event.target || origin.contains(event.target as Node))) {
      return;
    }
    
    // Otherwise, hide the menu
    enhancedComponent.hide();
  };
  
  /**
   * Handles keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isVisible || visibilityLock) return;
    
    if (event.key === 'Escape') {
      enhancedComponent.hide();
    }
  };
  
  /**
   * Adds document event listeners
   */
  const addDocumentListeners = () => {
    // Create and store listeners for later removal
    if (!clickListener) {
      clickListener = handleOutsideClick;
      document.addEventListener('click', clickListener);
    }
    
    if (!keydownListener) {
      keydownListener = handleKeyDown;
      document.addEventListener('keydown', keydownListener);
    }
  };
  
  /**
   * Removes document event listeners
   */
  const removeDocumentListeners = () => {
    if (clickListener) {
      document.removeEventListener('click', clickListener);
      clickListener = null;
    }
    
    if (keydownListener) {
      document.removeEventListener('keydown', keydownListener);
      keydownListener = null;
    }
  };
  
  /**
   * Temporarily locks visibility changes to prevent rapid toggling
   */
  const lockVisibilityChanges = () => {
    visibilityLock = true;
    
    // Clear any existing timeout
    if (lockTimeout !== null) {
      window.clearTimeout(lockTimeout);
    }
    
    // Set a new timeout
    lockTimeout = window.setTimeout(() => {
      visibilityLock = false;
      lockTimeout = null;
    }, 300) as unknown as number;
  };
  
  /**
   * Updates component visibility without triggering transitions
   * @param {boolean} visible - Whether the component should be visible
   */
  const updateVisibilityImmediately = (visible: boolean) => {
    // Update internal state
    isVisible = visible;
    isTransitioning = false;
    
    // Update DOM
    component.element.style.display = visible ? 'block' : 'none';
    component.element.setAttribute('aria-hidden', String(!visible));
    component.element.classList.toggle(`${prefix}-menu--visible`, visible);
    
    // Add or remove from DOM (for non-submenus)
    if (!visible && !component.element.classList.contains(`${prefix}-menu--submenu`)) {
      if (component.element.parentNode) {
        component.element.remove();
      }
    }
  };
  
  // Create the enhanced component
  const enhancedComponent: BaseComponent = {
    ...component,
    
    /**
     * Shows the menu
     * @returns {BaseComponent} Component instance for chaining
     */
    show() {
      // Return if already visible, transitioning, or locked
      if (isVisible || isTransitioning || visibilityLock) return this;
      
      // Lock visibility changes temporarily to prevent flickering
      lockVisibilityChanges();
      
      // Set transitioning state
      isTransitioning = true;
      
      // Close any open submenus if this feature exists
      if (component.closeSubmenus) {
        component.closeSubmenus();
      }
      
      // Add to DOM if not already there
      if (!component.element.parentNode) {
        document.body.appendChild(component.element);
      }
      
      // Set initial display state (but not visible class yet)
      component.element.style.display = 'block';
      component.element.setAttribute('aria-hidden', 'false');
      
      // Force reflow to ensure transition works
      // eslint-disable-next-line no-void
      void component.element.offsetWidth;
      
      // Now add visible class to trigger transition
      component.element.classList.add(`${prefix}-menu--visible`);
      
      // Add document event listeners with a small delay
      setTimeout(() => {
        addDocumentListeners();
      }, 10);
      
      // Update state
      isVisible = true;
      
      // Wait for transition to complete
      setTimeout(() => {
        isTransitioning = false;
      }, 300);
      
      // Emit open event
      component.emit?.(MENU_EVENT.OPEN, {});
      
      return this;
    },
    
    /**
     * Hides the menu
     * @returns {BaseComponent} Component instance for chaining
     */
    hide() {
      // Return if already hidden, transitioning, or locked
      if (!isVisible || isTransitioning || visibilityLock) return this;
      
      // Lock visibility changes temporarily to prevent flickering
      lockVisibilityChanges();
      
      // Set transitioning state
      isTransitioning = true;
      
      // Close any open submenus if this feature exists
      if (component.closeSubmenus) {
        component.closeSubmenus();
      }
      
      // Remove document event listeners
      removeDocumentListeners();
      
      // Remove visible class to trigger transition
      component.element.classList.remove(`${prefix}-menu--visible`);
      component.element.setAttribute('aria-hidden', 'true');
      
      // Update state
      isVisible = false;
      
      // Wait for transition to complete before removing from DOM
      setTimeout(() => {
        // Only proceed if we're still not visible (avoid race conditions)
        if (!isVisible) {
          component.element.style.display = 'none';
          
          // Remove from DOM if not a submenu
          if (!component.element.classList.contains(`${prefix}-menu--submenu`)) {
            if (component.element.parentNode) {
              component.element.remove();
            }
          }
        }
        
        isTransitioning = false;
      }, 300);
      
      // Emit close event
      component.emit?.(MENU_EVENT.CLOSE, {});
      
      return this;
    },
    
    /**
     * Returns whether the menu is currently visible
     * @returns {boolean} True if visible, false otherwise
     */
    isVisible() {
      return isVisible;
    }
  };
  
  // Add cleanup to lifecycle
  if (component.lifecycle) {
    component.lifecycle.destroy = () => {
      // Clean up event listeners
      removeDocumentListeners();
      
      // Clear any pending timeouts
      if (lockTimeout !== null) {
        window.clearTimeout(lockTimeout);
        lockTimeout = null;
      }
      
      // Reset state
      isVisible = false;
      isTransitioning = false;
      visibilityLock = false;
      
      // Call original destroy method if it exists
      if (originalDestroy) {
        originalDestroy();
      }
    };
  }
  
  return enhancedComponent;
};