// test/core/compose/enhanced-events.test.ts
//
// `withEnhancedEvents` — the second events feature, exported from
// core/compose but applied by nothing in src. Its `on` and `off` are declared
// as returning the component and were `enhancedEvents.on.bind(enhancedEvents)`,
// which returns the *manager*. Bivariance hid the disagreement; turning on
// `strictBindCallApply` types `.bind` precisely and it surfaced.
//
// The contract is the promise, so the runtime now keeps it. Nothing covered
// this feature at all, which is how the declaration and the implementation
// disagreed unnoticed.

import { describe, test, expect, beforeEach, afterAll } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
for (const key of [
  "window", "document", "navigator", "HTMLElement", "Element", "Node",
  "Event", "MouseEvent", "KeyboardEvent", "CustomEvent",
]) {
  g[key] = (dom.window as any)[key];
}
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

import { createBase, withElement } from "../../../src/core/compose/component";
import { withEnhancedEvents } from "../../../src/core/compose/features";

const build = () => {
  const base = withElement({ tag: "div" })(
    createBase({ componentName: "probe", prefix: "mtrl" }),
  );
  const component = withEnhancedEvents()(base);
  document.body.append(component.element);
  return component;
};

beforeEach(() => { document.body.innerHTML = ""; });
afterAll(() => { dom.window.close(); });

describe("what on and off hand back", () => {
  test("on returns the component, as its type says", () => {
    const component = build();

    expect(component.on("click", () => {})).toBe(component);
  });

  test("off returns the component too", () => {
    const component = build();
    const handler = () => {};
    component.on("click", handler);

    expect(component.off("click", handler)).toBe(component);
  });

  // The manager is still reachable as `events`; it is just not what the
  // chaining methods give back.
  test("what comes back is the component, not the event manager", () => {
    const component = build();

    const returned = component.on("click", () => {});

    expect(returned).not.toBe(component.events);
    expect(typeof (returned as typeof component).element).toBe("object");
  });

  test("so a chain keeps the component's own members", () => {
    const component = build();

    const chained = component.on("click", () => {}).off("click", () => {});

    expect(chained.element).toBe(component.element);
    expect(typeof chained.getClass).toBe("function");
  });
});

describe("and the handlers still run", () => {
  test("a registered handler hears the event", () => {
    const component = build();
    const seen: string[] = [];
    component.on("click", () => seen.push("click"));

    component.element.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    expect(seen).toEqual(["click"]);
  });

  test("and one removed with off does not", () => {
    const component = build();
    const seen: string[] = [];
    const handler = () => seen.push("click");
    component.on("click", handler).off("click", handler);

    component.element.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));

    expect(seen).toEqual([]);
  });
});
