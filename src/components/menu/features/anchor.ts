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

  // Track keyboard navigation state
  let isTabNavigation = false;

  // Add an event listener to detect Tab key navigation
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Set flag when Tab key is pressed
    isTabNavigation = e.key === 'Tab';
    
    // Reset flag after a short delay
    setTimeout(() => {
      isTabNavigation = false;
    }, 100);
  });

  // Track anchor state
  const state = {
    anchorElement: null as HTMLElement,
    anchorComponent: null as any,
    activeClass: '' // Store the appropriate active class based on element type
  };

  /**
   * Resolves the anchor element from string, direct reference, or component
   * Handles components with element property, components with getElement() method,
   * or DOM elements directly
   */
  const resolveAnchor = (anchor: any): { element: HTMLElement, component: any } => {
    if (!anchor) return { element: null, component: null };

    // Handle string selector
    if (typeof anchor === 'string') {
      const element = document.querySelector(anchor);
      if (!element) {
        console.warn(`Menu anchor not found: ${anchor}`);
        return { element: null, component: null };
      }
      return { element: element as HTMLElement, component: null };
    }
    
    // Handle component with element property (most common case)
    if (typeof anchor === 'object' && anchor !== null) {
      // Case 1: Component with element property
      if ('element' in anchor && anchor.element instanceof HTMLElement) {
        return { element: anchor.element, component: anchor };
      }
      
      // Case 2: Component with getElement method
      if ('getElement' in anchor && typeof anchor.getElement === 'function') {
        const element = anchor.getElement();
        if (element instanceof HTMLElement) {
          return { element, component: anchor };
        }
      }
      
      // Case 3: Component with input property (like textfield)
      if ('input' in anchor && anchor.input instanceof HTMLElement) {
        return { element: anchor.input, component: anchor };
      }
      
      // Case 4: Direct HTML element
      if (anchor instanceof HTMLElement) {
        return { element: anchor, component: null };
      }
    }

    console.warn('Invalid anchor type:', anchor);
    return { element: null, component: null };
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
  const setupAnchorEvents = (anchorData: { element: HTMLElement, component: any }): void => {
    const { element: anchorElement, component: anchorComponent } = anchorData;
    
    if (!anchorElement) return;

    // Remove previously attached event if any
    if (state.anchorElement && state.anchorElement !== anchorElement) {
      cleanup();
    }

    // Store references
    state.anchorElement = anchorElement;
    state.anchorComponent = anchorComponent;
    
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
    
    // Case 1: Component with setActive method (like our button component)
    if (state.anchorComponent && typeof state.anchorComponent.setActive === 'function') {
      state.anchorComponent.setActive(active);
      return;
    }
    
    // Case 2: Component with selected property (like our chip component)
    if (state.anchorComponent && 'selected' in state.anchorComponent) {
      state.anchorComponent.selected = active;
      return;
    }
    
    // Case 3: Textfield component with focus/blur methods
    if (state.anchorComponent && typeof state.anchorComponent.focus === 'function' && 
        typeof state.anchorComponent.blur === 'function') {
      if (active) {
        state.anchorComponent.focus();
      } else {
        state.anchorComponent.blur();
      }
      return;
    }
    
    // Case 4: Standard DOM element fallback with classes
    if (state.anchorElement.classList) {
      if (active) {
        state.anchorElement.classList.add(state.activeClass);
      } else {
        state.anchorElement.classList.remove(state.activeClass);
      }
    }
  };

  /**
   * Restores focus to the anchor properly
   * Handles both component and element cases
   */
  const restoreFocusToAnchor = (): void => {
    // Skip if we don't have a valid anchor
    if (!state.anchorElement) return;
    
    // Case 1: Component with focus method
    if (state.anchorComponent && typeof state.anchorComponent.focus === 'function') {
      requestAnimationFrame(() => {
        state.anchorComponent.focus();
      });
      return;
    }
    
    // Case
    
    // Case 2: Component with input that can be focused (like textfield)
    if (state.anchorComponent && 
        'input' in state.anchorComponent && 
        state.anchorComponent.input instanceof HTMLElement) {
      requestAnimationFrame(() => {
        state.anchorComponent.input.focus();
      });
      return;
    }
    
    // Case 3: Default - focus the element directly
    requestAnimationFrame(() => {
      state.anchorElement.focus();
    });
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
   * Handles anchor blur/focusout events
   */
  const handleAnchorBlur = (e: FocusEvent): void => {
    // Only handle events if we have a menu controller and menu is open
    if (!component.menu || !component.menu.isOpen()) return;
    
    // Get the related target (element receiving focus)
    const relatedTarget = e.relatedTarget as HTMLElement;
    
    // If this is tab navigation, always close the menu regardless of next focus target
    if (isTabNavigation) {
      setTimeout(() => {
        // Verify menu is still open (may have been closed in the meantime)
        if (component.menu && component.menu.isOpen()) {
          // Close the menu but don't restore focus
          component.menu.close(e, false);
        }
      }, 10);
      return;
    }
    
    // For non-tab navigation (like mouse clicks):
    // Don't close if focus is moving to any of these:
    // 1. To the menu itself
    // 2. To a child of the menu
    // 3. To another menu button/anchor
    if (relatedTarget) {
      // Check if focus moved to menu or its children
      if (component.element.contains(relatedTarget)) {
        return;
      }
      
      // Check if focus moved to another menu button/anchor (has aria-haspopup)
      if (relatedTarget.getAttribute('aria-haspopup') === 'true' || 
          relatedTarget.closest('[aria-haspopup="true"]')) {
        return;
      }
    }
    
    // Wait a brief moment to ensure we're not in the middle of another operation
    // This helps prevent conflicts with click handlers
    setTimeout(() => {
      // Verify menu is still open (may have been closed in the meantime)
      if (component.menu && component.menu.isOpen()) {
        // Close the menu but don't restore focus since focus has moved elsewhere
        component.menu.close(e, false);
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
    state.anchorElement = null;
    state.activeClass = '';
  };

  // Initialize with provided anchor
  const { element, component: anchorComponent } = resolveAnchor(config.anchor);
  setupAnchorEvents({ element, component: anchorComponent });

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

  component.on('close', (event) => {
    if (state.anchorElement) {
      // Always update ARIA attributes
      state.anchorElement.setAttribute('aria-expanded', 'false');
      setAnchorActive(false);
      
      // Handle focus restoration when requested
      if (event.restoreFocus && !isTabNavigation) {
        restoreFocusToAnchor();
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
      setAnchor(anchor: any) {
        const resolved = resolveAnchor(anchor);
        if (resolved.element) {
          setupAnchorEvents(resolved);
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
       * Gets the current anchor component if available
       * @returns Current anchor component or null
       */
      getAnchorComponent() {
        return state.anchorComponent;
      },
      
      /**
       * Sets the active state of the anchor
       * @param active - Whether anchor should appear active
       * @returns Component for chaining
       */
      setActive(active: boolean) {
        setAnchorActive(active);
        return component;
      },
      
      /**
       * Restores focus to the anchor
       * @returns Component for chaining
       */
      focus() {
        restoreFocusToAnchor();
        return component;
      }
    }
  };
};

export default withAnchor;