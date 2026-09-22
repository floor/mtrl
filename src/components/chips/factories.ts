import createChip from "./chip/chip";
import type { AssistChipConfig, FilterChipConfig, InputChipConfig, SuggestionChipConfig, ChipComponent } from "./types";

/** Action chip; flat and outlined by default. */
export const createAssistChip = (config: AssistChipConfig): ChipComponent => createChip({ ...config, type: "assist" });
/** Toggleable filter; selected chips show a checkmark. */
export const createFilterChip = (config: FilterChipConfig): ChipComponent => createChip({ ...config, type: "filter" });
/** Selectable input token with an optional independent removal action. */
export const createInputChip = (config: InputChipConfig): ChipComponent => createChip({ ...config, type: "input" });
/** Suggested action; flat and outlined by default. */
export const createSuggestionChip = (config: SuggestionChipConfig): ChipComponent => createChip({ ...config, type: "suggestion" });
