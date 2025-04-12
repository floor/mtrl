// src/components/menu/features/anchor.ts

import { MenuConfig } from '../types';

/**
 * Adds anchor functionality to menu component
 * Manages the relationship between menu and its anchor element
 * 
 * @param config - Menu configuration
 * @returns Component enhancer with anchor management functionality
 */
export const withAnchor = (config: MenuConfig) => component => {
  if (!component.element) {
    console.warn('Cannot initialize menu anchor: missing element');
    return component;
  }

  // Track anchor state
  const state = {
    anchorElement: null as HTMLElement,
    anchorComponent: null as any
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
      console.log('')
      return anchor.element;
    }

    // Handle direct HTML element
    return anchor as HTMLElement;
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

    // Add click handler
    anchorElement.addEventListener('click', handleAnchorClick);
    
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
   * Handles anchor element click
   */
  const handleAnchorClick = (e: MouseEvent): void => {
    e.preventDefault();
    
    // Toggle menu visibility
    if (component.menu) {
      const isOpen = component.menu.isOpen();
      
      if (isOpen) {
        component.menu.close(e);
      } else {
        component.menu.open(e);
      }
    }
  };

  /**
   * Removes event listeners from anchor
   */
  const cleanup = (): void => {
    if (state.anchorElement) {
      state.anchorElement.removeEventListener('click', handleAnchorClick);
      state.anchorElement.removeAttribute('aria-haspopup');
      state.anchorElement.removeAttribute('aria-expanded');
      state.anchorElement.removeAttribute('aria-controls');
      
      // Clean up active state if present
      if (state.anchorComponent && typeof state.anchorComponent.setActive === 'function') {
        state.anchorComponent.setActive(false);
      } else if (state.anchorElement.classList) {
        state.anchorElement.classList.remove(`${component.getClass('anchor')}--active`);
      }
    }
    
    // Reset state
    state.anchorComponent = null;
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
      
      // If it's a button component, set active state
      if (state.anchorComponent && typeof state.anchorComponent.setActive === 'function') {
        state.anchorComponent.setActive(true);
      } else if (state.anchorElement.classList) {
        // Fallback for regular elements
        state.anchorElement.classList.add(`${component.getClass('anchor')}--active`);
      }
    }
  });

  component.on('close', () => {
    if (state.anchorElement) {
      state.anchorElement.setAttribute('aria-expanded', 'false');
      
      // If it's a button component, remove active state
      if (state.anchorComponent && typeof state.anchorComponent.setActive === 'function') {
        state.anchorComponent.setActive(false);
      } else if (state.anchorElement.classList) {
        // Fallback for regular elements
        state.anchorElement.classList.remove(`${component.getClass('anchor')}--active`);
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
      }
    }
  };
};

export default withAnchor;