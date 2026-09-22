// src/components/chips/index.ts
export { createAssistChip, createFilterChip, createInputChip, createSuggestionChip } from "./factories";
export { default as createChips } from "./chips";
export type {
  ChipConfig,
  ChipComponent,
  ChipType,
  ChipEvents,
  ChipChangePayload,
  AssistChipConfig,
  FilterChipConfig,
  InputChipConfig,
  SuggestionChipConfig,
  ChipsConfig,
  ChipsComponent,
  ChipsEvents,
} from "./types";

// NOTE: Constants are exported from './constants' directly
// Import constants from 'mtrl/components/chips/constants' for tree-shaking
