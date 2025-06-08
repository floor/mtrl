// src/components/slider/features/states.ts
import { SLIDER_COLORS, SliderColor } from "../types";
import { SLIDER_SIZES, SliderSize } from "../constants";
import { SliderConfig } from "../types";

/**
 * Add state management features to slider component
 * Combines appearance and disabled functionality into a single feature
 *
 * @param config Slider configuration
 * @returns Component enhancer with state management features
 */
export const withStates = (config: SliderConfig) => (component) => {
  // Track initial disabled state
  const isDisabled = config.disabled === true;

  // Apply initial disabled state if needed
  if (isDisabled) {
    setTimeout(() => {
      disableComponent();
    }, 0);
  }

  /**
   * Disables the component
   */
  function disableComponent() {
    component.element.classList.add(
      `${component.getClass("slider")}--disabled`
    );
    component.element.setAttribute("aria-disabled", "true");

    // Ensure handles cannot receive focus when disabled
    if (component.structure?.handle) {
      component.structure.handle.tabIndex = -1;
      component.structure.handle.setAttribute("aria-disabled", "true");
    }

    if (config.range && component.structure?.secondHandle) {
      component.structure.secondHandle.tabIndex = -1;
      component.structure.secondHandle.setAttribute("aria-disabled", "true");
    }

    // Redraw canvas with disabled colors
    if (component.drawCanvas) {
      component.drawCanvas();
    }
  }

  /**
   * Enables the component
   */
  function enableComponent() {
    component.element.classList.remove(
      `${component.getClass("slider")}--disabled`
    );
    component.element.setAttribute("aria-disabled", "false");

    // Re-enable focus on handles
    if (component.structure?.handle) {
      component.structure.handle.tabIndex = 0;
      component.structure.handle.setAttribute("aria-disabled", "false");
    }

    if (config.range && component.structure?.secondHandle) {
      component.structure.secondHandle.tabIndex = 0;
      component.structure.secondHandle.setAttribute("aria-disabled", "false");
    }

    // Redraw canvas with enabled colors
    if (component.drawCanvas) {
      component.drawCanvas();
    }
  }

  /**
   * Gets the active color class
   */
  function getActiveColor() {
    return (
      Object.values(SLIDER_COLORS).find((colorName) =>
        component.element.classList.contains(
          `${component.getClass("slider")}--${colorName}`
        )
      ) || SLIDER_COLORS.PRIMARY
    );
  }

  /**
   * Gets the active size class
   */
  function getActiveSize() {
    // Check for size class names on the element
    const sizeKeys = Object.keys(SLIDER_SIZES) as Array<
      keyof typeof SLIDER_SIZES
    >;
    const foundKey = sizeKeys.find((sizeKey) =>
      component.element.classList.contains(
        `${component.getClass("slider")}--${sizeKey.toLowerCase()}`
      )
    );
    return foundKey || "XS"; // Default to 'XS' (extra small)
  }

  // Return enhanced component
  return {
    ...component,

    // Disabled state management
    disabled: {
      /**
       * Enables the component
       * @returns Disabled manager for chaining
       */
      enable() {
        enableComponent();
        return this;
      },

      /**
       * Disables the component
       * @returns Disabled manager for chaining
       */
      disable() {
        disableComponent();
        return this;
      },

      /**
       * Checks if component is disabled
       * @returns True if disabled
       */
      isDisabled() {
        return component.element.classList.contains(
          `${component.getClass("slider")}--disabled`
        );
      },
    },

    // Appearance management
    appearance: {
      /**
       * Sets slider color
       * @param color Color variant
       * @returns Appearance manager for chaining
       */
      setColor(color: SliderColor) {
        // Remove existing color classes
        Object.values(SLIDER_COLORS).forEach((colorName) => {
          component.element.classList.remove(
            `${component.getClass("slider")}--${colorName}`
          );
        });

        // Add new color class if not primary (default)
        if (color !== SLIDER_COLORS.PRIMARY) {
          component.element.classList.add(
            `${component.getClass("slider")}--${color}`
          );
        }

        return this;
      },

      /**
       * Gets slider color
       * @returns Current color name
       */
      getColor() {
        return getActiveColor();
      },

      /**
       * Sets slider size
       * @param size Size variant
       * @returns Appearance manager for chaining
       */
      setSize(size: SliderSize) {
        // Remove existing size classes
        const sizeKeys = Object.keys(SLIDER_SIZES) as Array<
          keyof typeof SLIDER_SIZES
        >;
        sizeKeys.forEach((sizeKey) => {
          component.element.classList.remove(
            `${component.getClass("slider")}--${sizeKey.toLowerCase()}`
          );
        });

        // Determine the size key to use
        let sizeKey: string;
        if (typeof size === "string" && size in SLIDER_SIZES) {
          sizeKey = size;
        } else if (typeof size === "number") {
          // Find the key that matches this value
          const entry = Object.entries(SLIDER_SIZES).find(
            ([, value]) => value === size
          );
          sizeKey = entry ? entry[0] : "XS";
        } else {
          sizeKey = "XS"; // Default
        }

        // Add new size class
        component.element.classList.add(
          `${component.getClass("slider")}--${sizeKey.toLowerCase()}`
        );

        return this;
      },

      /**
       * Gets slider size
       * @returns Current size name
       */
      getSize() {
        return getActiveSize();
      },

      /**
       * Shows or hides tick marks
       * @param show Whether to show ticks
       * @returns Appearance manager for chaining
       */
      showTicks(show: boolean) {
        config.ticks = show;

        // Regenerate ticks if slider is initialized
        if (component.slider) {
          component.slider.regenerateTicks();
        }

        return this;
      },

      /**
       * Shows or hides current value bubble during interaction
       * @param show Whether to show value bubble
       * @returns Appearance manager for chaining
       */
      showCurrentValue(show: boolean) {
        config.showValue = show;
        return this;
      },
    },
  };
};
