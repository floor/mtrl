// src/components/menu/features/opener.ts

import { MenuConfig } from '../types';

/**
 * Adds opener functionality to menu component
 * Manages the relationship between menu and its opener element
 * 
 * @param config - Menu configuration
 * @returns Component enhancer with opener management functionality
 */
const withOpener = (config: MenuConfig) => component => {
  if (!component.element) {
    console.warn('Cannot initialize menu opener: missing element');
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

  // Track opener state
  const state = {
    openerElement: null as HTMLElement,
    openerComponent: null as any,
    activeClass: '' // Store the appropriate active class based on element type
  };

  /**
   * Resolves the opener element from string, direct reference, or component
   * Handles components with element property, components with getElement() method,
   * or DOM elements directly
   */
  const resolveOpener = (opener: any): { element: HTMLElement, component: any } => {
    if (!opener) return { element: null, component: null };

    // Handle string selector
    if (typeof opener === 'string') {
      const element = document.querySelector(opener);
      if (!element) {
        console.warn(`Menu opener not found: ${opener}`);
        return { element: null, component: null };
      }
      return { element: element as HTMLElement, component: null };
    }
    
    // Handle component with element property (most common case)
    if (typeof opener === 'object' && opener !== null) {
      // Case 1: Component with element property
      if ('element' in opener && opener.element instanceof HTMLElement) {
        return { element: opener.element, component: opener };
      }
      
      // Case 2: Component with getElement method
      if ('getElement' in opener && typeof opener.getElement === 'function') {
        const element = opener.getElement();
        if (element instanceof HTMLElement) {
          return { element, component: opener };
        }
      }
      
      // Case 3: Component with input property (like textfield)
      if ('input' in opener && opener.input instanceof HTMLElement) {
        return { element: opener.input, component: opener };
      }
      
      // Case 4: Direct HTML element
      if (opener instanceof HTMLElement) {
        return { element: opener, component: null };
      }
    }

    console.warn('Invalid opener type:', opener);
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
      return `${classPrefix}-menu-opener--active`;
    }
  };

  /**
   * Sets up opener click handler for toggling menu
   */
  const setupOpenerEvents = (openerData: { element: HTMLElement, component: any }): void => {
    const { element: openerElement, component: openerComponent } = openerData;
    
    if (!openerElement) return;

    // Remove previously attached event if any
    if (state.openerElement && state.openerElement !== openerElement) {
      cleanup();
    }

    // Store references
    state.openerElement = openerElement;
    state.openerComponent = openerComponent;
    
    // Determine the appropriate active class for this opener
    state.activeClass = determineActiveClass(openerElement);

    // Add click handler
    openerElement.addEventListener('click', handleOpenerClick);
    
    // Add keyboard handlers
    openerElement.addEventListener('keydown', handleOpenerKeydown);
    
    // Add blur/focusout handler to close menu when opener loses focus
    openerElement.addEventListener('blur', handleOpenerBlur);
    
    // Add ARIA attributes
    openerElement.setAttribute('aria-haspopup', 'true');
    openerElement.setAttribute('aria-expanded', 'false');
    
    // Get menu ID or generate one
    let menuId = component.element.id;
    if (!menuId) {
      menuId = `menu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      component.element.id = menuId;
    }
    
    // Connect menu and opener with ARIA
    openerElement.setAttribute('aria-controls', menuId);
  };

  /**
   * Applies active visual state to opener
   */
  const setOpenerActive = (active: boolean): void => {
    if (!state.openerElement) return;
    
    // Case 1: Component with setActive method (like our button component)
    if (state.openerComponent && typeof state.openerComponent.setActive === 'function') {
      state.openerComponent.setActive(active);
      return;
    }
    
    // Case 2: Component with selected property (like our chip component)
    if (state.openerComponent && 'selected' in state.openerComponent) {
      state.openerComponent.selected = active;
      return;
    }
    
    // Case 3: Textfield component with focus/blur methods
    if (state.openerComponent && typeof state.openerComponent.focus === 'function' && 
        typeof state.openerComponent.blur === 'function') {
      if (active) {
        state.openerComponent.focus();
      } else {
        state.openerComponent.blur();
      }
      return;
    }
    
    // Case 4: Standard DOM element fallback with classes
    if (state.openerElement.classList) {
      if (active) {
        state.openerElement.classList.add(state.activeClass);
      } else {
        state.openerElement.classList.remove(state.activeClass);
      }
    }
  };

  /**
   * Restores focus to the opener properly
   * Handles both component and element cases
   */
  const restoreFocusToOpener = (): void => {
    // Skip if we don't have a valid opener
    if (!state.openerElement) return;
    
    // Case 1: Component with focus method
    if (state.openerComponent && typeof state.openerComponent.focus === 'function') {
      requestAnimationFrame(() => {
        state.openerComponent.focus();
      });
      return;
    }
    
    // Case
    
    // Case 2: Component with input that can be focused (like textfield)
    if (state.openerComponent && 
        'input' in state.openerComponent && 
        state.openerComponent.input instanceof HTMLElement) {
      requestAnimationFrame(() => {
        state.openerComponent.input.focus();
      });
      return;
    }
    
    // Case 3: Default - focus the element directly
    requestAnimationFrame(() => {
      state.openerElement.focus();
    });
  };

  /**
   * Handles opener element click
   */
  const handleOpenerClick = (e: MouseEvent): void => {
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
   * Handles keyboard events on the opener element
   */
  const handleOpenerKeydown = (e: KeyboardEvent): void => {
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
   * Handles opener blur/focusout events
   */
  const handleOpenerBlur = (e: FocusEvent): void => {
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
    // 3. To another menu button/opener
    if (relatedTarget) {
      // Check if focus moved to menu or its children
      if (component.element.contains(relatedTarget)) {
        return;
      }
      
      // Check if focus moved to another menu button/opener (has aria-haspopup)
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
   * Removes event listeners from opener
   */
  const cleanup = (): void => {
    if (state.openerElement) {
      state.openerElement.removeEventListener('click', handleOpenerClick);
      state.openerElement.removeEventListener('keydown', handleOpenerKeydown);
      state.openerElement.removeEventListener('blur', handleOpenerBlur);
      state.openerElement.removeAttribute('aria-haspopup');
      state.openerElement.removeAttribute('aria-expanded');
      state.openerElement.removeAttribute('aria-controls');
      
      // Clean up active state if present
      setOpenerActive(false);
    }
    
    // Reset state
    state.openerComponent = null;
    state.openerElement = null;
    state.activeClass = '';
  };

  // Initialize with provided opener
  const { element, component: openerComponent } = resolveOpener(config.opener);
  setupOpenerEvents({ element, component: openerComponent });

  // Register with lifecycle if available
  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy || (() => {});
    component.lifecycle.destroy = () => {
      cleanup();
      originalDestroy();
    };
  }

  // Listen for menu state changes to update opener
  component.on('open', () => {
    if (state.openerElement) {
      state.openerElement.setAttribute('aria-expanded', 'true');
      setOpenerActive(true);
    }
  });

  component.on('close', (event) => {
    if (state.openerElement) {
      // Always update ARIA attributes
      state.openerElement.setAttribute('aria-expanded', 'false');
      setOpenerActive(false);
      
      // Handle focus restoration when requested
      if (event.restoreFocus && !isTabNavigation) {
        restoreFocusToOpener();
      }
    }
  });

  // Return enhanced component
  return {
    ...component,
    opener: {
      /**
       * Sets a new opener element
       * @param opener - New opener element, selector, or component
       * @returns Component for chaining
       */
      setOpener(opener: any) {
        const resolved = resolveOpener(opener);
        if (resolved.element) {
          setupOpenerEvents(resolved);
        }
        return component;
      },
      
      /**
       * Gets the current opener element
       * @returns Current opener element
       */
      getOpener() {
        return state.openerElement;
      },
      
      /**
       * Gets the current opener component if available
       * @returns Current opener component or null
       */
      getOpenerComponent() {
        return state.openerComponent;
      },
      
      /**
       * Sets the active state of the opener
       * @param active - Whether opener should appear active
       * @returns Component for chaining
       */
      setActive(active: boolean) {
        setOpenerActive(active);
        return component;
      },
      
      /**
       * Restores focus to the opener
       * @returns Component for chaining
       */
      focus() {
        restoreFocusToOpener();
        return component;
      }
    }
  };
};

export default withOpener;