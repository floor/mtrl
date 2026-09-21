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
// One exception, and it is marked where it appears: getValue() disagrees with
// the value the component submits and with its own documentation. That is
// FLO-237. The assertions here pin what it does today so it cannot drift
// further unnoticed; they record it, they do not endorse it.

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

import createTimePicker from "../../../src/components/timepicker";
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
  picker.dialogElement.classList.contains(`mtrl-time-picker-dialog--${modifier}`);

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

  // FLO-237: getValue() returns the *display* string, so it carries the period
  // and always carries seconds, while the value this component submits is
  // "14:30". Pinned, not endorsed — when FLO-237 is settled these three fail
  // and should be updated to whatever is decided.
  test("getValue returns the display string, which is FLO-237", () => {
    expect(mount({ value: "14:30" }).getValue()).toBe("02:30:00 PM");
  });

  test("including seconds even when showSeconds is off — also FLO-237", () => {
    const picker = mount({ value: "14:30", showSeconds: false });

    expect(picker.getValue()).toBe("02:30:00 PM");
  });

  test("and in 24-hour form it is still seconds-padded — also FLO-237", () => {
    expect(mount({ value: "14:30", format: TIME_FORMAT.MILITARY }).getValue()).toBe("14:30:00");
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

    const heading = picker.dialogElement.querySelector(".mtrl-time-picker-title");
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
