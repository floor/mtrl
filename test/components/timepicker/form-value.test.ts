// test/components/timepicker/form-value.test.ts
//
// A time picker renders no form control of its own, so a `name` given to it
// only ever landed on a root div and the picker took no part in any form
// (N12). It now carries a hidden input on its own element — not in the
// dialog, which is portaled to document.body and therefore outside any form.
//
// Everything goes through `new FormData(form)`, because what is being tested
// is whether the browser would actually submit the value.

import { describe, test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.HTMLCanvasElement = dom.window.HTMLCanvasElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.CustomEvent = dom.window.CustomEvent;
g.FormData = dom.window.FormData;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createTimePicker from "../../../src/components/timepicker";

/** A picker inside a form, as a page would have it. */
const inForm = (config: Record<string, unknown>) => {
  const form = document.createElement("form");
  document.body.append(form);
  const picker = createTimePicker(config as never);
  form.append(picker.element);
  return { form, picker, submitted: () => new dom.window.FormData(form) };
};

beforeEach(() => { document.body.innerHTML = ""; });

describe("a named time picker takes part in a form", () => {
  test("it submits its initial value", () => {
    const { submitted } = inForm({ name: "start", value: "14:30" });
    expect(submitted().get("start")).toBe("14:30");
  });

  test("it submits the value after a programmatic change", () => {
    const { picker, submitted } = inForm({ name: "start", value: "14:30" });

    picker.setValue("09:05");

    expect(submitted().get("start")).toBe("09:05");
  });

  // The decision was 24-hour, whatever the picker displays. A form that
  // received "02:30 PM" from one picker and "14:30" from another would be
  // unparseable on the server.
  test("it submits 24-hour time even when the picker shows AM/PM", () => {
    const { picker, submitted } = inForm({ name: "start", value: "14:30", format: "ampm" });

    expect(submitted().get("start")).toBe("14:30");
    expect(picker.getValue()).toContain("PM");
  });

  test("it submits seconds only when the picker shows them", () => {
    const withoutSeconds = inForm({ name: "a", value: "14:30" });
    expect(withoutSeconds.submitted().get("a")).toBe("14:30");

    document.body.innerHTML = "";

    const withSeconds = inForm({ name: "b", value: "14:30:45", showSeconds: true });
    expect(withSeconds.submitted().get("b")).toBe("14:30:45");
  });

  // The defect, stated directly.
  test("without a name it submits nothing at all", () => {
    const { submitted } = inForm({ value: "14:30" });
    expect([...submitted().keys()]).toEqual([]);
  });

  // The dialog is appended to document.body, so anything in it is outside the
  // form. The hidden input has to be on the component's own element.
  test("the field is inside the form, not in the portaled dialog", () => {
    const { form, submitted } = inForm({ name: "start", value: "14:30" });

    expect(form.querySelector('input[name="start"]')).not.toBeNull();
    expect(submitted().get("start")).toBe("14:30");
  });

  test("form.reset() leaves the submitted value matching the picker", () => {
    const { form, picker, submitted } = inForm({ name: "start", value: "14:30" });
    picker.setValue("09:05");

    form.reset();

    expect(submitted().get("start")).toBe("09:05");
  });

  test("two pickers in one form submit their own values", () => {
    const form = document.createElement("form");
    document.body.append(form);
    const first = createTimePicker({ name: "from", value: "09:00" } as never);
    const second = createTimePicker({ name: "to", value: "17:30" } as never);
    form.append(first.element, second.element);

    const data = new dom.window.FormData(form);
    expect(data.get("from")).toBe("09:00");
    expect(data.get("to")).toBe("17:30");
  });
});
