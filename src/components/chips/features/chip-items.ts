// src/components/chips/features/chip-items.ts
import { ChipsConfig, ChipComponent } from "../types";

/**
 * Adds chip item management to chips component
 *
 * @param config Chips configuration
 * @returns Component enhancer that adds chip items functionality
 */
/** What this feature reads off the component it is handed. */
/**
 * What this feature reads off the component it is handed.
 *
 * `element` is required, and not because this file touches it: an all-optional
 * interface is a weak type, so nothing satisfies it unless it shares at least
 * one property, and the pipe's component shared none. That is what made the
 * stage reject its own input. withElement runs before this, so requiring it
 * costs nothing and says what the pipe already guarantees.
 */
interface ChipItemsHost {
  element: HTMLElement;
  onCreated?: () => void;
}

export const withChipItems =
  (config: ChipsConfig) =>
  // Generic, so the accumulated pipeline type survives (see #109).
  <C extends ChipItemsHost>(component: C) => {
  // Chip instances stored in component state
  const chipInstances: ChipComponent[] = [];

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
