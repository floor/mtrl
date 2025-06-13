import { TextfieldConfig, TextfieldDensity } from "../types";

/**
 * Configuration for density feature
 */
interface DensityConfig extends TextfieldConfig {
  density?: TextfieldDensity | string;
  prefix?: string;
  componentName?: string;
}

/**
 * Component with density feature
 */
interface DensityComponent {
  element: HTMLElement;
  input?: HTMLInputElement | HTMLTextAreaElement;
  density?: {
    current: string;
    set: (density: string) => void;
  };
  updateElementPositions?: () => void;
}

/**
 * Adds density support to textfield component
 * @param {DensityConfig} config - Configuration with density option
 * @returns {Function} Higher-order function that adds density capabilities
 */
export const withDensity =
  (config: DensityConfig) =>
  (component: DensityComponent): DensityComponent => {
    const PREFIX = config.prefix || "mtrl";
    const COMPONENT = config.componentName || "textfield";
    const density = config.density || "default";

    // Apply initial density class
    if (density !== "default") {
      component.element.classList.add(
        `${PREFIX}-${COMPONENT}--density-${density}`
      );
    }

    // Set data attribute for styling hooks
    component.element.setAttribute("data-density", density);

    // Apply density-specific styles to input if present
    if (component.input) {
      applyDensityStyles(component.input, density);
    }

    /**
     * Applies density-specific inline styles
     * @param {HTMLElement} element - Element to apply styles to
     * @param {string} density - Density level
     */
    function applyDensityStyles(element: HTMLElement, density: string) {
      // These are applied as data attributes for CSS to use
      // The actual styling happens in SCSS
      element.setAttribute("data-density", density);
    }

    /**
     * Updates the component's density
     * @param {string} newDensity - New density level
     */
    const setDensity = (newDensity: string) => {
      // Remove existing density classes
      ["default", "compact"].forEach((d) => {
        component.element.classList.remove(
          `${PREFIX}-${COMPONENT}--density-${d}`
        );
      });

      // Add new density class if not default
      if (newDensity !== "default") {
        component.element.classList.add(
          `${PREFIX}-${COMPONENT}--density-${newDensity}`
        );
      }

      // Update data attribute
      component.element.setAttribute("data-density", newDensity);

      // Update input if present
      if (component.input) {
        component.input.setAttribute("data-density", newDensity);
      }

      // Update current density value
      if (component.density) {
        component.density.current = newDensity;
      }

      // Trigger position update if available
      if (component.updateElementPositions) {
        // Small delay to ensure styles are applied
        setTimeout(() => component.updateElementPositions!(), 10);
      }
    };

    // Add density feature to component
    component.density = {
      current: density,
      set: setDensity,
    };

    return component;
  };
