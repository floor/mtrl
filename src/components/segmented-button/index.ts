// src/components/segmented-button/index.ts
export { default, default as createSegmentedButton } from "./segmented-button";
export { SelectionMode, Density } from "./types";
export type {
  SegmentedButtonConfig,
  SegmentedButtonComponent,
  SegmentConfig,
  Segment,
} from "./types";

// NOTE: Constants are exported from './constants' directly
// Import constants from 'mtrl/components/segmented-button/constants' for tree-shaking
