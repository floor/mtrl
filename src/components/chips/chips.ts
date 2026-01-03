// src/components/chips/chips.ts
import { pipe } from "../../core/compose/pipe";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import {
  withContainer,
  withChipItems,
  withController,
  withDom,
} from "./features";
import { withAPI } from "./api";
import { ChipsConfig, ChipsComponent } from "./types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

/**
 * Creates a chips container for grouping related chips
 *
 * Chips follows a clear architectural pattern:
 * 1. Base component - Creates the foundation with event system
 * 2. Feature enhancement - Adds specific capabilities (container, items, etc.)
 * 3. DOM creation - Creates DOM elements directly using optimized createElement
 * 4. Controller - Manages behavior, events, and UI rendering
 * 5. Lifecycle - Handles component lifecycle events
 * 6. Public API - Exposes a clean, consistent API
 *
 * @param {ChipsConfig} config - Chips configuration object
 * @returns {ChipsComponent} Chips component instance
 */
const createChips = (config: ChipsConfig = {}): ChipsComponent => {
  // Process configuration with defaults
  const baseConfig = createBaseConfig(config);

  try {
    // Create the component by composing features in a specific order
    const component = pipe(
      // Base component with event system
      createBase,
      withEvents(),

      // Create the main chips element using standard withElement
      withElement(getElementConfig(baseConfig)),

      withContainer(baseConfig),
      withChipItems(baseConfig),

      // Create inner DOM elements (label, container)
      withDom(baseConfig),

      // Add state management and behavior
      withController(baseConfig),
      withLifecycle(),
    )(baseConfig);

    // Generate the API configuration based on the enhanced component
    const apiOptions = getApiConfig(component, baseConfig);

    // Apply the public API layer
    const chips = withAPI(apiOptions)(component);

    // Register event handlers from config for convenience
    if (baseConfig.on && typeof chips.on === "function") {
      Object.entries(baseConfig.on).forEach(([event, handler]) => {
        if (typeof handler === "function") {
          chips.on(event, handler);
        }
      });
    }

    // Initialize chips from config after component is fully composed
    // This ensures chips.addChip is available from withController
    if (Array.isArray(baseConfig.chips) && baseConfig.chips.length > 0) {
      baseConfig.chips.forEach((chipConfig) => {
        chips.addChip(chipConfig);
      });
    }

    return chips;
  } catch (error) {
    console.error("Chips creation error:", error);
    throw new Error(`Failed to create chip: ${(error as Error).message}`);
  }
};

export default createChips;
