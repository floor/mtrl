// test/components/timepicker/seconds.test.ts
//
// The seconds field, which nothing drove before. render.test.ts renders with
// `showSeconds: false`, and the only suite that passes true is
// test/components/timepicker.test.ts, which builds its own mock rather than
// calling renderTimePicker (F6). So the whole branch that creates the seconds
// input and wires it was uncovered.
//
// That branch is where `secondsInput` lives -- a `let` with no type until
// FLO-114, read at a dozen sites and guarded at every one. Typing it
// `HTMLInputElement | undefined` is what says out loud that the readers are
// right to check, and this says the field they are checking for works.

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
g.HTMLInputElement = dom.window.HTMLInputElement;
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
(dom.window as any).HTMLCanvasElement.prototype.getContext = () => null;

import { renderTimePicker } from "../../../src/components/timepicker/render";
import { TIME_FORMAT, TIME_PERIOD, TIME_PICKER_TYPE } from "../../../src/components/timepicker/types";

const PREFIX = "mtrl";

function picker(showSeconds: boolean, seconds = 45) {
  const container = document.createElement("div");
  document.body.append(container);
  const changes: Array<[string, number]> = [];
  renderTimePicker(
    container,
    { hours: 10, minutes: 30, seconds, period: TIME_PERIOD.AM } as never,
    {
      prefix: PREFIX,
      format: TIME_FORMAT.AMPM,
      type: TIME_PICKER_TYPE.DIAL,
      showSeconds,
    } as never,
    (unit: string, value: number) => changes.push([unit, value]),
  );
  const inputs = [...container.querySelectorAll("input")] as HTMLInputElement[];
  return {
    container,
    changes,
    inputs,
    byType: (type: string) =>
      container.querySelector(`input[data-type="${type}"]`) as HTMLInputElement | null,
    // The field clicks only act while the dial is showing, which a DIAL
    // picker already is.
    dial: () =>
      container.querySelector(
        `.${PREFIX}-time-picker__dial`,
      ) as HTMLElement | null,
  };
}

beforeEach(() => { document.body.innerHTML = ""; });
afterAll(() => { dom.window.close(); });

describe("with showSeconds off, which is the default", () => {
  test("there is no seconds field", () => {
    const p = picker(false);

    expect(p.byType("second")).toBeNull();
    expect(p.inputs).toHaveLength(2);
  });

  test("and no separator for one either", () => {
    const p = picker(false);

    const separators = p.container.querySelectorAll(`.${PREFIX}-time-picker__separator`);
    expect(separators).toHaveLength(1);
  });
});

describe("with showSeconds on", () => {
  test("a third field appears, carrying the seconds", () => {
    const p = picker(true, 45);

    const seconds = p.byType("second");
    expect(seconds).not.toBeNull();
    expect(seconds!.value).toBe("45");
    expect(p.inputs).toHaveLength(3);
  });

  test("it is padded to two digits, as the other two are", () => {
    const p = picker(true, 7);

    expect(p.byType("second")!.value).toBe("07");
  });

  test("it is labelled and bounded like a seconds field", () => {
    const p = picker(true);
    const seconds = p.byType("second")!;

    expect(seconds.getAttribute("aria-label")).toBe("Second");
    expect(seconds.min).toBe("0");
    expect(seconds.max).toBe("59");
    expect(seconds.getAttribute("inputmode")).toBe("numeric");
  });

  test("a second separator sits before it", () => {
    const p = picker(true);

    const separators = p.container.querySelectorAll(`.${PREFIX}-time-picker__separator`);
    expect(separators).toHaveLength(2);
  });
});

describe("clicking the seconds field makes it the active one", () => {
  test("it takes data-active and the other two give it up", () => {
    const p = picker(true);
    expect(p.dial()!.style.display).toBe("block");
    const hours = p.byType("hour")!;
    const minutes = p.byType("minute")!;
    const seconds = p.byType("second")!;

    seconds.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    expect(seconds.getAttribute("data-active")).toBe("true");
    expect(hours.getAttribute("data-active")).toBe("false");
    expect(minutes.getAttribute("data-active")).toBe("false");
  });

  test("and clicking hours hands it back", () => {
    const p = picker(true);
    const hours = p.byType("hour")!;
    const seconds = p.byType("second")!;

    seconds.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    hours.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    expect(hours.getAttribute("data-active")).toBe("true");
    expect(seconds.getAttribute("data-active")).toBe("false");
  });

  // The handler checks the dial's display itself, so hiding it stops the
  // click acting. A DIAL picker starts with the dial showing, which is why the
  // tests above do not have to arrange anything.
  test("with the dial hidden the click does nothing", () => {
    const p = picker(true);
    p.dial()!.style.display = "none";
    const seconds = p.byType("second")!;
    const before = seconds.getAttribute("data-active");

    seconds.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    expect(seconds.getAttribute("data-active")).toBe(before);
  });
});
