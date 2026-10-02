// src/components/segmented-button/index.ts
export { default, default as createSegmentedButton } from "./segmented-button";
export { SelectionMode, Density } from "./types";
export type {
  SegmentedButtonConfig,
  SegmentedButtonComponent,
  SegmentConfig,
  Segment,
} from "./types";
export * from "./constants";

// NOTE: Both work in 0.10.x and the subpath is removed in 1.0.
