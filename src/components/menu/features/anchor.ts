// src/components/menu/features/anchor.ts

import { MenuConfig } from '../types';

/**
 * Adds anchor functionality to menu component
 * Manages the relationship between menu and its anchor element
 * 
 * @param config - Menu configuration
 * @returns Component enhancer with anchor management functionality
 */
const withAnchor = (config: MenuConfig) => component => {
  if (!component.element) {
    console.warn('Cannot initialize menu anchor: missing element');
    return component;
  }

  // Track anchor state
  const state = {
    anchorElement: null as HTMLElement,
    anchorComponent: null as any,
    activeClass: '' // Store the appropriate active class based on element type
  };

  /**
   * Resolves the anchor element from string, direct reference, or component
   */
  const resolveAnchor = (anchor: HTMLElement | string | { element: HTMLElement }): HTMLElement => {
    if (!anchor) return null;

    // Handle string selector
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
   * Determine the appropriate active class based on element type
   */
  const determineActiveClass = (element: HTMLElement): string => {
    // Check if this is one of our component types
    const classPrefix = component.getClass('').split('-')[0];
    
    // Check element tag and classes to determine appropriate active class
    if (element.tagName === 'BUTTON') {
      return `${classPrefix}-button--active`;
    } else if (element.classList.contains(`${classPrefix}-chip`)) {
      return `${classPrefix}-chip--selected`;
    } else if (element.classList.contains(`${classPrefix}-textfield`) || 
               element.classList.contains(`${classPrefix}-select`)) {
      return `${classPrefix}-textfield--focused`;
    } else {
      // Default active class for other elements
      return `${classPrefix}-menu-anchor--active`;
    }
  };

  /**
   * Sets up anchor click handler for toggling menu
   */
  const setupAnchorEvents = (anchorElement: HTMLElement, originalAnchor?: any): void => {
    if (!anchorElement) return;

    // Remove previously attached event if any
    if (state.anchorElement && state.anchorElement !== anchorElement) {
      cleanup();
    }

    // Store references
    state.anchorElement = anchorElement;
    
    // Store reference to component if it was provided
    if (originalAnchor && typeof originalAnchor === 'object' && 'element' in originalAnchor) {
      state.anchorComponent = originalAnchor;
    } else {
      state.anchorComponent = null;
    }

    // Determine the appropriate active class for this anchor
    state.activeClass = determineActiveClass(anchorElement);

    // Add click handler
    anchorElement.addEventListener('click', handleAnchorClick);
    
    // Add keyboard handlers
    anchorElement.addEventListener('keydown', handleAnchorKeydown);
    
    // Add blur/focusout handler to close menu when anchor loses focus
    anchorElement.addEventListener('blur', handleAnchorBlur);
    
    // Add ARIA attributes
    anchorElement.setAttribute('aria-haspopup', 'true');
    anchorElement.setAttribute('aria-expanded', 'false');
    
    // Get menu ID or generate one
    let menuId = component.element.id;
    if (!menuId) {
      menuId = `menu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      component.element.id = menuId;
    }
    
    // Connect menu and anchor with ARIA
    anchorElement.setAttribute('aria-controls', menuId);
  };

  /**
   * Applies active visual state to anchor
   */
  const setAnchorActive = (active: boolean): void => {
    if (!state.anchorElement) return;
    
    // For component with setActive method (our button component has this)
    if (state.anchorComponent && typeof state.anchorComponent.setActive === 'function') {
      state.anchorComponent.setActive(active);
    } 
    // For component with .selected property (like our chip component)
    else if (state.anchorComponent && 'selected' in state.anchorComponent) {
      state.anchorComponent.selected = active;
    }
    // Standard DOM element fallback
    else if (state.anchorElement.classList) {
      if (active) {
        // Add the appropriate active class
        state.anchorElement.classList.add(state.activeClass);
      } else {
        // Remove active class
        state.anchorElement.classList.remove(state.activeClass);
      }
    }
  };

  /**
   * Handles anchor element click
   */
  const handleAnchorClick = (e: MouseEvent): void => {
    e.preventDefault();
    
    // Toggle menu visibility with mouse interaction type
    if (component.menu) {
      const isOpen = component.menu.isOpen();
      
      if (isOpen) {
        component.menu.close(e);
      } else {
        component.menu.open(e, 'mouse');
      }
    }
  };
  
  /**
   * Handles keyboard events on the anchor element
   */
  const handleAnchorKeydown = (e: KeyboardEvent): void => {
    // Only handle events if we have a menu controller
    if (!component.menu) return;
    
    // Determine if menu is currently open
    const isOpen = component.menu.isOpen();
    
    switch (e.key) {
      case 'Enter':
      case ' ':  // Space
      case 'ArrowDown':
      case 'Down':
        // Prevent default browser behavior
        e.preventDefault();
        
        // Open menu if closed, with keyboard interaction type
        if (!isOpen) {
          component.menu.open(e, 'keyboard');
        }
        break;
        
      case 'Escape':
        // Close the menu if it's open
        if (isOpen) {
          e.preventDefault();
          component.menu.close(e);
        }
        break;
        
      case 'ArrowUp':
      case 'Up':
        e.preventDefault();
        
        // Special case: open menu with focus on last item
        if (!isOpen) {
          component.menu.open(e, 'keyboard');
          
          // Wait for menu to open and grab the last item
          setTimeout(() => {
            const items = component.element.querySelectorAll(
              `.${component.getClass('menu-item')}:not(.${component.getClass('menu-item--disabled')})`
            ) as NodeListOf<HTMLElement>;
            
            if (items.length > 0) {
              // Reset tabindex for all items
              items.forEach(item => item.setAttribute('tabindex', '-1'));
              
              // Set the last item as active
              const lastItem = items[items.length - 1];
              lastItem.setAttribute('tabindex', '0');
              lastItem.focus();
            }
          }, 100);
        }
        break;
    }
  };

  /**
   * Adds blur/focusout handler to close menu when anchor loses focus
   */
  const handleAnchorBlur = (e: FocusEvent): void => {
    // Only handle events if we have a menu controller and menu is open
    if (!component.menu || !component.menu.isOpen()) return;
    
    // We need to check if focus is moving to an element within the menu
    // If focus is moving to any element within the menu, we should NOT close it
    
    // Get the related target (element receiving focus)
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    // If the relatedTarget is an element within our menu, don't close
    if (relatedTarget && component.element.contains(relatedTarget)) {
      return;
    }
    
    // Wait a brief moment to ensure we're not in the middle of another operation
    // This helps prevent conflicts with click handlers
    setTimeout(() => {
      // Verify menu is still open (may have been closed in the meantime)
      if (component.menu && component.menu.isOpen()) {
        // Close the menu but don't restore focus since focus has moved elsewhere
        component.menu.close(e);
      }
    }, 50);
  };

  /**
   * Removes event listeners from anchor
   */
  const cleanup = (): void => {
    if (state.anchorElement) {
      state.anchorElement.removeEventListener('click', handleAnchorClick);
      state.anchorElement.removeEventListener('keydown', handleAnchorKeydown);
      state.anchorElement.removeEventListener('blur', handleAnchorBlur);
      state.anchorElement.removeAttribute('aria-haspopup');
      state.anchorElement.removeAttribute('aria-expanded');
      state.anchorElement.removeAttribute('aria-controls');
      
      // Clean up active state if present
      setAnchorActive(false);
    }
    
    // Reset state
    state.anchorComponent = null;
    state.activeClass = '';
  };

  // Initialize with provided anchor
  const initialAnchor = config.anchor;
  const initialElement = resolveAnchor(initialAnchor);
  setupAnchorEvents(initialElement, initialAnchor);

  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      cleanup();
      originalDestroy();
    };
  }

  // Listen for menu state changes to update anchor
  component.on('open', () => {
    if (state.anchorElement) {
      state.anchorElement.setAttribute('aria-expanded', 'true');
      setAnchorActive(true);
    }
  });

  /**
   * Update the event listener for menu close event to ensure focus restoration
   */
  component.on('close', (event) => {
    if (state.anchorElement) {
      // Always update ARIA attributes
      state.anchorElement.setAttribute('aria-expanded', 'false');
      setAnchorActive(false);
      
      // Only handle focus restoration for Escape key cases
      // Do NOT restore focus if:
      // 1. It's a tab navigation event, OR
      // 2. There's a next focus element waiting to be focused
      const isTabNavigation = event.isTabNavigation || window._menuNextFocusElement !== null;
      
      if (event.originalEvent?.key === 'Escape' && !isTabNavigation) {
        // Only in this case, restore focus to anchor
        requestAnimationFrame(() => {
          state.anchorElement.focus();
        });
      }
    }
  });

  // Return enhanced component
  return {
    ...component,
    anchor: {
      /**
       * Sets a new anchor element
       * @param anchor - New anchor element, selector, or component
       * @returns Component for chaining
       */
      setAnchor(anchor: HTMLElement | string | { element: HTMLElement }) {
        const newElement = resolveAnchor(anchor);
        if (newElement) {
          setupAnchorEvents(newElement, anchor);
        }
        return component;
      },
      
      /**
       * Gets the current anchor element
       * @returns Current anchor element
       */
      getAnchor() {
        return state.anchorElement;
      },
      
      /**
       * Sets the active state of the anchor
       * @param active - Whether anchor should appear active
       * @returns Component for chaining
       */
      setActive(active: boolean) {
        setAnchorActive(active);
        return component;
      }
    }
  };
};

export default withAnchor;