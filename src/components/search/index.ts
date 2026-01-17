// src/components/search/index.ts

// Export main component creator
export { default } from "./search";

// Export types for TypeScript users
export type {
  SearchConfig,
  SearchComponent,
  SearchEvent,
  SearchState,
  SearchViewMode,
  SearchEventType,
  SearchSuggestion,
  SearchTrailingItem,
} from "./types";

// Export constants
export {
  SEARCH_STATES,
  SEARCH_VIEW_MODES,
  SEARCH_EVENTS,
  SEARCH_ICONS,
  SEARCH_DEFAULTS,
  SEARCH_CLASSES,
  SEARCH_MEASUREMENTS,
  SEARCH_KEYS,
} from "./constants";
