// src/components/chips/features/chip-items.ts
import { ChipsConfig } from "../types";

/**
 * Adds chip item management to chips component
 *
 * @param config Chips configuration
 * @returns Component enhancer that adds chip items functionality
 */
export const withChipItems = (config: ChipsConfig) => (component) => {
  // Chip instances stored in component state
  const chipInstances = [];

  return {
    ...component,
    chipInstances,

    // When DOM is created, add initial chips
    onCreated() {
      if (typeof component.onCreated === "function") {
        component.onCreated();
      }

      // Initialize with provided chips
      if (Array.isArray(config.chips) && config.chips.length > 0) {
        config.chips.forEach((chipConfig) => {
          this.chips?.addChip?.(chipConfig);
        });
      }
    },
  };
};
