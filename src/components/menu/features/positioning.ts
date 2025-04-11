// src/components/menu/features/positioning.ts
import { PREFIX } from '../../../core/config';
import { BaseComponent, MenuPositionConfig } from '../types';

/**
 * Adds positioning functionality to a menu component
 * 
 * This feature:
 * - Positions the menu relative to a target element
 * - Handles different alignment options
 * - Ensures the menu stays within viewport boundaries
 * - Provides special handling for submenus
 * 
 * @returns {Function} Component enhancer
 * 
 * @internal
 */
export const withPositioning = () => (component: BaseComponent): BaseComponent => {
  /**
   * Positions the menu relative to a target element
   * 
   * @param {HTMLElement} target - Target element to position against
   * @param {MenuPositionConfig} options - Positioning options
   * @returns {BaseComponent} Component instance for chaining
   */
  const position = (target: HTMLElement, options: MenuPositionConfig = {}): BaseComponent => {
    if (!target || !component.element) return component;
    
    // Parse options with defaults
    const {
      align = 'left',
      vAlign = 'bottom',
      offsetX = 0,
      offsetY = 0
    } = options;
    
    // Get target and menu dimensions
    const targetRect = target.getBoundingClientRect();
    
    // Make menu temporarily visible to get dimensions
    const originalDisplay = component.element.style.display;
    const originalVisibility = component.element.style.visibility;
    
    component.element.style.display = 'block';
    component.element.style.visibility = 'hidden';
    
    const menuRect = component.element.getBoundingClientRect();
    
    // Restore original styles
    component.element.style.display = originalDisplay;
    component.element.style.visibility = originalVisibility;
    
    // Calculate initial position
    let left = targetRect.left + offsetX;
    let top = targetRect.bottom + offsetY;
    
    // Handle horizontal alignment
    if (align === 'right') {
      left = targetRect.right - menuRect.width + offsetX;
    } else if (align === 'center') {
      left = targetRect.left + (targetRect.width - menuRect.width) / 2 + offsetX;
    }
    
    // Handle vertical alignment
    if (vAlign === 'top') {
      top = targetRect.top - menuRect.height + offsetY;
    } else if (vAlign === 'middle') {
      top = targetRect.top + (targetRect.height - menuRect.height) / 2 + offsetY;
    }
    
    // Special handling for submenus
    const isSubmenu = component.element.classList.contains(`${PREFIX}-menu--submenu`);
    if (isSubmenu) {
      // Default position for submenu (to the right of the parent item)
      left = targetRect.right + 2; // Small gap
      top = targetRect.top;
      
      // Check if submenu would go off the right edge of the viewport
      if (left + menuRect.width > window.innerWidth) {
        // Position to the left of the parent item instead
        left = targetRect.left - menuRect.width - 2;
      }
      
      // Check if submenu would go below the bottom of the viewport
      if (top + menuRect.height > window.innerHeight) {
        // Adjust top position to fit within viewport
        top = Math.max(0, window.innerHeight - menuRect.height);
      }
    } else {
      // Regular menu boundary checking
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Prevent horizontal overflow
      if (left < 0) {
        left = 0;
      } else if (left + menuRect.width > viewportWidth) {
        left = Math.max(0, viewportWidth - menuRect.width);
      }
      
      // Prevent vertical overflow
      if (top + menuRect.height > viewportHeight) {
        // Try positioning above the target
        const topPosition = targetRect.top - menuRect.height + offsetY;
        
        if (topPosition >= 0) {
          // If it fits above, position it there
          top = topPosition;
        } else {
          // Otherwise position at top of viewport
          top = 0;
        }
      } else if (top < 0) {
        top = 0;
      }
    }
    
    // Update menu position
    component.element.style.position = 'fixed';
    component.element.style.left = `${Math.round(left)}px`;
    component.element.style.top = `${Math.round(top)}px`;
    
    // Store origin for potential repositioning
    component.origin = target;
    
    return component;
  };
  
  return {
    ...component,
    position,
    origin: null
  };
};