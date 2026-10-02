// The chips set emits one change payload through its own dispatcher.
import { createChips, type ChipsComponent, type ChipsConfig, type ChipsEvents, type ChipsChangeEvent, type ChipsAddEvent, type ChipsRemoveEvent, type ChipComponent, type ChipChangePayload, type ChipEvents } from "../../src/components/chips";
import { CHIPS_EVENTS } from "../../src/components/chips/constants";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
export const names: Equals<keyof ChipsEvents, "change" | "add" | "remove"> = true;
export const change: Equals<Parameters<ChipsEvents["change"]>, [event: ChipsChangeEvent]> = true;
// FLO-530: the named payload is an object, with no array inheritance.
export const fields: Equals<Pick<ChipsChangeEvent, "value" | "selected" | "changed">, { value: string | string[] | null; selected: (string | null)[]; changed: string | null }> = true;
export const plainObject: Equals<ChipsChangeEvent, { value: string | string[] | null; selected: (string | null)[]; changed: string | null }> = true;
export const add: Equals<Parameters<ChipsEvents["add"]>, [event: ChipsAddEvent]> = true;
export const remove: Equals<Parameters<ChipsEvents["remove"]>, [event: ChipsRemoveEvent]> = true;
export const addShape: Equals<ChipsAddEvent, { value: string | string[] | null; chip: ChipComponent }> = true;
export const removeShape: Equals<ChipsRemoveEvent, { value: string | string[] | null; chip: ChipComponent; chipValue: string | null }> = true;
export const addValue: Equals<ChipsAddEvent["value"], ReturnType<ChipsComponent["getValue"]>> = true;
export const removeValue: Equals<ChipsRemoveEvent["value"], ReturnType<ChipsComponent["getValue"]>> = true;
export const configEvents: Equals<ChipsConfig["on"], Partial<ChipsEvents> | undefined> = true;
export const onChangeIsListener: Equals<NonNullable<ChipsConfig["onChange"]>, ChipsEvents["change"]> = true;
const chips = createChips({ on: {
  change: event => { const selected: (string | null)[] = event.selected; const value: string | null = event.changed; void selected; void value; },
  add: event => event.chip.getValue(),
  remove: event => event.chip.getText(),
} });
export const inferred: Equals<Parameters<Parameters<typeof chips.on<"change">>[1]>, Parameters<ChipsEvents["change"]>> = true;
const handler: ChipsEvents["change"] = () => {};
export const chained: ChipsComponent = chips.on(CHIPS_EVENTS.CHANGE, handler).off("change", handler);
chips.on("add", event => event.chip.setSelected(true));
chips.off("remove", event => event.chip.getValue());
chips.on("change", () => {});
// @ts-expect-error change no longer supplies the deprecated second argument
chips.on("change", (_event, changed: string | null) => { void changed; });
// @ts-expect-error config onChange also takes only the payload
createChips({ onChange: (_event, changed: string | null) => { void changed; } });
// @ts-expect-error the payload is not indexable as an array
export const first: ChipsChangeEvent[0] = "a";
// @ts-expect-error the payload is not iterable as an array
chips.on("change", event => [...event]);
// @ts-expect-error change carries a payload object, not a DOM event
chips.on("change", (event: Event) => event.preventDefault());
// @ts-expect-error off checks the same contract
chips.off("change", (value: string) => value.toUpperCase());
// @ts-expect-error add receives a wrapped payload, not a bare chip
chips.on("add", chip => chip.getValue());
// @ts-expect-error remove receives a payload object, not an index
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
chips.on("change", event => { const value: string | string[] | null = event.value; void value; });
// @ts-expect-error the selected values are an array
chips.on("change", values => values.toUpperCase());
// @ts-expect-error changed value is not a DOM event
chips.on("change", event => event.changed?.preventDefault());
// FLO-352: the keyboard API the set has at runtime is typed
export const keyboard: Equals<ChipsComponent["keyboard"], { enable: () => void; disable: () => void }> = true;
chips.keyboard.disable();
chips.keyboard.enable();
// @ts-expect-error the keyboard API takes no arguments
chips.keyboard.disable(true);

// FLO-380: a single chip's change carries its value, in getValue()'s type.
export const chipChange: Equals<Parameters<ChipEvents["change"]>[0], ChipChangePayload> = true;
export const chipChangeShape: Equals<ChipChangePayload, { selected: boolean; chip: ChipComponent; value: string | null }> = true;
export const chipChangeValue: Equals<ChipChangePayload["value"], ReturnType<ChipComponent["getValue"]>> = true;
