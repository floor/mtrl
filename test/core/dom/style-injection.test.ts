// test/core/dom/style-injection.test.ts
//
// FLO-111. `createElement` accepted `style` as a string and wrote it with
// `setAttribute("style", ...)`. A style attribute takes a whole CSS string, so
// a caller interpolating one value -- `style: "color: " + userInput` -- hands
// the parser however many declarations that value contains. Verified in
// Chromium before the change: one interpolated value produced
//
//   color: red; position: fixed; top: 0px; left: 0px;
//   width: 100vw; height: 100vh; z-index: 99999;
//
// which is a full-viewport overlay, a clickjacking primitive, out of what the
// caller believed was a colour.
//
// It cannot be sanitized. By the time createElement sees the string the
// interpolation has happened, and "the developer wrote three declarations" and
// "the developer wrote one and the user supplied two" are the same string.
// Assigning per property moves the boundary to where the information still
// exists: the CSSOM setter parses one property's value and drops it whole if
// it does not fit.
//
// So the string form is gone -- from the type, from the runtime, and from the
// two attribute helpers that offered the same write by another name.

import { describe, test, expect, beforeAll } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

beforeAll(() => {
  const g = global as any;
  const w = dom.window as any;
  for (const key of ["document", "window", "Element", "HTMLElement", "Node", "Event", "CustomEvent", "SVGElement"]) {
    if (w[key] !== undefined) g[key] = w[key];
  }
  g.document = w.document;
  g.window = w;
});

const { createElement } = await import("../../../src/core/dom/create");
const { setAttributes, batchAttributes } = await import("../../../src/core/dom/attributes");

/** What a caller would interpolate: a colour, plus an overlay smuggled after it. */
const INJECTED = "red; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999";

describe("a value interpolated into a style is confined to its property", () => {
  test("the extra declarations do not land", () => {
    const el = createElement({ tag: "div", style: { color: INJECTED } } as never);

    expect(el.style.position).toBe("");
    expect(el.style.zIndex).toBe("");
    expect(el.style.width).toBe("");
  });

  // And the property it was aimed at is refused too, rather than half-applied:
  // the CSSOM setter takes the value whole or not at all.
  test("and the property it was aimed at is left unset, not half-applied", () => {
    const el = createElement({ tag: "div", style: { color: INJECTED } } as never);

    expect(el.style.color).toBe("");
    expect(el.getAttribute("style")).toBeFalsy();
  });

  test("an ordinary object style still applies, property by property", () => {
    const el = createElement({
      tag: "div",
      style: { color: "red", position: "fixed", zIndex: "3" },
    } as never);

    expect(el.style.color).toBe("red");
    expect(el.style.position).toBe("fixed");
    expect(el.style.zIndex).toBe("3");
  });
});

// The type stops a typed consumer, but untyped JavaScript is who is most
// likely to be interpolating user input in the first place. The runtime branch
// is gone, so a string reaching it applies nothing at all.
describe("a style string from an untyped caller applies nothing", () => {
  test("no declaration from the string reaches the element", () => {
    const el = createElement({
      tag: "div",
      style: "color: red; position: fixed; z-index: 99999",
    } as never);

    expect(el.style.position).toBe("");
    expect(el.style.zIndex).toBe("");
    expect(el.style.color).toBe("");
  });

  test("and no style attribute is written", () => {
    const el = createElement({ tag: "div", style: "position: fixed" } as never);

    expect(el.getAttribute("style")).toBeFalsy();
  });
});

// Closing the style option alone would be a locked door beside an open one:
// both attribute helpers wrote whatever key they were given, style included.
describe("the attribute helpers refuse style", () => {
  test("setAttributes ignores it among other attributes", () => {
    const el = document.createElement("div");

    setAttributes(el, { id: "a", style: "position: fixed; z-index: 99999", title: "t" });

    expect(el.getAttribute("style")).toBeNull();
    expect(el.getAttribute("id")).toBe("a");
    expect(el.getAttribute("title")).toBe("t");
  });

  // setAttributes has a separate single-key fast path, which would otherwise
  // keep the sink open for exactly the call that passes style on its own.
  test("setAttributes ignores it on the single-attribute fast path", () => {
    const el = document.createElement("div");

    setAttributes(el, { style: "position: fixed; z-index: 99999" });

    expect(el.getAttribute("style")).toBeNull();
  });

  test("batchAttributes ignores it too, and still writes its siblings", () => {
    const el = document.createElement("div");

    batchAttributes(el, [
      { action: "set", key: "style", value: "position: fixed" },
      { action: "set", key: "data-x", value: "1" },
    ]);

    expect(el.getAttribute("style")).toBeNull();
    expect(el.getAttribute("data-x")).toBe("1");
  });

  test("createElement's structured attributes cannot carry one either", () => {
    const el = createElement({
      tag: "div",
      attributes: { style: "position: fixed; z-index: 99999", role: "button" },
    } as never);

    expect(el.getAttribute("style")).toBeNull();
    expect(el.getAttribute("role")).toBe("button");
  });
});
