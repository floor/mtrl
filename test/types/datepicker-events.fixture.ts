// FLO-114: describe the API, calendar and interactive-root events as emitted.
import createDatePicker, {
  type DatePickerComponent, type DatePickerEvents, type DatePickerValue,
  type DatePickerChangePayload, type DatePickerVisibilityPayload,
  type DatePickerTapPayload, type DatePickerSwipePayload,
} from "../../src/components/datepicker";
import type { ForwardedEventPayload } from "../../src/core/dom";
import type { NormalizedEvent } from "../../src/core/utils/mobile";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
export const names: Equals<keyof DatePickerEvents, "change" | "open" | "close" | "click" | "keydown" | "tap" | "swipe"> = true;
export const value: Equals<DatePickerValue, Date | [Date, Date] | null> = true;
export const change: Equals<Parameters<DatePickerEvents["change"]>, [DatePickerChangePayload]> = true;
export const open: Equals<Parameters<DatePickerEvents["open"]>, [DatePickerVisibilityPayload]> = true;
export const close: Equals<Parameters<DatePickerEvents["close"]>, [DatePickerVisibilityPayload]> = true;
export const click: Equals<Parameters<DatePickerEvents["click"]>[0], ForwardedEventPayload<MouseEvent, HTMLElement>> = true;
export const keydown: Equals<Parameters<DatePickerEvents["keydown"]>[0], ForwardedEventPayload<KeyboardEvent, HTMLElement>> = true;
export const tap: Equals<Parameters<DatePickerEvents["tap"]>[0], NormalizedEvent> = true;
export const tapAlias: Equals<DatePickerTapPayload, NormalizedEvent> = true;
export const swipe: Equals<Parameters<DatePickerEvents["swipe"]>[0], DatePickerSwipePayload> = true;
export const swipeShape: Equals<DatePickerSwipePayload, { direction: "left" | "right"; deltaX: number; deltaY: number }> = true;
const picker = createDatePicker();
export const inferred: Equals<Parameters<Parameters<typeof picker.on<"change">>[1]>, [DatePickerChangePayload]> = true;
const handler: DatePickerEvents["change"] = payload => { payload.formattedValue.toUpperCase(); payload.rangeEndDate?.getTime(); };
export const chained: DatePickerComponent = picker.on("change", handler).off("change", handler);
picker.on("open", ({ value }) => { if (Array.isArray(value)) value[1].getTime(); else value?.getTime(); });
picker.on("close", () => {});
picker.on("click", payload => payload.event.clientX);
picker.on("keydown", payload => payload.originalEvent.key);
picker.on("tap", payload => payload.preventDefault());
picker.on("swipe", payload => payload.direction);
export const apiRange: DatePickerChangePayload = { value: [new Date(), new Date()], formattedValue: "range" };
export const calendarRange: DatePickerChangePayload = { value: new Date(), rangeEndDate: new Date(), formattedValue: "range" };
export const cleared: DatePickerChangePayload = { value: null, formattedValue: "" };
// @ts-expect-error event names are closed
picker.on("chnage", () => {});
// @ts-expect-error off shares the closed map
picker.off("chnage", () => {});
// @ts-expect-error change is a payload object, not a raw date
picker.on("change", (date: Date) => date.getTime());
// @ts-expect-error off checks callback arguments
picker.off("open", (value: string) => value.toUpperCase());
// @ts-expect-error change has no DOM event target
picker.on("change", payload => payload.target);
// @ts-expect-error getValue can be a range tuple
picker.on("close", payload => payload.value?.getTime());
// @ts-expect-error click is wrapped
picker.on("click", (event: MouseEvent) => event.clientX);
// @ts-expect-error keyboard events retain their native type
picker.on("keydown", payload => payload.event.clientX);
// @ts-expect-error input focus is not forwarded to the root's emitter
picker.on("focus", () => {});
// @ts-expect-error renderer notifications are internal
picker.on("dateSelected", () => {});
// @ts-expect-error confirmation is not publicly emitted
picker.on("confirm", () => {});
// @ts-expect-error lifecycle uses a separate emitter
picker.on("destroy", () => {});
// @ts-expect-error calendar changes carry a single start date, not a tuple
export const invalidRange: DatePickerChangePayload = { value: [new Date(), new Date()], rangeEndDate: new Date(), formattedValue: "range" };
// @ts-expect-error formattedValue is required
export const missingFormatted: DatePickerChangePayload = { value: new Date() };
