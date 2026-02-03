// src/components/chips/index.ts
export { default as createChip } from "./chip";
export { default as createChips } from "./chips";
export type {
  ChipConfig,
  ChipComponent,
  ChipVariant,
  ChipsConfig,
  ChipsComponent,
} from "./types";

// NOTE: Constants are exported from './constants' directly
// Import constants from 'mtrl/components/chips/constants' for tree-shaking
