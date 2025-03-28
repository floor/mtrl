// src/core/composition/index.ts

/**
 * @module core/composition
 * @description Composition utilities for creating components using the structure-based approach
 * 
 * The composition module provides features that work with the structure definition
 * mechanism. Unlike traditional features that directly modify the DOM, these
 * features modify a layout schema that is later used to create DOM elements.
 * 
 * This approach provides several advantages:
 * - Clearer separation between layout and DOM creation
 * - More predictable component creation process
 * - Better support for server-side rendering
 * - Enhanced testability
 */

// Export features
export {
  withLayout,
  withDom,
  withIcon,
  withLabel,
} from './features';

export type { IconConfig, LabelConfig } from './features';