// test/types/timepicker-element-events.fixture.ts
//
// FLO-547: <m-timepicker>'s component types `on` and `off` with the time
// picker's event map, as <m-search>'s does with its own. It took any string
// and an untyped handler.
import type { TimepickerElementComponent } from "../../src/elements/timepicker";
import type { TimePickerValueEvent } from "../../src/components/timepicker/types";

declare const picker: TimepickerElementComponent;

// Each event's listener is typed with what it carries
picker.on("change", (event) => { const value: string = event.value; void value; });
picker.on("input", (event) => { const draft: string = event.draftValue; const value: string = event.value; void draft; void value; });
picker.off("confirm", (event) => { const value: string = event.value; void value; });
picker.on("open", () => {});
picker.off("close", () => {});
picker.on("keydown", (payload) => { const key: string = payload.originalEvent.key; void key; });

// @ts-expect-error a name outside the map
picker.on("opened", () => {});
// @ts-expect-error a name outside the map
picker.off("select", () => {});
// @ts-expect-error open carries no argument
picker.on("open", (event: TimePickerValueEvent) => event.value);
// @ts-expect-error change carries no draftValue
picker.on("change", (event) => event.draftValue);
