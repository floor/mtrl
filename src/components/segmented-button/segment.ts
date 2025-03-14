// src/components/segmented-button/segment.ts
import { createElement } from '../../core/dom/create';
import { createRipple } from '../../core/build/ripple';
import { SegmentConfig, Segment } from './types';
import { DEFAULT_CHECKMARK_ICON, CLASSES } from './constants';
import { getSegmentConfig } from './config';

/**
 * Creates a segment for the segmented button
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
  const segmentConfig = getSegmentConfig(config, prefix, groupDisabled);
  const element = createElement(segmentConfig);
  
  // Add to container
  container.appendChild(element);
  
  // Create ripple effect if enabled
  let ripple;
  if (options.ripple) {
    ripple = createRipple(options.rippleConfig);
    ripple.mount(element);
  }
  
  // Create text element if provided
  let textElement;
  if (config.text) {
    textElement = createElement({
      tag: 'span',
      className: `${prefix}-${CLASSES.SEGMENT}-${CLASSES.TEXT}`,
      text: config.text,
      container: element
    });
  }
  
  // Create icon and checkmark elements
  let iconElement, checkmarkElement;
  if (config.icon) {
    // Create icon element
    iconElement = createElement({
      tag: 'span',
      className: `${prefix}-${CLASSES.SEGMENT}-${CLASSES.ICON}`,
      html: config.icon,
      container: element
    });
    
    // Create checkmark element (hidden initially)
    checkmarkElement = createElement({
      tag: 'span',
      className: `${prefix}-${CLASSES.SEGMENT}-${CLASSES.CHECKMARK}`,
      html: DEFAULT_CHECKMARK_ICON,
      container: element
    });
    
    // Hide checkmark if not selected
    if (!config.selected) {
      checkmarkElement.style.display = 'none';
    }
    
    // Hide icon if selected and we have text (icon replaced by checkmark)
    if (config.selected && config.text) {
      iconElement.style.display = 'none';
    }
  }
  
  /**
   * Updates the visual state based on selection
   * @param {boolean} selected - Whether the segment is selected
   * @private
   */
  const updateSelectedState = (selected: boolean) => {
    element.classList.toggle(`${prefix}-${CLASSES.SEGMENT}--${CLASSES.SELECTED}`, selected);
    element.setAttribute('aria-pressed', selected ? 'true' : 'false');
    
    // Handle icon/checkmark swap if we have both text and icon
    if (iconElement && checkmarkElement && config.text) {
      iconElement.style.display = selected ? 'none' : '';
      checkmarkElement.style.display = selected ? '' : 'none';
    } else if (checkmarkElement) {
      // If we have only icons (no text), show checkmark based on selection
      checkmarkElement.style.display = selected ? '' : 'none';
    }
  };
  
  /**
   * Updates the disabled state
   * @param {boolean} disabled - Whether the segment is disabled
   * @private
   */
  const updateDisabledState = (disabled: boolean) => {
    const isDisabled = disabled || groupDisabled;
    element.classList.toggle(`${prefix}-${CLASSES.SEGMENT}--${CLASSES.DISABLED}`, isDisabled);
    
    if (isDisabled) {
      element.setAttribute('disabled', 'true');
    } else {
      element.removeAttribute('disabled');
    }
  };
  
  // Value to use for the segment
  const value = config.value || config.text || '';
  
  // Initialize state
  let isSelected = config.selected || false;
  let isDisabled = config.disabled || false;
  
  return {
    element,
    value,
    
    isSelected() {
      return isSelected;
    },
    
    setSelected(selected: boolean) {
      isSelected = selected;
      updateSelectedState(selected);
    },
    
    isDisabled() {
      return isDisabled || groupDisabled;
    },
    
    setDisabled(disabled: boolean) {
      isDisabled = disabled;
      updateDisabledState(disabled);
    },
    
    destroy() {
      // Clean up ripple if it exists
      if (ripple) {
        ripple.unmount(element);
      }
      
      // Remove from DOM
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  };
};