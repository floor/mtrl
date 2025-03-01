// src/components/menu/features/visibility.ts
import { BaseComponent, MenuConfig } from '../types';
import { MENU_EVENTS } from '../constants';

/**
 * Adds visibility management functionality to a menu component
 * @param {MenuConfig} config - Menu configuration
 * @returns {Function} Component enhancer
 */
export const withVisibility = (config: MenuConfig) => (component: BaseComponent): BaseComponent => {
  let isVisible = false;
  let outsideClickHandler: ((event: MouseEvent) => void) | null = null;
  let keydownHandler: ((event: KeyboardEvent) => void) | null = null;
  const prefix = config.prefix || 'mtrl';

  // Create the component interface with hide/show methods first
  const enhancedComponent: BaseComponent = {
    ...component,

    /**
     * Shows the menu
     */
    show() {
      if (isVisible) return this;

      // First set visibility to true to prevent multiple calls
      isVisible = true;

      // Make sure the element is in the DOM
      if (!component.element.parentNode) {
        document.body.appendChild(component.element);
      }

      // Always clean up previous handlers before adding new ones
      if (outsideClickHandler) {
        document.removeEventListener('mousedown', outsideClickHandler);
      }

      // Setup outside click handler for closing
      outsideClickHandler = handleOutsideClick;

      // Use setTimeout to ensure the handler is not triggered immediately
      setTimeout(() => {
        document.addEventListener('mousedown', outsideClickHandler!);
      }, 0);

      // Setup keyboard navigation
      if (!keydownHandler) {
        keydownHandler = handleKeydown;
        document.addEventListener('keydown', keydownHandler);
      }

      // Add display block first for transition to work
      component.element.style.display = 'block';

      // Force a reflow before adding the visible class for animation
      // eslint-disable-next-line no-void
      void component.element.offsetHeight;
      component.element.classList.add(`${prefix}-menu--visible`);
      component.element.setAttribute('aria-hidden', 'false');

      // Emit open event
      component.emit?.(MENU_EVENTS.OPEN, {});

      return this;
    },

    /**
     * Hides the menu
     */
    hide() {
      // Return early if already hidden
      if (!isVisible) return this;

      // First set the visibility flag to false
      isVisible = false;

      // Close any open submenus first
      if (component.closeSubmenus) {
        component.closeSubmenus();
      }

      // Remove ALL event listeners
      if (outsideClickHandler) {
        document.removeEventListener('mousedown', outsideClickHandler);
        outsideClickHandler = null;
      }

      if (keydownHandler) {
        document.removeEventListener('keydown', keydownHandler);
        keydownHandler = null;
      }

      // Hide the menu with visual indication first
      component.element.classList.remove(`${prefix}-menu--visible`);
      component.element.setAttribute('aria-hidden', 'true');

      // Define a reliable cleanup function
      const cleanupElement = () => {
        // Safety check to prevent errors
        if (component.element) {
          component.element.style.display = 'none';

          // Remove from DOM if still attached
          if (component.element.parentNode) {
            component.element.remove();
          }
        }
      };

      // Try to use transition end for smooth animation
      const handleTransitionEnd = (e: TransitionEvent) => {
        if (e.propertyName === 'opacity' || e.propertyName === 'transform') {
          component.element.removeEventListener('transitionend', handleTransitionEnd);
          cleanupElement();
        }
      };

      component.element.addEventListener('transitionend', handleTransitionEnd);

      // Fallback timeout in case transition events don't fire
      // This ensures the menu always gets removed
      setTimeout(cleanupElement, 300);

      // Emit close event
      component.emit?.(MENU_EVENTS.CLOSE, {});

      return this;
    },

    /**
     * Returns whether the menu is currently visible
     * @returns {boolean} Visibility state
     */
    isVisible() {
      return isVisible;
    }
  };

  /**
   * Handles clicks outside the menu
   * @param {MouseEvent} event - Mouse event
   */
  const handleOutsideClick = (event: MouseEvent) => {
    if (!isVisible) return;

    // Store the opening button if available
    const openingButton = config.openingButton?.element;

    // Check if click is outside the menu but not on the opening button
    const clickedElement = event.target as Node;

    // Don't close if the click is inside the menu
    if (component.element.contains(clickedElement)) {
      return;
    }

    // Don't close if the click is on the opening button (it will handle opening/closing)
    if (openingButton && (openingButton === clickedElement || openingButton.contains(clickedElement))) {
      return;
    }

    // If we got here, close the menu
    enhancedComponent.hide?.();
  };

  /**
   * Handles keyboard events
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeydown = (event: KeyboardEvent) => {
    if (!isVisible) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      enhancedComponent.hide?.();
    }
  };

  return enhancedComponent;
};