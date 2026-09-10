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
  const handle = component.handle ?? component.structure?.handle;
  const secondHandle = component.secondHandle ?? component.structure?.secondHandle;

  // Track initial disabled state
  const isDisabled = config.disabled === true;

  let initialization: ReturnType<typeof setTimeout> | null = null;

  // Apply initial disabled state if needed
  if (isDisabled) {
    initialization = setTimeout(() => {
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
    if (handle) {
      handle.tabIndex = -1;
      handle.setAttribute("aria-disabled", "true");
    }

    if (config.range && secondHandle) {
      secondHandle.tabIndex = -1;
      secondHandle.setAttribute("aria-disabled", "true");
    }

    // Redraw track with disabled colors
    if (component.renderTracks) {
      component.renderTracks();
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
    if (handle) {
      handle.tabIndex = 0;
      handle.setAttribute("aria-disabled", "false");
    }

    if (config.range && secondHandle) {
      secondHandle.tabIndex = 0;
      secondHandle.setAttribute("aria-disabled", "false");
    }

    // Redraw track with enabled colors
    if (component.renderTracks) {
      component.renderTracks();
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

  if (component.lifecycle) {
    const originalDestroy = component.lifecycle.destroy;
    component.lifecycle.destroy = () => {
      if (initialization !== null) clearTimeout(initialization);
      originalDestroy.call(component.lifecycle);
    };
  }

  // Share the instance so these callbacks see track methods installed next.
  return Object.assign(component, {
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
        component.renderTracks?.();

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
  });
};
