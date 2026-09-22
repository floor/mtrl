// test/components/timepicker/render.test.ts
//
// The real renderTimePicker against a real DOM. N25 asks for conformance work
// before the time picker is tested; this covers the two parts of it that are
// behaviour rather than design — a second picker on the page, and the keyboard.
//
// The sibling suite, test/components/timepicker.test.ts, is a mock: it builds
// its own component and asserts against that, so it cannot see either defect.
// That is F6, and this file is the timepicker's first real coverage.

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
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
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import { renderTimePicker } from "../../../src/components/timepicker/render";
import { TIME_FORMAT, TIME_PERIOD, TIME_PICKER_TYPE } from "../../../src/components/timepicker/types";

const PREFIX = "mtrl";

/** A picker rendered into its own container, as a page would have it. */
function picker(hours = 10, minutes = 30, period: string = TIME_PERIOD.AM) {
  const container = document.createElement("div");
  document.body.append(container);
  const changes: Array<[string, number]> = [];
  renderTimePicker(
    container,
    { hours, minutes, seconds: 0, period } as never,
    {
      prefix: PREFIX,
      format: TIME_FORMAT.AMPM,
      type: TIME_PICKER_TYPE.DIAL,
      showSeconds: false,
    } as never,
    (key, value) => changes.push([key, value]),
  );
  return {
    container,
    changes,
    am: container.querySelector(`.${PREFIX}-time-picker__period-am`) as HTMLElement,
    pm: container.querySelector(`.${PREFIX}-time-picker__period-pm`) as HTMLElement,
  };
}

// AM/PM are radios in a group (FLO-233), so the selected state is
// aria-checked. It was aria-pressed while they were toggle buttons.
const pressed = (el: HTMLElement) => el.getAttribute("aria-checked");
const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

beforeEach(() => { document.body.innerHTML = ""; });

describe("time picker period selection", () => {
  test("clicking PM selects it and deselects AM", () => {
    const p = picker();
    expect(pressed(p.am)).toBe("true");
    expect(pressed(p.pm)).toBe("false");

    p.pm.click();

    expect(pressed(p.pm)).toBe("true");
    expect(pressed(p.am)).toBe("false");
  });

  // role="button" with tabindex="0" promises a keyboard user that Enter and
  // Space activate the control. Only click was wired, so someone who reached
  // AM or PM with Tab could focus it and had no way to choose it.
  test("Enter selects a period", () => {
    const p = picker();
    key(p.pm, "Enter");
    expect(pressed(p.pm)).toBe("true");
    expect(pressed(p.am)).toBe("false");
  });

  test("Space selects a period, and does not scroll the page", () => {
    const p = picker();
    const event = new dom.window.KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    p.pm.dispatchEvent(event);
    expect(pressed(p.pm)).toBe("true");
    // Space scrolls by default; a picker that let it through would move the
    // page out from under the person using it.
    expect(event.defaultPrevented).toBe(true);
  });

  // Arrows now move the selection, so this pins a key that is neither an
  // activation nor a navigation key.
  test("a key that neither activates nor navigates does nothing", () => {
    const p = picker();
    key(p.pm, "a");
    expect(pressed(p.pm)).toBe("false");
    expect(pressed(p.am)).toBe("true");
  });

  // Every lookup used to run through `document`, which returns the FIRST match
  // on the page. A second picker therefore wired its handlers to the first
  // picker's buttons, and its own did nothing at all.
  test("a second picker on the page controls its own period, not the first one's", () => {
    const first = picker();
    const second = picker();
    expect(first.am).not.toBe(second.am);

    second.pm.click();

    expect(pressed(second.pm)).toBe("true");
    expect(pressed(second.am)).toBe("false");
    // The first picker is untouched.
    expect(pressed(first.am)).toBe("true");
    expect(pressed(first.pm)).toBe("false");
  });

  test("the first picker still works when a second exists", () => {
    const first = picker();
    const second = picker();

    first.pm.click();

    expect(pressed(first.pm)).toBe("true");
    expect(pressed(second.am)).toBe("true");
    expect(pressed(second.pm)).toBe("false");
  });
});
