// FLO-114: public picker events, display strings and root-only forwarded events.
import createTimePicker, {
  TIMEPICKER_EVENTS,
  type TimePickerComponent,
  type TimePickerEvents,
  type TimePickerTapPayload,
  type TimePickerSwipePayload,
} from "../../src/components/timepicker";
import type { ForwardedEventPayload } from "../../src/core/dom";
import type { NormalizedEvent } from "../../src/core/utils/mobile";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const picker = createTimePicker();
export const names: Equals<keyof TimePickerEvents,
  "change" | "confirm" | "open" | "close" | "cancel" | "click" | "keydown" | "tap" | "swipe"
> = true;
export const changeIsString: Equals<Parameters<TimePickerEvents["change"]>, [string]> = true;
export const confirmIsString: Equals<Parameters<TimePickerEvents["confirm"]>, [string]> = true;
export const openHasNoPayload: Equals<Parameters<TimePickerEvents["open"]>, []> = true;
export const closeHasNoPayload: Equals<Parameters<TimePickerEvents["close"]>, []> = true;
export const cancelHasNoPayload: Equals<Parameters<TimePickerEvents["cancel"]>, []> = true;
export const clickPayload: Equals<Parameters<TimePickerEvents["click"]>[0], ForwardedEventPayload<MouseEvent, HTMLElement>> = true;
export const keyPayload: Equals<Parameters<TimePickerEvents["keydown"]>[0], ForwardedEventPayload<KeyboardEvent, HTMLElement>> = true;
export const tapPayload: Equals<Parameters<TimePickerEvents["tap"]>[0], NormalizedEvent> = true;
export const publicTapAlias: Equals<TimePickerTapPayload, NormalizedEvent> = true;
export const swipePayload: Equals<Parameters<TimePickerEvents["swipe"]>[0], TimePickerSwipePayload> = true;
export const swipeShape: Equals<TimePickerSwipePayload, { direction: "left" | "right"; deltaX: number; deltaY: number }> = true;
export const inferredChange: Equals<Parameters<Parameters<typeof picker.on<"change">>[1]>, [string]> = true;

const onChange = (value: string) => { value.toUpperCase(); };
export const chained: TimePickerComponent = picker.on(TIMEPICKER_EVENTS.CHANGE, onChange).off("change", onChange);
picker.on(TIMEPICKER_EVENTS.CONFIRM, value => value.toUpperCase());
picker.on(TIMEPICKER_EVENTS.OPEN, () => {}).off("close", () => {}).on("cancel", () => {});
picker.on("click", payload => { payload.event.clientX; payload.element.style; });
picker.on("keydown", payload => payload.originalEvent.key);
picker.on("tap", payload => payload.preventDefault());
picker.on("swipe", payload => { const direction: "left" | "right" = payload.direction; void direction; });

// @ts-expect-error the change value is a string, not a DOM event
picker.on("change", (event: Event) => event.preventDefault());
// @ts-expect-error off checks payloads too
picker.off("confirm", (value: number) => value.toFixed());
// @ts-expect-error notifications do not supply an event argument
picker.on("open", (event: Event) => event.preventDefault());
// @ts-expect-error misspelled event names are rejected
picker.on("chnage", () => {});
// @ts-expect-error off shares the closed map
picker.off("chnage", () => {});
// @ts-expect-error raw touch events are not configured for forwarding
picker.on("touchstart", () => {});
// @ts-expect-error focus is not forwarded
picker.on("focus", () => {});
// @ts-expect-error lifecycle events are not emitted through this API
picker.on("destroy", () => {});
// @ts-expect-error click is wrapped in a forwarded payload
picker.on("click", (event: MouseEvent) => event.clientX);
// @ts-expect-error the payload does not contain a finished picker instance
picker.on("click", payload => payload.component.open());
// @ts-expect-error root keyboard events retain their native type
picker.on("keydown", payload => payload.event.clientX);
// @ts-expect-error swipe payloads do not carry a DOM event
picker.on("swipe", payload => payload.event);
