// src/components/list/index.js

/** Material list anatomy for static data. */

// Export main component factory
export { default } from "./list";

// Export constants
export {
  LIST_DEFAULTS,
  LIST_TYPES,
  LIST_SELECTION_MODES,
  LIST_EVENTS,
  LIST_SCROLL_POSITIONS,
  LIST_CLASSES,
} from "./constants";

// Export types for TypeScript
export type {
  ListConfig,
  ListItem,
  ListSlot,
  ListComponent,
  SelectEvent,
  LoadEvent,
} from "./types";
