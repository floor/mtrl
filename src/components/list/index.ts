// src/components/list/index.js

/**
 * List Component Module
 * 
 * The List component provides high-performance rendering of large datasets
 * with built-in virtualization, pagination, and efficient DOM management.
 * 
 * @module components/list
 * @category Components
 */

// Export main component factory
export { default } from './list';

// Export constants
export {
  LIST_DEFAULTS,
  LIST_TYPES,
  LIST_SELECTION_MODES,
  LIST_EVENTS,
  LIST_SCROLL_POSITIONS,
  LIST_CLASSES
} from './constants';

// Export types for TypeScript
export type { 
  ListConfig, 
  ListComponent, 
  SelectEvent,
  LoadEvent,
  LoadResult 
} from './types';