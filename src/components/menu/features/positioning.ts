// src/components/menu/features/positioning.ts
import { BaseComponent, MenuPositionConfig, MenuPosition } from '../types';
import { MENU_ALIGN, MENU_VERTICAL_ALIGN } from '../constants';

/**
 * Positions a menu element relative to a target element
 * @param {HTMLElement} menuElement - Menu element to position
 * @param {HTMLElement} target - Target element to position against
 * @param {MenuPositionConfig} options - Positioning options
 * @returns {MenuPosition} The final position {left, top}
 */
export const positionMenu = (
  menuElement: HTMLElement, 
  target: HTMLElement, 
  options: MenuPositionConfig = {}
): MenuPosition => {
  if (!target || !menuElement) return { left: 0, top: 0 };

  // Force the menu to be visible temporarily to get accurate dimensions
  const originalDisplay = menuElement.style.display;
  const originalVisibility = menuElement.style.visibility;
  const originalOpacity = menuElement.style.opacity;

  menuElement.style.display = 'block';
  menuElement.style.visibility = 'hidden';
  menuElement.style.opacity = '0';

  const targetRect = target.getBoundingClientRect();
  const menuRect = menuElement.getBoundingClientRect();

  // Restore original styles
  menuElement.style.display = originalDisplay;
  menuElement.style.visibility = originalVisibility;
  menuElement.style.opacity = originalOpacity;

  const {
    align = MENU_ALIGN.LEFT,
    vAlign = MENU_VERTICAL_ALIGN.BOTTOM,
    offsetX = 0,
    offsetY = 0
  } = options;

  let left = targetRect.left + offsetX;
  let top = targetRect.bottom + offsetY;

  // Handle horizontal alignment
  if (align === MENU_ALIGN.RIGHT) {
    left = targetRect.right - menuRect.width + offsetX;
  } else if (align === MENU_ALIGN.CENTER) {
    left = targetRect.left + (targetRect.width - menuRect.width) / 2 + offsetX;
  }

  // Handle vertical alignment
  if (vAlign === MENU_VERTICAL_ALIGN.TOP) {
    top = targetRect.top - menuRect.height + offsetY;
  } else if (vAlign === MENU_VERTICAL_ALIGN.MIDDLE) {
    top = targetRect.top + (targetRect.height - menuRect.height) / 2 + offsetY;
  }

  // Determine if this is a submenu
  const isSubmenu = menuElement.classList.contains('mtrl-menu--submenu');

  // Special positioning for submenus
  if (isSubmenu) {
    // By default, position to the right of the parent item
    left = targetRect.right + 2; // Add a small gap
    top = targetRect.top;

    // Check if submenu would go off-screen to the right
    const viewportWidth = window.innerWidth;
    if (left + menuRect.width > viewportWidth) {
      // Position to the left of the parent item instead
      left = targetRect.left - menuRect.width - 2;
    }

    // Check if submenu would go off-screen at the bottom
    const viewportHeight = window.innerHeight;
    if (top + menuRect.height > viewportHeight) {
      // Align with bottom of viewport
      top = Math.max(0, viewportHeight - menuRect.height);
    }
  } else {
    // Standard menu positioning and boundary checking
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left + menuRect.width > viewportWidth) {
      left = Math.max(0, viewportWidth - menuRect.width);
    }

    if (left < 0) left = 0;

    if (top + menuRect.height > viewportHeight) {
      top = Math.max(0, targetRect.top - menuRect.height + offsetY);
    }

    if (top < 0) top = 0;
  }

  // Apply position
  menuElement.style.left = `${left}px`;
  menuElement.style.top = `${top}px`;

  return { left, top };
};

/**
 * Adds positioning functionality to a menu component
 * @param {BaseComponent} component - Menu component
 * @returns {BaseComponent} Enhanced component with positioning methods
 */
export const withPositioning = (component: BaseComponent): BaseComponent => {
  return {
    ...component,

    /**
     * Positions the menu relative to a target element
     * @param {HTMLElement} target - Target element
     * @param {MenuPositionConfig} options - Position options
     * @returns {BaseComponent} Component instance
     */
    position(target: HTMLElement, options?: MenuPositionConfig) {
      positionMenu(component.element, target, options);
      return this;
    }
  };
};