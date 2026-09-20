// test/components/slider/form-value.test.ts
//
// A slider renders no form control of its own, so a `name` given to it only
// ever landed on a root div and the slider took no part in any form (N12).
// It now carries a hidden input.
//
// Everything here goes through `new FormData(form)` rather than reading the
// input back, because what is being tested is whether the browser would
// actually submit the value.

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
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.FocusEvent = dom.window.FocusEvent;
g.CustomEvent = dom.window.CustomEvent;
g.FormData = dom.window.FormData;
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createSlider from "../../../src/components/slider";

/** A slider inside a form, as a page would have it. */
const inForm = (config: Record<string, unknown>) => {
  const form = document.createElement("form");
  document.body.append(form);
  const slider = createSlider(config as never);
  form.append(slider.element);
  return { form, slider, submitted: () => new dom.window.FormData(form) };
};

beforeEach(() => { document.body.innerHTML = ""; });

describe("a named slider takes part in a form", () => {
  test("it submits its initial value", () => {
    const { submitted } = inForm({ name: "volume", min: 0, max: 100, value: 40 });
    expect(submitted().get("volume")).toBe("40");
  });

  test("it submits the value after a programmatic change", () => {
    const { slider, submitted } = inForm({ name: "volume", min: 0, max: 100, value: 40 });

    slider.setValue(75);

    expect(submitted().get("volume")).toBe("75");
  });

  // setValue(value, false) skips the change event. The submitted value must
  // still follow, or a form would send a number the slider is not showing.
  test("it follows a change that fires no event", () => {
    const { slider, submitted } = inForm({ name: "volume", min: 0, max: 100, value: 40 });

    slider.setValue(75, false);

    expect(submitted().get("volume")).toBe("75");
  });

  test("a clamped value submits as clamped, not as asked for", () => {
    const { slider, submitted } = inForm({ name: "volume", min: 0, max: 100, value: 40 });

    slider.setValue(500);

    expect(submitted().get("volume")).toBe("100");
  });

  // The defect, stated directly.
  test("without a name it submits nothing at all", () => {
    const { submitted } = inForm({ min: 0, max: 100, value: 40 });
    expect([...submitted().keys()]).toEqual([]);
  });

  test("a disabled slider submits nothing", () => {
    const { submitted } = inForm({ name: "volume", min: 0, max: 100, value: 40, disabled: true });
    expect(submitted().has("volume")).toBe(false);
  });

  test("disabling and re-enabling moves it out of the form and back", () => {
    const { slider, submitted } = inForm({ name: "volume", min: 0, max: 100, value: 40 });
    expect(submitted().get("volume")).toBe("40");

    slider.disable();
    expect(submitted().has("volume")).toBe(false);

    slider.enable();
    expect(submitted().get("volume")).toBe("40");
  });

  // The hidden input keeps its attribute in step with its value, so a reset
  // cannot leave the form submitting something the slider is not showing.
  test("form.reset() leaves the submitted value matching the slider", () => {
    const { form, slider, submitted } = inForm({ name: "volume", min: 0, max: 100, value: 40 });
    slider.setValue(75);

    form.reset();

    expect(submitted().get("volume")).toBe(String(slider.getValue()));
    expect(submitted().get("volume")).toBe("75");
  });
});

describe("a named range slider submits both ends", () => {
  const range = () =>
    inForm({ name: "price", range: true, min: 0, max: 100, value: 20, secondValue: 80 });

  test("it submits name and name-end", () => {
    const data = range().submitted();
    expect(data.get("price")).toBe("20");
    expect(data.get("price-end")).toBe("80");
  });

  test("both ends follow their changes", () => {
    const { slider, submitted } = range();

    slider.setValue(30);
    slider.setSecondValue(90);

    const data = submitted();
    expect(data.get("price")).toBe("30");
    expect(data.get("price-end")).toBe("90");
  });

  test("a disabled range slider submits neither end", () => {
    const { slider, submitted } = range();
    slider.disable();

    const data = submitted();
    expect(data.has("price")).toBe(false);
    expect(data.has("price-end")).toBe(false);
  });

  test("an unnamed range slider submits nothing", () => {
    const { submitted } = inForm({ range: true, min: 0, max: 100, value: 20, secondValue: 80 });
    expect([...submitted().keys()]).toEqual([]);
  });

  test("a named slider that is not a range submits only one field", () => {
    const { submitted } = inForm({ name: "volume", min: 0, max: 100, value: 40 });
    expect([...submitted().keys()]).toEqual(["volume"]);
  });
});
