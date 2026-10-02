import createChip from "./chip/chip";
import type { AssistChipConfig, FilterChipConfig, InputChipConfig, SuggestionChipConfig, ChipComponent, ChipType } from "./types";

/** Public factories cannot carry the set's private `onSelected` hook. FLO-518. */
const open = <T extends object>(config: T, type: ChipType): ChipComponent =>
  createChip({ ...config, type, onSelected: undefined });

/** Action chip; flat and outlined by default. */
export const createAssistChip = (config: AssistChipConfig): ChipComponent => open(config, "assist");
/** Toggleable filter; selected chips show a checkmark. */
export const createFilterChip = (config: FilterChipConfig): ChipComponent => open(config, "filter");
/** Selectable input token with an optional independent removal action. */
export const createInputChip = (config: InputChipConfig): ChipComponent => open(config, "input");
/** Suggested action; flat and outlined by default. */
export const createSuggestionChip = (config: SuggestionChipConfig): ChipComponent => open(config, "suggestion");
