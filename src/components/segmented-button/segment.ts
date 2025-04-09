// src/components/segmented-button/segment.ts
import createButton from '../button';
import { SegmentConfig, Segment } from './types';
import { DEFAULT_CHECKMARK_ICON } from './config';

/**
 * Creates a segment for the segmented button using the button component
 * @param {SegmentConfig} config - Segment configuration
 * @param {HTMLElement} container - Container element
 * @param {string} prefix - Component prefix
 * @param {boolean} groupDisabled - Whether the entire group is disabled
 * @param {Object} options - Additional options
 * @returns {Segment} Segment object
 * @internal
 */
export const createSegment = (
  config: SegmentConfig, 
  container: HTMLElement,
  prefix: string,
  groupDisabled = false,
  options = { ripple: true, rippleConfig: {} }
): Segment => {
  const isDisabled = groupDisabled || config.disabled;
  const originalIcon = config.icon;
  const checkmarkIcon = config.checkmarkIcon || DEFAULT_CHECKMARK_ICON;

  // Create segment using button component with appropriate initial icon
  const button = createButton({
    text: config.text,
    // If selected and has both icon and text, use checkmark instead of the original icon
    icon: (config.selected && config.text && originalIcon) ? checkmarkIcon : originalIcon,
    value: config.value || config.text || '',
    disabled: isDisabled,
    ripple: options.ripple,
    rippleConfig: options.rippleConfig,
    class: config.class,
    // No variant - we'll style it via the segmented button styles
  });

  // Add segment-specific classes
  button.element.classList.add(`${prefix}-segmented-button-segment`);
  
  // Set initial selected state
  if (config.selected) {
    button.element.classList.add(`${prefix}-segment--selected`);
    button.element.setAttribute('aria-pressed', 'true');
  } else {
    button.element.setAttribute('aria-pressed', 'false');
  }
  
  // Add to container
  container.appendChild(button.element);
  
  /**
   * Updates the visual state based on selection
   * @param {boolean} selected - Whether the segment is selected
   * @private
   */
  const updateSelectedState = (selected: boolean) => {
    button.element.classList.toggle(`${prefix}-segment--selected`, selected);
    button.element.setAttribute('aria-pressed', selected ? 'true' : 'false');
    
    // Handle icon/checkmark swap if we have both text and original icon
    if (config.text && originalIcon) {
      if (selected) {
        // When selected and has both text and icon, show checkmark
        button.setIcon(checkmarkIcon);
      } else {
        // When not selected, restore original icon
        button.setIcon(originalIcon);
      }
    }
  };
  
  // Initialize state
  let isSelected = config.selected || false;
  
  return {
    element: button.element,
    value: config.value || config.text || '',
    
    isSelected() {
      return isSelected;
    },
    
    setSelected(selected: boolean) {
      isSelected = selected;
      updateSelectedState(selected);
    },
    
    isDisabled() {
      return button.disabled?.isDisabled?.() || false;
    },
    
    setDisabled(disabled: boolean) {
      if (disabled) {
        button.disable();
      } else {
        button.enable();
      }
    },
    
    destroy() {
      // Use the button's built-in destroy method for cleanup
      button.destroy();
    }
  };
};