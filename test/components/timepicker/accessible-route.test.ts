// test/components/timepicker/accessible-route.test.ts
//
// Dr Jones decided (2026-09-20) that the text-input mode is the time picker's
// accessible route: the dial stays pointer-only rather than growing keyboard
// navigation. M3 says the same thing — manual entry through text input rather
// than exclusively the dial, with the input selector reachable from the dial
// through the keyboard icon.
//
// That decision only holds if three things are true, and none of them were:
// the fields have to be named, the dial must not present itself to assistive
// technology as something it is not, and the route between the two must be a
// safe control. These tests pin all three.
//
// Labels here are M3's own, from its accessibility table: "Hour", "Minute",
// "Toggle input picker" and "Toggle dial picker".

import { describe, test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
for (const key of [
  "window", "document", "navigator", "HTMLElement", "HTMLInputElement",
  "HTMLCanvasElement", "Element", "Node", "Event", "MouseEvent",
  "KeyboardEvent", "CustomEvent",
]) {
  g[key] = (dom.window as any)[key];
}
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
(dom.window as any).HTMLCanvasElement.prototype.getContext = () => null;

import { renderTimePicker } from "../../../src/components/timepicker/render";
import {
  TIME_FORMAT,
  TIME_PERIOD,
  TIME_PICKER_TYPE,
} from "../../../src/components/timepicker/types";

const PREFIX = "mtrl";

/** A picker rendered into its own container, as a page would have it. */
function picker(overrides: Record<string, unknown> = {}) {
  const container = document.createElement("div");
  document.body.append(container);
  renderTimePicker(
    container,
    { hours: 10, minutes: 30, seconds: 0, period: TIME_PERIOD.AM } as never,
    {
      prefix: PREFIX,
      format: TIME_FORMAT.AMPM,
      type: TIME_PICKER_TYPE.DIAL,
      showSeconds: false,
      ...overrides,
    } as never,
    () => {},
  );
  return container;
}

const q = (c: HTMLElement, sel: string) => c.querySelector(sel) as HTMLElement;

beforeEach(() => { document.body.innerHTML = ""; });

describe("the time fields are named for assistive technology", () => {
  test("the hour field is labelled Hour", () => {
    const c = picker();
    expect(q(c, `.${PREFIX}-time-picker-hours`).getAttribute("aria-label")).toBe("Hour");
  });

  test("the minute field is labelled Minute", () => {
    const c = picker();
    expect(q(c, `.${PREFIX}-time-picker-minutes`).getAttribute("aria-label")).toBe("Minute");
  });

  test("the second field is labelled Second when it is shown", () => {
    const c = picker({ showSeconds: true });
    expect(q(c, `.${PREFIX}-time-picker-seconds`).getAttribute("aria-label")).toBe("Second");
  });

  // The fields are the accessible route, so they have to be reachable in dial
  // mode too — not only after switching.
  test("the fields exist in dial mode, not only in input mode", () => {
    const c = picker({ type: TIME_PICKER_TYPE.DIAL });

    expect(q(c, `.${PREFIX}-time-picker-hours`)).not.toBeNull();
    expect(q(c, `.${PREFIX}-time-picker-minutes`)).not.toBeNull();
  });

  test("they are real text inputs, which is the role M3 asks for", () => {
    const c = picker();
    for (const cls of ["hours", "minutes"]) {
      const field = q(c, `.${PREFIX}-time-picker-${cls}`) as HTMLInputElement;
      expect(field.tagName).toBe("INPUT");
      expect(field.disabled).toBe(false);
    }
  });
});

describe("the dial does not present itself as an accessible control", () => {
  // It is drawn into a canvas, so it cannot expose a button per number. Since
  // the inputs carry the same value, the honest thing is to take the canvas
  // out of the accessibility tree rather than leave a nameless element in it.
  test("the canvas is hidden from assistive technology", () => {
    const c = picker();
    expect(q(c, `.${PREFIX}-time-picker-dial-canvas`).getAttribute("aria-hidden")).toBe("true");
  });

  test("and it is not focusable, so Tab never lands on it", () => {
    const c = picker();
    const canvas = q(c, `.${PREFIX}-time-picker-dial-canvas`);
    expect(canvas.getAttribute("tabindex")).toBeNull();
  });
});

describe("the route to the input mode is a safe, labelled button", () => {
  const toggle = (c: HTMLElement) =>
    q(c, `.${PREFIX}-time-picker-toggle-type`) as HTMLButtonElement;

  // The defect: every other button in the dialog sets type="button", this one
  // did not. A button with no type is a submit button, and the picker can sit
  // inside a form.
  test("it does not submit the form it sits in", () => {
    const c = picker();
    expect(toggle(c).getAttribute("type")).toBe("button");
  });

  test("it carries M3's label for the direction it goes in", () => {
    const c = picker({ type: TIME_PICKER_TYPE.DIAL });
    expect(toggle(c).getAttribute("aria-label")).toBe("Toggle input picker");
  });

  test("and the other label when it starts in input mode", () => {
    const c = picker({ type: TIME_PICKER_TYPE.INPUT });
    expect(toggle(c).getAttribute("aria-label")).toBe("Toggle dial picker");
  });

  test("it is a real button, so Enter and Space work without wiring", () => {
    const c = picker();
    expect(toggle(c).tagName).toBe("BUTTON");
  });

  test("cancel and confirm are safe buttons too", () => {
    const c = picker();
    expect(q(c, `.${PREFIX}-time-picker-cancel`).getAttribute("type")).toBe("button");
    expect(q(c, `.${PREFIX}-time-picker-confirm`).getAttribute("type")).toBe("button");
  });
});
