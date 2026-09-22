// FLO-114: the container emits positional arguments through its own dispatcher.
import { createChips, type ChipsComponent, type ChipsConfig, type ChipsEvents, type ChipComponent } from "../../src/components/chips";
import { CHIPS_EVENTS } from "../../src/components/chips/constants";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
export const names: Equals<keyof ChipsEvents, "change" | "add" | "remove"> = true;
export const change: Equals<Parameters<ChipsEvents["change"]>, [selectedValues: (string | null)[], changedValue: string | null]> = true;
export const add: Equals<Parameters<ChipsEvents["add"]>, [chip: ChipComponent]> = true;
export const remove: Equals<Parameters<ChipsEvents["remove"]>, [chip: ChipComponent]> = true;
export const configEvents: Equals<ChipsConfig["on"], Partial<ChipsEvents> | undefined> = true;
const chips = createChips({ on: {
  change: (values, changed) => { const selected: (string | null)[] = values; const value: string | null = changed; void selected; void value; },
  add: chip => chip.getValue(),
  remove: chip => chip.getText(),
} });
export const inferred: Equals<Parameters<Parameters<typeof chips.on<"change">>[1]>, Parameters<ChipsEvents["change"]>> = true;
const handler: ChipsEvents["change"] = () => {};
export const chained: ChipsComponent = chips.on(CHIPS_EVENTS.CHANGE, handler).off("change", handler);
chips.on("add", chip => chip.setSelected(true));
chips.off("remove", chip => chip.getValue());
chips.on("change", () => {});
// @ts-expect-error change carries two positional values, not a DOM event
chips.on("change", (event: Event) => event.preventDefault());
// @ts-expect-error off checks the same contract
chips.off("change", (value: string) => value.toUpperCase());
// @ts-expect-error add receives a chip, not a wrapped payload
chips.on("add", payload => payload.chip.getValue());
// @ts-expect-error remove receives a chip, not an index
chips.off("remove", (index: number) => index.toFixed());
// @ts-expect-error misspelled names are rejected
chips.on("chnage", () => {});
// @ts-expect-error off shares the closed map
chips.off("chnage", () => {});
// @ts-expect-error root DOM events are not forwarded by the container dispatcher
chips.on("click", () => {});
// @ts-expect-error lifecycle uses a separate emitter
chips.on("destroy", () => {});
// @ts-expect-error config rejects unimplemented events too
createChips({ on: { select: () => {} } });
// @ts-expect-error config checks callback arguments
createChips({ on: { change: (value: number) => value.toFixed() } });
// @ts-expect-error the selected values are an array
chips.on("change", values => values.toUpperCase());
// @ts-expect-error changed value is not a DOM event
chips.on("change", (_values, changed) => changed?.preventDefault());
