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
    anchorElement: null as HTMLElement
  };

  /**
   * Resolves the anchor element from string or direct reference
   */
  const resolveAnchor = (anchor: HTMLElement | string): HTMLElement => {
    if (!anchor) return null;

    if (typeof anchor === 'string') {
      const element = document.querySelector(anchor);
      if (!element) {
        console.warn(`Menu anchor not found: ${anchor}`);
        return null;
      }
      return element as HTMLElement;
    }

    return anchor;
  };

  /**
   * Sets up anchor click handler for toggling menu
   */
  const setupAnchorEvents = (anchorElement: HTMLElement): void => {
    if (!anchorElement) return;

    // Remove previously attached event if any
    if (state.anchorElement && state.anchorElement !== anchorElement) {
      cleanup();
    }

    // Store reference
    state.anchorElement = anchorElement;

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
        state.anchorElement.setAttribute('aria-expanded', 'false');
      } else {
        component.menu.open(e);
        state.anchorElement.setAttribute('aria-expanded', 'true');
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
    }
  };

  // Initialize with provided anchor
  const initialAnchor = resolveAnchor(config.anchor);
  setupAnchorEvents(initialAnchor);

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
    }
  });

  component.on('close', () => {
    if (state.anchorElement) {
      state.anchorElement.setAttribute('aria-expanded', 'false');
    }
  });

  // Return enhanced component
  return {
    ...component,
    anchor: {
      /**
       * Sets a new anchor element
       * @param anchor - New anchor element or selector
       * @returns Component for chaining
       */
      setAnchor(anchor: HTMLElement | string) {
        const newAnchor = resolveAnchor(anchor);
        if (newAnchor) {
          setupAnchorEvents(newAnchor);
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