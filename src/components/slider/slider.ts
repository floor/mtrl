// src/components/slider/slider.ts
import { pipe } from "../../core/compose/pipe";
import { createBase, withElement } from "../../core/compose/component";
import {
  withEvents,
  withLifecycle,
  withIcon,
  withTextLabel,
} from "../../core/compose/features";
import {
  withRange,
  withStates,
  withController,
  withCanvas,
  withDom,
} from "./features";
import { withAPI } from "./api";
import { SliderConfig, SliderComponent, SliderEventType } from "./types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

/**
 * Creates a new Slider component
 *
 * Slider follows a clear architectural pattern:
 * 1. Base component - Creates the foundation with event system
 * 2. Feature enhancement - Adds specific capabilities (range, icons)
 * 3. DOM creation - Creates DOM elements directly using optimized createElement
 * 4. Canvas rendering - Uses canvas for visual elements, keeping handles as DOM
 * 5. State management - Handles visual states and appearance
 * 6. Controller - Manages behavior, events, and UI rendering
 * 7. Lifecycle - Handles component lifecycle events
 * 8. Public API - Exposes a clean, consistent API
 *
 * @param {SliderConfig} config - Slider configuration object
 * @returns {SliderComponent} Slider component instance
 */
const createSlider = (config: SliderConfig = {}): SliderComponent => {
  // Process configuration with defaults
  const baseConfig = createBaseConfig(config);

  try {
    // Create the component by composing features in a specific order
    const component = pipe(
      // Base component with event system
      createBase,
      withEvents(),

      // Create the main slider element using standard withElement
      withElement(getElementConfig(baseConfig)),

      // Add range configuration
      withRange(baseConfig),

      // Create inner DOM elements (container, handle, valueBubble)
      withDom(baseConfig),

      // Add text/label and icon features that need DOM elements
      withTextLabel(baseConfig),
      withIcon(baseConfig),

      // Add canvas rendering for tracks and ticks
      withCanvas(baseConfig),

      // Add state management and behavior
      withStates(baseConfig),
      withController(baseConfig),
      withLifecycle()
    )(baseConfig);

    // Generate the API configuration based on the enhanced component
    const apiOptions = getApiConfig(component);

    // Apply the public API layer
    const slider = withAPI(apiOptions)(component);

    // Register event handlers from config for convenience
    if (baseConfig.on && typeof slider.on === "function") {
      Object.entries(baseConfig.on).forEach(([event, handler]) => {
        if (typeof handler === "function") {
          slider.on(event as SliderEventType, handler);
        }
      });
    }

    return slider;
  } catch (error) {
    console.error("Slider creation error:", error);
    throw new Error(`Failed to create slider: ${(error as Error).message}`);
  }
};

export default createSlider;
