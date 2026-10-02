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
  ChipsChangeEvent,
} from "./types";
export * from "./constants";

// NOTE: Both work in 0.10.x and the subpath is removed in 1.0.
