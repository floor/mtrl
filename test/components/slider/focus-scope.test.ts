// test/components/slider/focus-scope.test.ts
//
// Two sliders on one page. The focus indicator used to be cleared with a sweep
// across the whole document, so starting a drag on one slider stripped the
// focus ring from every other one — a keyboard user lost the indicator telling
// them where they were in a component they had not touched.
//
// The slider wires its listeners asynchronously, so every test here waits for
// that before dispatching. Without the wait nothing is attached yet, the events
// land on nothing, and the assertions pass while proving nothing.

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
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createSlider from "../../../src/components/slider";

const HANDLE = "mtrl-slider__handle";
const FOCUSED = `${HANDLE}--focused`;

/** A mounted slider whose listeners are attached. */
const mount = async () => {
  const slider = createSlider({ min: 0, max: 100, value: 50 });
  document.body.append(slider.element);
  await new Promise((resolve) => setTimeout(resolve, 50));
  return slider;
};

const handleOf = (slider: { element: HTMLElement }) =>
  slider.element.querySelector(`.${HANDLE}`) as HTMLElement;

const pressOn = (el: HTMLElement) => {
  const event = new dom.window.MouseEvent("mousedown", {
    bubbles: true,
    cancelable: true,
    clientX: 10,
  });
  el.dispatchEvent(event);
  // The handler preventDefaults a mousedown, so this doubles as proof that it
  // ran at all rather than the event landing on nothing.
  return event.defaultPrevented;
};

beforeEach(() => { document.body.innerHTML = ""; });

describe("slider focus indicators are its own", () => {
  test("starting a drag clears this slider's focus indicator", async () => {
    const slider = await mount();
    const handle = handleOf(slider);
    handle.classList.add(FOCUSED);

    expect(pressOn(handle)).toBe(true);

    expect(handle.classList.contains(FOCUSED)).toBe(false);
  });

  test("and leaves another slider's alone", async () => {
    const first = await mount();
    const second = await mount();
    const a = handleOf(first);
    const b = handleOf(second);
    expect(a).not.toBe(b);

    // Both carry the indicator, as two sliders in a form would after a
    // keyboard user has visited each.
    a.classList.add(FOCUSED);
    b.classList.add(FOCUSED);

    expect(pressOn(a)).toBe(true);

    expect(a.classList.contains(FOCUSED)).toBe(false);
    expect(b.classList.contains(FOCUSED)).toBe(true);
  });

  test("the second slider still clears its own", async () => {
    const first = await mount();
    const second = await mount();
    const a = handleOf(first);
    const b = handleOf(second);
    a.classList.add(FOCUSED);
    b.classList.add(FOCUSED);

    expect(pressOn(b)).toBe(true);

    expect(b.classList.contains(FOCUSED)).toBe(false);
    expect(a.classList.contains(FOCUSED)).toBe(true);
  });
});
