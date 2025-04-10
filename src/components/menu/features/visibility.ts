// src/components/menu/features/visibility.ts
import { BaseComponent, MenuConfig } from '../types';
import { MENU_EVENT, MENU_CLASSES } from '../utils';

/**
 * Adds visibility management functionality to a menu component
 * 
 * This feature adds the ability to show and hide the menu with smooth transitions,
 * along with proper event handling for clicks outside the menu and keyboard shortcuts.
 * It implements the following functionality:
 * 
 * - Tracking visibility state
 * - Showing the menu with animation
 * - Hiding the menu with animation
 * - Automatic handling of clicks outside the menu
 * - Keyboard shortcut (Escape) for dismissing the menu
 * - Proper ARIA attributes for accessibility
 * - Event emission for component state changes
 * 
 * @param {MenuConfig} config - Menu configuration options
 * @returns {Function} Component enhancer function that adds visibility features
 * 
 * @internal
 * @category Components
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
     * 
     * Makes the menu visible with a smooth transition animation.
     * Handles DOM insertion, event binding, and ARIA attribute updates.
     * Emits an 'open' event when the menu becomes visible.
     * 
     * @returns {BaseComponent} The component instance for method chaining
     * @internal
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
      component.element.classList.add(`${prefix}-${MENU_CLASSES.VISIBLE}`);
      component.element.setAttribute('aria-hidden', 'false');

      // Emit open event
      component.emit?.(MENU_EVENT.OPEN, {});

      return this;
    },

    /**
     * Hides the menu
     * 
     * Makes the menu invisible with a smooth transition animation.
     * Handles event cleanup, ARIA attribute updates, and DOM removal.
     * Emits a 'close' event when the menu becomes hidden.
     * Also ensures any open submenus are closed first.
     * 
     * @returns {BaseComponent} The component instance for method chaining
     * @internal
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
      component.element.classList.remove(`${prefix}-${MENU_CLASSES.VISIBLE}`);
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
      component.emit?.(MENU_EVENT.CLOSE, {});

      return this;
    },

    /**
     * Returns whether the menu is currently visible
     * 
     * Provides the current visibility state of the menu component.
     * This method is used internally and exposed via the public API.
     * 
     * @returns {boolean} True if the menu is visible, false otherwise
     * @internal
     */
    isVisible() {
      return isVisible;
    }
  };

  /**
   * Handles clicks outside the menu
   * 
   * Event handler for detecting and responding to mouse clicks outside the menu.
   * Checks if the click occurred outside both the menu and its origin element,
   * and if so, hides the menu. This provides the auto-dismiss behavior expected
   * of temporary surfaces like menus.
   * 
   * @param {MouseEvent} event - Mouse event containing target information
   * @internal
   */
  const handleOutsideClick = (event: MouseEvent) => {
    if (!isVisible) return;

    // Store the opening button if available
    const origin = config.origin?.element;

    // Check if click is outside the menu but not on the opening button
    const clickedElement = event.target as Node;

    // Don't close if the click is inside the menu
    if (component.element.contains(clickedElement)) {
      return;
    }

    // Don't close if the click is on the opening button (it will handle opening/closing)
    if (origin && (origin === clickedElement || origin.contains(clickedElement))) {
      return;
    }

    // If we got here, close the menu
    enhancedComponent.hide?.();
  };

  /**
   * Handles keyboard events for the menu
   * 
   * Event handler for keyboard interactions with the menu.
   * Currently implements the Escape key to dismiss the menu,
   * following standard interaction patterns for temporary UI surfaces.
   * 
   * @param {KeyboardEvent} event - Keyboard event containing key information
   * @internal
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