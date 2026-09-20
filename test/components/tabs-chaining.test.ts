// test/components/tabs-chaining.test.ts
//
// Tabs' chaining methods return the tabs component, and the declarations now
// say so with `this` rather than naming TabsComponent. The runtime was always
// right -- `withEvents` returns the object the method was called on -- but the
// pipeline's own `emit` reached the public API through a spread, and a spread
// does not carry a `this` type with it. `withAPI` therefore declares `emit`
// alongside `on` and `off`, which it already did.
//
// So the type and the runtime agree now, and what this file does is stop them
// drifting apart again: it checks the identity at runtime, which is the half
// the compiler cannot see, and checks that the chained result still answers to
// the tabs API, which is what the old declaration threw away.
//
// This drives the real component. The existing tabs.test.ts mocks it (F6).
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
const g = global as any;

beforeAll(() => {
  const w = dom.window as any;
  for (const key of ["document", "window", "Element", "HTMLElement", "Node", "Event",
    "CustomEvent", "MouseEvent", "KeyboardEvent", "MutationObserver", "getComputedStyle"]) {
    if (w[key] !== undefined) g[key] = w[key];
  }
  g.document = w.document;
  g.window = w;
  g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
  g.cancelAnimationFrame = (id: number) => clearTimeout(id);
  // JSDOM has neither; tabs observes its scroller and its own mutations.
  g.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.ResizeObserver = g.ResizeObserver;
});

afterAll(() => {
  dom.window.close();
});

const { default: createTabs } = await import("../../src/components/tabs/tabs");

const tabs = () =>
  createTabs({
    tabs: [
      { text: "One", value: "one", state: "active" },
      { text: "Two", value: "two" },
    ],
  });

describe("what the chaining methods hand back", () => {
  test("emit returns the tabs component itself", () => {
    const component = tabs();

    expect(component.emit!("change", { value: "one" })).toBe(component);
  });

  test("on and off do too", () => {
    const component = tabs();
    const handler = () => {};

    expect(component.on("change", handler)).toBe(component);
    expect(component.off("change", handler)).toBe(component);
  });

  // The declaration used to name TabsComponent, so what a chain produced was
  // typed as the whole component while the method itself came from the
  // pipeline. Calling on through emit's result is the shape that was claimed
  // and never checked.
  test("the tabs API is still there after a chain", () => {
    const component = tabs();

    const chained = component.emit!("change", { value: "two" });

    expect(typeof chained.addTab).toBe("function");
    expect(typeof chained.getTabs).toBe("function");
    expect(chained.getTabs()).toHaveLength(2);
  });

  test("emit still reaches the handlers", () => {
    const component = tabs();
    const seen: unknown[] = [];
    component.on("change", (data: unknown) => seen.push(data));

    component.emit!("change", { value: "two" });

    expect(seen).toEqual([{ value: "two" }]);
  });

  test("and a handler removed with off stops hearing it", () => {
    const component = tabs();
    const seen: unknown[] = [];
    const handler = (data: unknown) => seen.push(data);

    component.on("change", handler).off("change", handler);
    component.emit!("change", { value: "two" });

    expect(seen).toEqual([]);
  });
});
