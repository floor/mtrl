// test/components/timepicker/timepicker.test.ts
//
// The real createTimePicker. This replaces test/components/timepicker.test.ts,
// which built its own factory in the file and imported only types and
// constants from src — so rewriting the component left it green. That is F6,
// and the time picker was one of the last four suites still doing it.
//
// It waited on N25 (FLO-101), the conformance work, which is now done: an
// accessible input route, the AM/PM radiogroup and the M3 colour roles all
// landed first, so these tests are not blessing behaviour known to diverge.
//
import { describe, test, expect, beforeEach, afterAll, mock } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
for (const key of [
  "window", "document", "navigator", "HTMLElement", "HTMLInputElement",
  "HTMLCanvasElement", "HTMLButtonElement", "Element", "Node", "Event",
  "MouseEvent", "KeyboardEvent", "FocusEvent", "CustomEvent", "MutationObserver",
]) {
  g[key] = (dom.window as any)[key];
}
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
// The dial draws into a canvas; JSDOM has no 2D context and does not need one
// for anything asserted here.
(dom.window as any).HTMLCanvasElement.prototype.getContext = () => null;

import createTimePicker, { type TimePickerEvents, TIMEPICKER_SELECTORS } from "../../../src/components/timepicker";
import {
  TIME_FORMAT,
  TIME_PERIOD,
  TIME_PICKER_TYPE,
  TIME_PICKER_ORIENTATION,
} from "../../../src/components/timepicker/types";

type TimePicker = ReturnType<typeof createTimePicker>;

const mount = (config: Record<string, unknown> = {}): TimePicker => {
  const picker = createTimePicker(config as never);
  document.body.append(picker.element);
  return picker;
};

const dialogClass = (picker: TimePicker, modifier: string) =>
  picker.dialogElement.classList.contains(`mtrl-time-picker__dialog--${modifier}`);

beforeEach(() => { document.body.innerHTML = ""; });
afterAll(() => { dom.window.close(); });

describe("what a time picker is made of", () => {
  test("it has an element, a modal and a dialog", () => {
    const picker = mount();

    expect(picker.element).toBeDefined();
    expect(picker.modalElement).toBeDefined();
    expect(picker.dialogElement).toBeDefined();
  });

  // The modal is attached at creation and hidden, rather than attached on
  // open. So "closed" is display:none, not absence -- which is what the
  // mock's own style.display assertions were getting at.
  test("it starts closed, with the modal attached but hidden", () => {
    const picker = mount();

    expect(picker.isOpen).toBe(false);
    expect(document.body.contains(picker.modalElement)).toBe(true);
    expect(picker.modalElement.style.display).toBe("none");
  });
});

describe("the time it starts with", () => {
  test("a 12-hour picker reports the hour, minute and period it was given", () => {
    const picker = mount({ value: "14:30" });

    const time = picker.getTimeObject();
    expect(time.hours).toBe(14);
    expect(time.minutes).toBe(30);
    expect(time.period).toBe(TIME_PERIOD.PM);
  });

  test("a 24-hour picker reports the same object", () => {
    const picker = mount({ value: "14:30", format: TIME_FORMAT.MILITARY });

    const time = picker.getTimeObject();
    expect(time.hours).toBe(14);
    expect(time.minutes).toBe(30);
  });

  test("seconds are carried when they are asked for", () => {
    const picker = mount({ value: "14:30:45", showSeconds: true });

    const time = picker.getTimeObject();
    expect(time.seconds).toBe(45);
  });

  // FLO-237: machine values match the form regardless of display format.
  test("getValue returns a 24-hour machine value", () => {
    expect(mount({ value: "14:30" }).getValue()).toBe("14:30");
  });

  test("omitting seconds when showSeconds is off", () => {
    const picker = mount({ value: "14:30", showSeconds: false });

    expect(picker.getValue()).toBe("14:30");
  });

  test("and the 24-hour display has the same value", () => {
    expect(mount({ value: "14:30", format: TIME_FORMAT.MILITARY }).getValue()).toBe("14:30");
  });
});

describe("opening and closing", () => {
  test("open shows the modal and marks it active; close reverses both", () => {
    const picker = mount();

    picker.open();
    expect(picker.isOpen).toBe(true);
    expect(picker.modalElement.style.display).toBe("block");
    expect(picker.modalElement.classList.contains("active")).toBe(true);

    picker.close();
    expect(picker.isOpen).toBe(false);
    expect(picker.modalElement.classList.contains("active")).toBe(false);
  });

  test("toggle opens a closed picker and closes an open one", () => {
    const picker = mount();

    picker.toggle();
    expect(picker.isOpen).toBe(true);

    picker.toggle();
    expect(picker.isOpen).toBe(false);
  });

  test("opening an already open picker leaves it open", () => {
    const picker = mount();

    picker.open();
    picker.open();

    expect(picker.isOpen).toBe(true);
  });
});

describe("setting the time", () => {
  test("setValue moves the hour, minute and period", () => {
    const picker = mount();

    picker.setValue("09:45");

    const time = picker.getTimeObject();
    expect(time.hours).toBe(9);
    expect(time.minutes).toBe(45);
    expect(time.period).toBe(TIME_PERIOD.AM);
  });

  test("an afternoon time comes back as PM with the 24-hour hour", () => {
    const picker = mount();

    picker.setValue("16:20");

    const time = picker.getTimeObject();
    expect(time.hours).toBe(16);
    expect(time.minutes).toBe(20);
    expect(time.period).toBe(TIME_PERIOD.PM);
  });

  test("seconds set through setValue are kept", () => {
    const picker = mount({ showSeconds: true });

    picker.setValue("08:15:30");

    expect(picker.getTimeObject().seconds).toBe(30);
  });
});

describe("type, format and orientation", () => {
  test("the type is reported and shown on the dialog", () => {
    const picker = mount({ type: TIME_PICKER_TYPE.DIAL });

    expect(picker.getType()).toBe(TIME_PICKER_TYPE.DIAL);
    expect(dialogClass(picker, "dial")).toBe(true);
  });

  test("setType swaps the modifier rather than adding to it", () => {
    const picker = mount({ type: TIME_PICKER_TYPE.DIAL });

    picker.setType(TIME_PICKER_TYPE.INPUT);

    expect(picker.getType()).toBe(TIME_PICKER_TYPE.INPUT);
    expect(dialogClass(picker, "input")).toBe(true);
    expect(dialogClass(picker, "dial")).toBe(false);
  });

  test("the format is reported and can be changed", () => {
    const picker = mount({ value: "14:30", format: TIME_FORMAT.AMPM });

    expect(picker.getFormat()).toBe(TIME_FORMAT.AMPM);

    picker.setFormat(TIME_FORMAT.MILITARY);

    expect(picker.getFormat()).toBe(TIME_FORMAT.MILITARY);
  });

  test("changing the format keeps the time it was showing", () => {
    const picker = mount({ value: "14:30", format: TIME_FORMAT.AMPM });

    picker.setFormat(TIME_FORMAT.MILITARY);

    const time = picker.getTimeObject();
    expect(time.hours).toBe(14);
    expect(time.minutes).toBe(30);
  });

  test("the orientation is reported and swaps its modifier", () => {
    const picker = mount({ orientation: TIME_PICKER_ORIENTATION.VERTICAL });

    expect(picker.getOrientation()).toBe(TIME_PICKER_ORIENTATION.VERTICAL);
    expect(dialogClass(picker, "vertical")).toBe(true);

    picker.setOrientation(TIME_PICKER_ORIENTATION.HORIZONTAL);

    expect(picker.getOrientation()).toBe(TIME_PICKER_ORIENTATION.HORIZONTAL);
    expect(dialogClass(picker, "horizontal")).toBe(true);
    expect(dialogClass(picker, "vertical")).toBe(false);
  });
});

describe("the title", () => {
  test("it is the configured one, and setTitle replaces it", () => {
    const picker = mount({ title: "Pick a time" });

    expect(picker.getTitle()).toBe("Pick a time");

    picker.setTitle("Select time");

    expect(picker.getTitle()).toBe("Select time");
  });

  test("and the new title is what the dialog shows", () => {
    const picker = mount({ title: "Pick a time" });
    picker.open();

    picker.setTitle("Select time");

    const heading = picker.dialogElement.querySelector(".mtrl-time-picker__title");
    expect(heading?.textContent).toBe("Select time");
  });
});

describe("events", () => {
  test("open and close are reported to on() handlers", () => {
    const picker = mount();
    const opened = mock(() => {});
    const closed = mock(() => {});
    picker.on("open", opened);
    picker.on("close", closed);

    picker.open();
    picker.close();

    expect(opened).toHaveBeenCalled();
    expect(closed).toHaveBeenCalled();
  });

  test("setValue reports a change", () => {
    const picker = mount();
    const changed = mock(() => {});
    picker.on("change", changed);

    picker.setValue("09:30");

    expect(changed).toHaveBeenCalled();
  });

  test("off stops a handler hearing anything further", () => {
    const picker = mount();
    const changed = mock(() => {});
    picker.on("change", changed);
    picker.off("change", changed);

    picker.setValue("09:30");

    expect(changed).not.toHaveBeenCalled();
  });

  test("handlers given in config are registered too", () => {
    const onOpen = mock(() => {});
    const onChange = mock(() => {});
    const onClose = mock(() => {});
    const picker = mount({ onOpen, onChange, onClose });

    picker.open();
    picker.setValue("09:30");
    picker.close();

    expect(onOpen).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

describe("destroy", () => {
  test("it takes the picker and its modal off the page", () => {
    const picker = mount();
    picker.open();
    const { element, modalElement } = picker;
    expect(document.body.contains(modalElement)).toBe(true);

    picker.destroy();

    expect(document.body.contains(modalElement)).toBe(false);
    expect(document.body.contains(element)).toBe(false);
  });

  test("and a destroyed picker's handlers hear nothing", () => {
    const picker = mount();
    const changed = mock(() => {});
    picker.on("change", changed);

    picker.destroy();

    expect(changed).not.toHaveBeenCalled();
  });
});


describe("typed event payloads (FLO-114)", () => {
  test("setValue, format changes and input edits emit machine values", () => {
    const picker = mount({ type: TIME_PICKER_TYPE.INPUT, value: "09:30" });
    const changed = mock((_value: string) => {});
    try {
      expect(picker.on("change", changed)).toBe(picker);
      picker.setValue("14:45");
      picker.setFormat(TIME_FORMAT.MILITARY);
      const minutes = picker.dialogElement.querySelector<HTMLInputElement>(TIMEPICKER_SELECTORS.MINUTES_INPUT)!;
      minutes.value = "20";
      minutes.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      expect(changed.mock.calls).toEqual([["14:45"], ["14:45"], ["14:20"]]);
      expect(picker.off("change", changed)).toBe(picker);
      picker.setValue("16:00");
      expect(changed).toHaveBeenCalledTimes(3);
    } finally { picker.destroy(); }
  });

  test("open and close notify only on transitions; confirm supplies the machine value", () => {
    const picker = mount({ type: TIME_PICKER_TYPE.INPUT, value: "14:30" });
    const opened = mock((..._args: unknown[]) => {});
    const closed = mock((..._args: unknown[]) => {});
    const confirmed = mock((_value: string) => {});
    try {
      picker.on("open", opened).on("close", closed).on("confirm", confirmed);
      picker.open().open();
      picker.dialogElement.querySelector<HTMLButtonElement>(TIMEPICKER_SELECTORS.CONFIRM_BUTTON)!.click();
      picker.close();
      expect(opened.mock.calls).toEqual([[undefined]]);
      expect(closed.mock.calls).toEqual([[undefined]]);
      expect(confirmed.mock.calls).toEqual([["14:30"]]);
      picker.off("open", opened).off("close", closed).off("confirm", confirmed);
      picker.open();
      picker.dialogElement.querySelector<HTMLButtonElement>(TIMEPICKER_SELECTORS.CONFIRM_BUTTON)!.click();
      expect(opened).toHaveBeenCalledTimes(1);
      expect(closed).toHaveBeenCalledTimes(1);
      expect(confirmed).toHaveBeenCalledTimes(1);
    } finally { picker.destroy(); }
  });

  test("cancel button and Escape notify without payload; backdrop only closes", () => {
    const picker = mount({ type: TIME_PICKER_TYPE.INPUT, value: "09:30" });
    const canceled = mock((..._args: unknown[]) => {});
    const closed = mock((..._args: unknown[]) => {});
    try {
      picker.on("cancel", canceled).on("close", closed).open();
      picker.dialogElement.querySelector<HTMLButtonElement>(TIMEPICKER_SELECTORS.CANCEL_BUTTON)!.click();
      picker.open();
      document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape" }));
      picker.open();
      picker.modalElement.click();
      expect(canceled.mock.calls).toEqual([[undefined], [undefined]]);
      expect(closed).toHaveBeenCalledTimes(3);
      picker.off("cancel", canceled).open();
      picker.dialogElement.querySelector<HTMLButtonElement>(TIMEPICKER_SELECTORS.CANCEL_BUTTON)!.click();
      expect(canceled).toHaveBeenCalledTimes(2);
    } finally { picker.destroy(); }
  });

  test("click and keydown forward root events, with native identity, but not dialog events", () => {
    const picker = mount({ type: TIME_PICKER_TYPE.INPUT, value: "09:30" });
    const clicks = mock((..._args: Parameters<TimePickerEvents["click"]>) => {});
    const keys = mock((..._args: Parameters<TimePickerEvents["keydown"]>) => {});
    const child = document.createElement("span");
    picker.element.append(child);
    try {
      picker.on("click", clicks).on("keydown", keys);
      const click = new dom.window.MouseEvent("click", { bubbles: true, clientX: 12 });
      const key = new dom.window.KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" });
      child.dispatchEvent(click);
      child.dispatchEvent(key);
      expect(clicks.mock.calls).toEqual([[{ event: click, originalEvent: click, element: picker.element }]]);
      expect(keys.mock.calls).toEqual([[{ event: key, originalEvent: key, element: picker.element }]]);
      expect(clicks.mock.calls[0][0].event).toBe(click);
      expect(keys.mock.calls[0][0].event).toBe(key);
      picker.dialogElement.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      picker.dialogElement.dispatchEvent(new dom.window.KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }));
      expect(clicks).toHaveBeenCalledTimes(1);
      expect(keys).toHaveBeenCalledTimes(1);
      picker.off("click", clicks).off("keydown", keys);
      child.dispatchEvent(click);
      child.dispatchEvent(key);
      expect(clicks).toHaveBeenCalledTimes(1);
      expect(keys).toHaveBeenCalledTimes(1);
    } finally { picker.destroy(); }
  });

  test("the interactive root emits normalized taps and horizontal swipe details", () => {
    const picker = mount({ type: TIME_PICKER_TYPE.INPUT, value: "09:30" });
    const taps = mock((..._args: Parameters<TimePickerEvents["tap"]>) => {});
    const swipes = mock((..._args: Parameters<TimePickerEvents["swipe"]>) => {});
    const touch = (name: string, x: number, y: number) => {
      const event = new dom.window.Event(name, { bubbles: true, cancelable: true });
      Object.defineProperty(event, "touches", { value: name === "touchend" ? [] : [{ clientX: x, clientY: y, pageX: x, pageY: y }] });
      picker.element.dispatchEvent(event);
      return event;
    };
    try {
      // JSDOM exposes ontouchstart, enabling the real interactive-root touch handlers.
      expect("ontouchstart" in window).toBe(true);
      picker.on("tap", taps).on("swipe", swipes);
      touch("touchstart", 10, 20);
      touch("touchmove", 90, 30);
      expect(swipes.mock.calls).toEqual([[{ direction: "right", deltaX: 80, deltaY: 10 }]]);
      const end = touch("touchend", 90, 30);
      expect(taps).toHaveBeenCalledTimes(1);
      const payload = taps.mock.calls[0][0];
      expect(Object.keys(payload).sort()).toEqual(["clientX", "clientY", "pageX", "pageY", "preventDefault", "stopPropagation", "target", "type"].sort());
      expect([payload.type, payload.target, payload.clientX, payload.clientY]).toEqual(["touchend", picker.element, 0, 0]);
      payload.preventDefault();
      expect(end.defaultPrevented).toBe(true);
      picker.off("tap", taps).off("swipe", swipes);
      touch("touchstart", 10, 20);
      touch("touchmove", -70, 20);
      touch("touchend", -70, 20);
      expect(taps).toHaveBeenCalledTimes(1);
      expect(swipes).toHaveBeenCalledTimes(1);
    } finally { picker.destroy(); }
  });

  test("destroy clears change and root event subscriptions", () => {
    const picker = mount({ type: TIME_PICKER_TYPE.INPUT, value: "09:30" });
    const changed = mock((_value: string) => {});
    const clicked = mock(() => {});
    picker.on("change", changed).on("click", clicked);
    const root = picker.element;
    picker.destroy();
    picker.setValue("11:00");
    root.dispatchEvent(new dom.window.MouseEvent("click"));
    expect(changed).not.toHaveBeenCalled();
    expect(clicked).not.toHaveBeenCalled();
  });
});

describe("BEM element names (FLO-120)", () => {
  const prefix = "mtrl";
  test("keeps BEM hooks through rerenders and delegated actions", () => {
    const picker = mount({ title: "Appointment", value: "09:30:15", showSeconds: true });
    const find = <T extends HTMLElement>(element: string): T => {
      const result = picker.dialogElement.querySelector<T>(`.${prefix}-time-picker__${element}`);
      expect(result).not.toBeNull();
      return result!;
    };
    try {
      expect(picker.modalElement.className).toBe(`${prefix}-time-picker__modal`);
      expect(picker.dialogElement.classList.contains(`${prefix}-time-picker__dialog`)).toBe(true);
      picker.open();
      find<HTMLButtonElement>("toggle-type").click();
      expect(picker.getType()).toBe(TIME_PICKER_TYPE.INPUT);
      const minutes = find<HTMLInputElement>("minutes");
      minutes.value = "45";
      minutes.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      expect(picker.getTimeObject().minutes).toBe(45);
      find<HTMLButtonElement>("period-pm").click();
      expect(picker.getTimeObject().period).toBe(TIME_PERIOD.PM);
      expect(find("period-pm").classList.contains(`${prefix}-time-picker__period--selected`)).toBe(true);
      picker.setTitle("Updated");
      expect(find("title").textContent).toBe("Updated");
      picker.setOrientation(TIME_PICKER_ORIENTATION.HORIZONTAL);
      expect(picker.dialogElement.classList.contains(`${prefix}-time-picker__dialog--horizontal`)).toBe(true);
      const names = [picker.modalElement, picker.dialogElement, ...picker.dialogElement.querySelectorAll("*")]
        .flatMap(element => [...element.classList]);
      expect(names.some(name => name.startsWith(`${prefix}-time-picker-`))).toBe(false);
      const confirmed = mock((_value: string) => {});
      picker.on("confirm", confirmed);
      find<HTMLButtonElement>("confirm").click();
      expect(confirmed).toHaveBeenCalledTimes(1);
      expect(picker.isOpen).toBe(false);
    } finally { picker.destroy(); }
  });
});
