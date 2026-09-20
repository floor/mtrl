// src/components/chips/features/chip-items.ts
import { ChipsConfig } from "../types";

/**
 * Adds chip item management to chips component
 *
 * @param config Chips configuration
 * @returns Component enhancer that adds chip items functionality
 */
/** What this feature reads off the component it is handed. */
interface ChipItemsHost {
  onCreated?: () => void;
}

export const withChipItems =
  (config: ChipsConfig) =>
  // Generic, so the accumulated pipeline type survives (see #109).
  <C extends ChipItemsHost>(component: C) => {
  // Chip instances stored in component state
  const chipInstances: unknown[] = [];

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
