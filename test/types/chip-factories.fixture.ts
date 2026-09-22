import { createAssistChip, createFilterChip, createInputChip, createSuggestionChip, type ChipType, type ChipEvents } from "../../src";
import { CHIP_TYPES } from "../../src/components/chips/constants";
const assist = createAssistChip({ label: "Assist", elevated: true });
const filter = createFilterChip({ label: "Filter", selected: true, onChange: (selected, chip) => { const value: boolean = selected; chip.setSelected(value); } });
createInputChip({ label: "Ada", avatar: "<img>", onRemove: chip => chip.destroy() });
createSuggestionChip({ label: "Suggested", leadingIcon: "<svg>" });
export const type: ChipType = assist.getType();
export const constant: ChipType = CHIP_TYPES.FILTER;
const listener: ChipEvents["change"] = payload => payload.chip.isSelected();
filter.on("change", listener).off("change", listener);
// @ts-expect-error named factories require a label
createAssistChip({});
// @ts-expect-error legacy variants are removed
createFilterChip({ label: "Filter", variant: "filled" });
// @ts-expect-error assist is an action
createAssistChip({ label: "Assist", selected: true });
// @ts-expect-error suggestions do not have a trailing action
createSuggestionChip({ label: "Suggested", trailingIcon: "<svg>" });
// @ts-expect-error input has no elevated variant
createInputChip({ label: "Input", elevated: true });
// @ts-expect-error removal is exclusive to input chips
createFilterChip({ label: "Filter", onRemove: () => {} });
// @ts-expect-error the chip type is fixed by its factory
assist.setVariant("input");
// @ts-expect-error event names are typed
filter.on("chnage", () => {});
// @ts-expect-error a change event is not a DOM event
filter.on("change", (event: Event) => event.preventDefault());
