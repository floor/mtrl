// test/components/tooltip/set-text.test.ts
//
// setText clears the tooltip's children up to the arrow, then inserts the new
// text before it. Both halves assumed the arrow is still a child.
//
// It is not, for any tooltip whose element has been emptied. The loop reached
// a null firstChild, which is never equal to the arrow, and called
// removeChild(null) — a TypeError. Guarding that alone only moves the throw to
// insertBefore, whose anchor is gone as well, so both ends are handled here.
//
// Found while clearing this file for strictNullChecks (FLO-114): the compiler
// flagged `firstChild` as possibly null, and it was right for a reason the
// type alone did not say.

import { describe, test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
for (const key of [
  "window", "document", "navigator", "HTMLElement", "Element", "Node",
  "Event", "MouseEvent", "KeyboardEvent", "FocusEvent", "CustomEvent",
]) {
  g[key] = (dom.window as any)[key];
}
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };

import createTooltip from "../../../src/components/tooltip";

const tooltip = () => createTooltip({ text: "Original" } as never);

const arrowOf = (element: HTMLElement) =>
  element.querySelector('[class$="__arrow"]');

beforeEach(() => { document.body.innerHTML = ""; });

describe("tooltip setText", () => {
  test("it replaces the text and keeps the arrow", () => {
    const t = tooltip();

    t.setText("Replaced");

    expect(t.element.textContent).toBe("Replaced");
    expect(arrowOf(t.element)).not.toBeNull();
  });

  test("calling it twice leaves one piece of text, not two", () => {
    const t = tooltip();

    t.setText("First");
    t.setText("Second");

    expect(t.element.textContent).toBe("Second");
  });

  test("the text sits before the arrow", () => {
    const t = tooltip();

    t.setText("Replaced");

    const children = [...t.element.childNodes];
    const arrow = arrowOf(t.element);
    expect(children.indexOf(arrow as ChildNode)).toBe(children.length - 1);
  });

  // The defect: an emptied element leaves no arrow to stop at or insert
  // before, and setText threw on both counts.
  test("it still works on a tooltip whose element was emptied", () => {
    const t = tooltip();
    t.element.innerHTML = "";
    expect(arrowOf(t.element)).toBeNull();

    expect(() => t.setText("After clearing")).not.toThrow();

    expect(t.element.textContent).toBe("After clearing");
  });

  test("and the arrow is not resurrected — whatever removed it meant to", () => {
    const t = tooltip();
    t.element.innerHTML = "";

    t.setText("After clearing");

    expect(arrowOf(t.element)).toBeNull();
  });
});
