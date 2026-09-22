// test/components/timepicker/period-radiogroup.test.ts
//
// AM and PM are one choice with two options, so M3's accessibility table gives
// them the radio role in a list rather than two independent toggle buttons.
// They were `role="button"` with `aria-pressed`, which describes two things
// that can each be on or off — not a single choice where exactly one is always
// made.
//
// What a person is told changes with it: "AM, radio button, 1 of 2, selected"
// rather than "AM, button, pressed", and the group becomes one tab stop with
// arrows rather than two stops.
//
// Enter and Space still work. They were wired in #97 and people press them
// whatever the role says, so this only adds.
//
// The selected-state assertions live in render.test.ts; this file covers what
// the role itself brings — structure, the tab order, and the arrows.

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

function picker(period: string = TIME_PERIOD.AM) {
  const container = document.createElement("div");
  document.body.append(container);
  renderTimePicker(
    container,
    { hours: 10, minutes: 30, seconds: 0, period } as never,
    {
      prefix: PREFIX,
      format: TIME_FORMAT.AMPM,
      type: TIME_PICKER_TYPE.DIAL,
      showSeconds: false,
    } as never,
    () => {},
  );
  return {
    container,
    group: container.querySelector(`.${PREFIX}-time-picker__period`) as HTMLElement,
    am: container.querySelector(`.${PREFIX}-time-picker__period-am`) as HTMLElement,
    pm: container.querySelector(`.${PREFIX}-time-picker__period-pm`) as HTMLElement,
  };
}

const press = (el: HTMLElement, key: string) => {
  const event = new dom.window.KeyboardEvent("keydown", {
    key, bubbles: true, cancelable: true,
  });
  el.dispatchEvent(event);
  return event;
};

beforeEach(() => { document.body.innerHTML = ""; });

describe("AM and PM are a radiogroup", () => {
  test("the container is a labelled radiogroup", () => {
    const p = picker();
    expect(p.group.getAttribute("role")).toBe("radiogroup");
    expect(p.group.getAttribute("aria-label")).toBeTruthy();
  });

  test("each option is a radio, not a button", () => {
    const p = picker();
    expect(p.am.getAttribute("role")).toBe("radio");
    expect(p.pm.getAttribute("role")).toBe("radio");
  });

  test("the selected one is checked and the other is not", () => {
    const p = picker(TIME_PERIOD.AM);
    expect(p.am.getAttribute("aria-checked")).toBe("true");
    expect(p.pm.getAttribute("aria-checked")).toBe("false");
  });

  test("no option carries aria-pressed, which described the old role", () => {
    const p = picker();
    expect(p.am.getAttribute("aria-pressed")).toBeNull();
    expect(p.pm.getAttribute("aria-pressed")).toBeNull();
  });
});

describe("the group is a single tab stop", () => {
  test("only the selected option is in the tab order", () => {
    const p = picker(TIME_PERIOD.AM);
    expect(p.am.getAttribute("tabindex")).toBe("0");
    expect(p.pm.getAttribute("tabindex")).toBe("-1");
  });

  test("and that follows the selection when it changes", () => {
    const p = picker(TIME_PERIOD.AM);

    p.pm.click();

    expect(p.pm.getAttribute("tabindex")).toBe("0");
    expect(p.am.getAttribute("tabindex")).toBe("-1");
  });

  test("it starts on whichever option the picker opened with", () => {
    const p = picker(TIME_PERIOD.PM);
    expect(p.pm.getAttribute("tabindex")).toBe("0");
    expect(p.am.getAttribute("tabindex")).toBe("-1");
  });
});

describe("arrows move the selection, which is what the radio role adds", () => {
  for (const key of ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"]) {
    test(`${key} moves from AM to PM`, () => {
      const p = picker(TIME_PERIOD.AM);

      const event = press(p.am, key);

      expect(event.defaultPrevented).toBe(true);
      expect(p.pm.getAttribute("aria-checked")).toBe("true");
      expect(p.am.getAttribute("aria-checked")).toBe("false");
    });
  }

  test("and back again from PM", () => {
    const p = picker(TIME_PERIOD.PM);

    press(p.pm, "ArrowLeft");

    expect(p.am.getAttribute("aria-checked")).toBe("true");
    expect(p.pm.getAttribute("aria-checked")).toBe("false");
  });

  // Focus has to travel with the selection, or the one tab stop becomes a
  // place a keyboard user can get stuck.
  test("focus follows the selection", () => {
    const p = picker(TIME_PERIOD.AM);
    p.am.focus();

    press(p.am, "ArrowRight");

    expect(document.activeElement).toBe(p.pm);
  });

  test("Enter and Space still select, as they did before the role changed", () => {
    const enter = picker(TIME_PERIOD.AM);
    press(enter.pm, "Enter");
    expect(enter.pm.getAttribute("aria-checked")).toBe("true");

    document.body.innerHTML = "";

    const space = picker(TIME_PERIOD.AM);
    const event = press(space.pm, " ");
    expect(space.pm.getAttribute("aria-checked")).toBe("true");
    expect(event.defaultPrevented).toBe(true);
  });

  test("two pickers keep their own groups", () => {
    const first = picker(TIME_PERIOD.AM);
    const second = picker(TIME_PERIOD.AM);

    press(second.am, "ArrowRight");

    expect(second.pm.getAttribute("aria-checked")).toBe("true");
    expect(first.am.getAttribute("aria-checked")).toBe("true");
    expect(first.pm.getAttribute("aria-checked")).toBe("false");
  });
});
