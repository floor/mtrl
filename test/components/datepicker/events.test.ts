import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import createDatePicker, { type DatePickerComponent, type DatePickerConfig, type DatePickerEvents, type DatePickerChangePayload } from "../../../src/components/datepicker";

let dom: JSDOM;
let instances: DatePickerComponent[];
beforeEach(() => {
  dom = new JSDOM("<!DOCTYPE html><body></body>", { url: "http://localhost/", pretendToBeVisual: true });
  Object.assign(globalThis, {
    window: dom.window, document: dom.window.document,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, KeyboardEvent: dom.window.KeyboardEvent,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  });
  instances = [];
});
afterEach(() => {
  for (const picker of instances) picker.destroy();
  dom.window.close();
});
const mount = (config: DatePickerConfig = {}) => {
  const picker = createDatePicker(config);
  instances.push(picker);
  document.body.append(picker.element);
  return picker;
};
const day = (picker: DatePickerComponent, date: Date) => {
  const button = picker.element.querySelector<HTMLElement>(`[data-date="${date.toISOString()}"]`);
  if (!button) throw new Error(`Missing calendar day ${date.toISOString()}`);
  button.click();
};
const start = new Date(2026, 8, 10);
const end = new Date(2026, 8, 15);

describe("datepicker event contract", () => {
  test("setValue and clear emit API values and formatted strings without rangeEndDate", () => {
    const picker = mount({ selectionMode: "range" });
    const events: DatePickerChangePayload[] = [];
    picker.on("change", payload => events.push(payload));
    expect(picker.setValue(start).setValue([end, start]).clear()).toBe(picker);
    expect(events).toEqual([
      { value: start, formattedValue: "09/10/2026" },
      { value: [start, end], formattedValue: "09/10/2026 - 09/15/2026" },
      { value: null, formattedValue: "" },
    ]);
    for (const payload of events) expect("rangeEndDate" in payload).toBe(false);
  });

  test("calendar range selections emit separate start and end dates", () => {
    const picker = mount({ selectionMode: "range", closeOnSelect: false });
    picker.open();
    picker.calendar.goToDate(start);
    const events: DatePickerChangePayload[] = [];
    picker.on("change", payload => events.push(payload));
    day(picker, end);
    day(picker, start);
    expect(events).toEqual([
      { value: end, rangeEndDate: null, formattedValue: "09/15/2026" },
      { value: start, rangeEndDate: end, formattedValue: "09/10/2026 - 09/15/2026" },
    ]);
    expect(picker.getValue()).toEqual([start, end]);
  });

  test("calendar single selection includes a null range end", () => {
    const picker = mount({ closeOnSelect: false });
    picker.open();
    picker.calendar.goToDate(start);
    const events: DatePickerChangePayload[] = [];
    picker.on("change", payload => events.push(payload));
    day(picker, start);
    expect(events).toEqual([{ value: start, rangeEndDate: null, formattedValue: "09/10/2026" }]);
  });

  test("API open/close carry complete ranges while input and outside clicks carry the start date", () => {
    const picker = mount({ selectionMode: "range", value: [start, end] });
    const opened: Parameters<DatePickerEvents["open"]>[0][] = [];
    const closed: Parameters<DatePickerEvents["close"]>[0][] = [];
    picker.on("open", payload => opened.push(payload)).on("close", payload => closed.push(payload));
    expect(picker.open().close()).toBe(picker);
    picker.input.click();
    picker.input.click();
    picker.input.click();
    document.body.click();
    expect(opened).toEqual([{ value: [start, end] }, { value: start }, { value: start }]);
    expect(closed).toEqual([{ value: [start, end] }, { value: start }, { value: start }]);
    picker.clear().open().close();
    expect(opened.at(-1)).toEqual({ value: null });
    expect(closed.at(-1)).toEqual({ value: null });
  });

  test("root forwarding wraps native events and preserves their identity", () => {
    const picker = mount();
    const clicks: Parameters<DatePickerEvents["click"]>[0][] = [];
    const keys: Parameters<DatePickerEvents["keydown"]>[0][] = [];
    picker.on("click", payload => clicks.push(payload)).on("keydown", payload => keys.push(payload));
    const click = new dom.window.MouseEvent("click", { bubbles: true, clientX: 14 });
    const key = new dom.window.KeyboardEvent("keydown", { bubbles: true, key: "Escape" });
    picker.input.dispatchEvent(click);
    picker.input.dispatchEvent(key);
    expect(clicks).toEqual([{ event: click, originalEvent: click, element: picker.element }]);
    expect(keys).toEqual([{ event: key, originalEvent: key, element: picker.element }]);
    // Calendar clicks deliberately stop before reaching the root forwarder.
    picker.calendar.goToDate(start);
    day(picker, start);
    expect(clicks).toHaveLength(1);
  });

  test("interactive root emits normalized taps and horizontal swipe details", () => {
    const picker = mount();
    const taps: Parameters<DatePickerEvents["tap"]>[0][] = [];
    const swipes: Parameters<DatePickerEvents["swipe"]>[0][] = [];
    picker.on("tap", payload => taps.push(payload)).on("swipe", payload => swipes.push(payload));
    const touch = (name: string, x: number, y: number) => {
      const event = new dom.window.Event(name, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", { value: name === "touchend" ? [] : [{ clientX: x, clientY: y, pageX: x, pageY: y }] });
      picker.element.dispatchEvent(event);
      return event;
    };
    expect("ontouchstart" in window).toBe(true);
    touch("touchstart", 10, 20);
    touch("touchmove", 90, 30);
    const event = touch("touchend", 90, 30);
    expect(swipes).toEqual([{ direction: "right", deltaX: 80, deltaY: 10 }]);
    expect(taps).toHaveLength(1);
    expect([taps[0].type, taps[0].target, taps[0].clientX, taps[0].clientY]).toEqual(["touchend", picker.element, 0, 0]);
    taps[0].preventDefault();
    expect(event.defaultPrevented).toBe(true);
  });

  test("off and destroy remove subscriptions and the outside click listener", () => {
    const picker = mount();
    const changes: DatePickerChangePayload[] = [];
    const changed: DatePickerEvents["change"] = payload => changes.push(payload);
    let closes = 0;
    let clicks = 0;
    expect(picker.on("change", changed).off("change", changed)).toBe(picker);
    picker.setValue(start);
    expect(changes).toEqual([]);
    picker.on("change", changed).on("close", () => closes++).on("click", () => clicks++).open();
    picker.destroy();
    picker.setValue(end);
    picker.element.dispatchEvent(new dom.window.MouseEvent("click"));
    document.body.click();
    expect(changes).toEqual([]);
    expect(closes).toBe(0);
    expect(clicks).toBe(0);
  });
});
