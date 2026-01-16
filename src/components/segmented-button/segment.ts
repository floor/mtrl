// src/components/segmented-button/segment.ts

import createButton from "../button";
import { SegmentConfig, Segment } from "./types";
import { DEFAULT_CHECKMARK_ICON } from "./constants";

/**
 * Creates the checkmark element for selected segments
 * MD3 spec: Selected text-only segments show checkmark before text
 * @param {string} prefix - Component prefix
 * @param {string} icon - Custom checkmark icon HTML (optional)
 * @returns {HTMLElement} Checkmark container element
 * @internal
 */
const createCheckmarkElement = (prefix: string, icon?: string): HTMLElement => {
  const checkmark = document.createElement("span");
  checkmark.className = `${prefix}-segment-checkmark`;
  checkmark.innerHTML = icon || DEFAULT_CHECKMARK_ICON;
  return checkmark;
};

/**
 * Creates a segment for the segmented button using the button component
 *
 * Per MD3 specifications:
 * - Text-only segments: Show checkmark BEFORE text when selected
 * - Icon + text segments: Replace icon with checkmark when selected
 * - Icon-only segments: Do NOT show checkmark (icon remains unchanged)
 *
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
  options = { ripple: true, rippleConfig: {} },
): Segment => {
  const isDisabled = groupDisabled || config.disabled;
  const originalIcon = config.icon;
  const hasText = Boolean(config.text);
  const hasIcon = Boolean(originalIcon);
  const isIconOnly = hasIcon && !hasText;
  const isTextOnly = hasText && !hasIcon;
  const checkmarkIcon = config.checkmarkIcon || DEFAULT_CHECKMARK_ICON;

  // Create segment using button component
  const button = createButton({
    text: config.text,
    // For icon+text: if selected, use checkmark instead of original icon
    // For icon-only: always use original icon (no checkmark per MD3)
    // For text-only: no icon initially (checkmark added separately)
    icon: isIconOnly
      ? originalIcon
      : hasIcon && config.selected
        ? checkmarkIcon
        : originalIcon,
    value: config.value || config.text || "",
    disabled: isDisabled,
    ripple: options.ripple,
    rippleConfig: options.rippleConfig,
    class: config.class,
    ariaLabel: config.text || config.value,
  });

  // Add segment-specific classes
  button.element.classList.add(`${prefix}-segmented-button-segment`);

  // Create checkmark element for text-only segments
  // This will be inserted before the text and shown/hidden based on selection
  let checkmarkElement: HTMLElement | null = null;

  if (isTextOnly) {
    checkmarkElement = createCheckmarkElement(prefix, checkmarkIcon);
    // Insert checkmark at the beginning of button content
    const textElement = button.element.querySelector(`.${prefix}-button-text`);
    if (textElement) {
      textElement.parentNode?.insertBefore(checkmarkElement, textElement);
    } else {
      // Fallback: prepend to button
      button.element.prepend(checkmarkElement);
    }
  }

  // Set initial selected state
  if (config.selected) {
    button.element.classList.add(`${prefix}-segment--selected`);
    button.element.setAttribute("aria-pressed", "true");
  } else {
    button.element.setAttribute("aria-pressed", "false");
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
    button.element.setAttribute("aria-pressed", selected ? "true" : "false");

    // Handle icon/checkmark behavior based on segment type
    if (isIconOnly) {
      // Icon-only: Never show checkmark, icon stays the same (per MD3)
      // No action needed
    } else if (hasIcon && hasText) {
      // Icon + text: Swap between original icon and checkmark
      if (selected) {
        button.setIcon(checkmarkIcon);
      } else {
        button.setIcon(originalIcon);
      }
    }
    // Text-only: Checkmark visibility is handled by CSS based on --selected class
  };

  // Initialize state
  let isSelected = config.selected || false;

  return {
    element: button.element,
    value: config.value || config.text || "",

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
      // Remove checkmark element if it exists
      if (checkmarkElement && checkmarkElement.parentNode) {
        checkmarkElement.parentNode.removeChild(checkmarkElement);
      }
      // Use the button's built-in destroy method for cleanup
      button.destroy();
    },
  };
};
