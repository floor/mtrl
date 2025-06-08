// src/components/badge/api.ts
import {
  BadgeComponent,
  BadgeColor,
  BadgeVariant,
  BadgePosition,
} from "./types";
import { formatBadgeLabel } from "./config";

/**
 * API configuration options for badge component
 * @category Components
 * @internal
 */
interface ApiOptions {
  visibility: {
    show: () => void;
    hide: () => void;
    toggle: (visible?: boolean) => void;
    isVisible: () => boolean;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Component with required elements and methods for API enhancement
 * @category Components
 * @internal
 */
interface ComponentWithElements {
  element: HTMLElement;
  wrapper?: HTMLElement;
  config: {
    max?: number;
    label?: string | number;
    variant?: string;
  };
  getClass: (name: string) => string;
  addClass: (...classes: string[]) => ComponentWithElements;
  removeClass: (...classes: string[]) => ComponentWithElements;
  on: (event: string, handler: Function) => ComponentWithElements;
  off: (event: string, handler: Function) => ComponentWithElements;
}

// Common variant constants for internal use
const VARIANT_SMALL = "small";

// Map of all badge colors for class removal
const ALL_COLORS = [
  "error",
  "primary",
  "secondary",
  "tertiary",
  "success",
  "warning",
  "info",
];

// Map of all badge variants for class removal
const ALL_VARIANTS = ["small", "large"];

// Map of all badge positions for class removal
const ALL_POSITIONS = ["top-right", "top-left", "bottom-right", "bottom-left"];

/**
 * Enhances a badge component with API methods.
 * This follows the higher-order function pattern to add public API methods
 * to the component, making them available to the end user.
 *
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @category Components
 * @internal This is an internal utility for the Badge component
 */
export const withAPI =
  ({ visibility, lifecycle }: ApiOptions) =>
  (component: ComponentWithElements): BadgeComponent => {
    const badgeComponent: BadgeComponent = {
      // Spread component properties
      element: component.element,
      wrapper: component.wrapper,
      config: component.config,
      getClass: component.getClass,

      /**
       * Sets the badge label
       * @param {string|number} label - Label to display in the badge
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      setLabel(label: string | number) {
        component.config.label = label;

        // Small badges (dot variant) don't have text
        if (component.config.variant === VARIANT_SMALL) {
          component.element.textContent = "";
          return badgeComponent;
        }

        // Format the label
        const formattedLabel = formatBadgeLabel(label, component.config.max);
        component.element.textContent = formattedLabel;

        // Add overflow class if label was truncated
        component.element.classList.remove(
          `${component.getClass("badge")}--overflow`
        );
        if (
          typeof label === "number" &&
          component.config.max !== undefined &&
          label > component.config.max
        ) {
          component.element.classList.add(
            `${component.getClass("badge")}--overflow`
          );
        }

        // Toggle visibility based on whether label is empty
        if (formattedLabel === "" || formattedLabel === "0") {
          badgeComponent.hide();
        } else {
          badgeComponent.show();
        }

        return badgeComponent;
      },

      /**
       * Gets the badge label
       * @returns {string} Current badge label
       */
      getLabel() {
        return component.element.textContent || "";
      },

      /**
       * Shows the badge
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      show() {
        visibility.show();
        return badgeComponent;
      },

      /**
       * Hides the badge
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      hide() {
        visibility.hide();
        return badgeComponent;
      },

      /**
       * Toggles badge visibility
       * @param {boolean} [visible] - Optional flag to force visibility state
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      toggle(visible?: boolean) {
        visibility.toggle(visible);
        return badgeComponent;
      },

      /**
       * Checks if the badge is visible
       * @returns {boolean} True if badge is visible
       */
      isVisible() {
        return visibility.isVisible();
      },

      /**
       * Sets maximum value (after which badge shows max+)
       *
       * @param {number} max - Maximum value to display
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      setMax(max: number) {
        component.config.max = max;

        // Apply max formatting if current label exceeds max
        if (component.config.label !== undefined) {
          badgeComponent.setLabel(component.config.label);
        }

        return badgeComponent;
      },

      /**
       * Sets badge color
       * @param {string} color - Color variant to apply
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      setColor(color: BadgeColor | string) {
        // Remove existing color classes
        ALL_COLORS.forEach((colorName) => {
          component.element.classList.remove(
            `${component.getClass("badge")}--${colorName}`
          );
        });

        // Add new color class
        component.element.classList.add(
          `${component.getClass("badge")}--${color}`
        );
        return badgeComponent;
      },

      /**
       * Sets badge variant
       * @param {string} variant - Variant to apply (small or large)
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      setVariant(variant: BadgeVariant | string) {
        // Remove existing variant classes
        ALL_VARIANTS.forEach((variantName) => {
          component.element.classList.remove(
            `${component.getClass("badge")}--${variantName}`
          );
        });

        // Add new variant class
        component.element.classList.add(
          `${component.getClass("badge")}--${variant}`
        );

        // Update component config
        component.config.variant = variant;

        // Update accessibility attributes
        if (variant === VARIANT_SMALL) {
          component.element.textContent = "";
          component.element.setAttribute("aria-hidden", "true");
        } else {
          component.element.setAttribute("role", "status");

          // Restore label for large badges
          if (component.config.label !== undefined) {
            badgeComponent.setLabel(component.config.label);
          }
        }

        return badgeComponent;
      },

      /**
       * Sets badge position
       * @param {string} position - Position variant to apply
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      setPosition(position: BadgePosition | string) {
        // Remove existing position classes
        ALL_POSITIONS.forEach((posName) => {
          component.element.classList.remove(
            `${component.getClass("badge")}--${posName}`
          );
        });

        // Add new position class
        component.element.classList.add(
          `${component.getClass("badge")}--${position}`
        );

        return badgeComponent;
      },

      /**
       * Attaches badge to a target element
       * @param {HTMLElement} target - Element to attach badge to
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      attachTo(target: HTMLElement) {
        // If we already have a wrapper, remove the badge from it
        if (
          component.wrapper &&
          component.wrapper.contains(component.element)
        ) {
          component.wrapper.removeChild(component.element);
        }

        // Create a new wrapper to hold the target and badge
        const wrapper = document.createElement("div");
        wrapper.classList.add(component.getClass("badge-wrapper"));
        wrapper.style.position = "relative";

        // Replace the target with the wrapper
        const parent = target.parentNode;
        if (parent) {
          parent.replaceChild(wrapper, target);
          wrapper.appendChild(target);
          wrapper.appendChild(component.element);

          // Make sure the badge is positioned
          component.element.classList.add(
            `${component.getClass("badge")}--positioned`
          );

          // Save the wrapper reference
          component.wrapper = wrapper;
          badgeComponent.wrapper = wrapper;
        }

        return badgeComponent;
      },

      /**
       * Makes badge standalone (removes from wrapper)
       * @returns {BadgeComponent} Badge component instance for chaining
       */
      detach() {
        if (
          component.wrapper &&
          component.wrapper.contains(component.element)
        ) {
          // Remove the badge from the wrapper
          component.wrapper.removeChild(component.element);

          // Remove the positioned class
          component.element.classList.remove(
            `${component.getClass("badge")}--positioned`
          );

          // Add the badge to the document body or another container
          document.body.appendChild(component.element);

          // Clear the wrapper reference
          component.wrapper = undefined;
          badgeComponent.wrapper = undefined;
        }

        return badgeComponent;
      },

      /**
       * Destroys the badge component and cleans up resources
       */
      destroy() {
        lifecycle.destroy();

        // If badge is in a wrapper, restore the original DOM structure
        if (component.wrapper) {
          const target = component.wrapper.firstChild as HTMLElement;
          const parent = component.wrapper.parentNode;

          if (parent && target) {
            parent.replaceChild(target, component.wrapper);
          }
        }
      },

      // Forward basic component methods for API consistency
      addClass: (...classes: string[]) => {
        component.addClass(...classes);
        return badgeComponent;
      },
      removeClass: (...classes: string[]) => {
        component.removeClass(...classes);
        return badgeComponent;
      },
      on: (event: string, handler: Function) => {
        component.on(event, handler);
        return badgeComponent;
      },
      off: (event: string, handler: Function) => {
        component.off(event, handler);
        return badgeComponent;
      },
    };

    return badgeComponent;
  };
