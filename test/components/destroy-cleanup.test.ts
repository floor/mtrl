// test/components/destroy-cleanup.test.ts
//
// FLO-104 / N30: whether components skip their own cleanup on destroy was
// unverified. Three earlier attempts to check every component at once were
// each confounded — a wrapper swap missed captured references, a mount-based
// check tripped over N29, and an event-based check could not detect the known
// N28 bypass even when run against the commit before its fix.
//
// This one observes only what a component cannot hide: what is left in the
// document after `destroy()`. Nothing is swapped, nothing is mounted, and no
// internal is read — the public factory is called, the component is destroyed,
// and the document is inspected. N29 is fixed (FLO-103), which is what makes
// the direct approach available now.
//
// Reading `component.resources` does NOT work as a check, and that is worth
// recording: the public API object does not re-expose the cleanup scope, so
// the scope reads as undefined from outside whether or not it ran. That is the
// same class of confound as the three earlier attempts.
//
// The sweep is driven by the component barrel rather than a hand-written list,
// so a new component is covered the day it is exported.

import { describe, test, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as any;
for (const key of [
  "window", "document", "navigator", "HTMLElement", "HTMLInputElement",
  "HTMLCanvasElement", "Element", "Node", "Event", "InputEvent", "MouseEvent",
  "KeyboardEvent", "FocusEvent", "CustomEvent", "FormData", "DOMParser", "SVGElement",
]) {
  g[key] = (dom.window as any)[key];
}
g.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};
g.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
g.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
g.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
// jsdom ships no canvas. Progress draws on one and copes with a null context;
// this keeps the gap from filling the run with "Not implemented" noise without
// pretending to be a canvas.
(dom.window as any).HTMLCanvasElement.prototype.getContext = () => null;
g.matchMedia = () => ({
  matches: false,
  addEventListener() {}, removeEventListener() {},
  addListener() {}, removeListener() {},
});

import * as components from "../../src/components";

/** The smallest config each component needs in order to exist at all. */
const CONFIGS: Record<string, Record<string, unknown>> = {
  createCarousel: { slides: [{ image: "a.png" }] },
  createChips: { chips: [{ text: "One" }] },
  createList: { items: [{ id: "1", text: "One" }] },
  createNavigationRail: { items: [{ id: "a", label: "A", icon: "<svg></svg>" }] },
  createRadios: { name: "r", options: [{ value: "a", label: "A" }] },
  createSegmentedButton: { segments: [{ text: "A" }] },
  createSelect: { options: [{ id: "a", value: "a", text: "A" }] },
  createSnackbar: { message: "Saved" },
  createSplitButton: { text: "Go", menu: [{ id: "a", text: "A" }] },
  createTabs: { tabs: [{ text: "One", value: "one" }] },
};

/**
 * Components deliberately left out, with the reason. Anything not listed here
 * and not constructible is a failure, so this list is the record of what is
 * NOT covered rather than a way to make the suite pass.
 */
const NOT_A_COMPONENT: Record<string, string> = {
  createCardActions: "builds card content, returns no component",
  createCardContent: "builds card content, returns no component",
  createCardHeader: "builds card content, returns no component",
  createCardMedia: "builds card content, returns no component",
  createSegment: "a part of segmented-button, not constructed on its own",
};

const factories = Object.entries(components).filter(
  ([name, value]) => name.startsWith("create") && typeof value === "function",
) as [string, (config: unknown) => { element?: HTMLElement; destroy?: () => void }][];

beforeEach(() => { document.body.innerHTML = ""; });

describe("every component cleans up after destroy()", () => {
  test("the barrel exports the components this suite thinks it does", () => {
    // A guard on the sweep itself: if the barrel stops exporting factories,
    // every test below would pass by covering nothing.
    expect(factories.length).toBeGreaterThan(35);
  });

  for (const [name, factory] of factories) {
    const skip = NOT_A_COMPONENT[name];

    test(`${name}${skip ? ` — not covered: ${skip}` : ""}`, () => {
      if (skip) {
        // Pinned so the exclusion stays deliberate: either it cannot stand on
        // its own, or it owns no element — so there is nothing to destroy. If
        // one of these grows an element and a destroy, this fails and it
        // joins the sweep rather than sitting silently excluded.
        let built: { element?: HTMLElement } | undefined;
        let refused = false;
        try {
          built = factory(CONFIGS[name] ?? {}) as { element?: HTMLElement };
        } catch {
          refused = true;
        }
        expect(refused || built?.element === undefined).toBe(true);
        return;
      }

      const config: Record<string, unknown> = { ...(CONFIGS[name] ?? {}) };
      let opener: HTMLElement | null = null;
      if (name === "createMenu") {
        opener = document.createElement("button");
        document.body.append(opener);
        config.opener = opener;
      }

      const component = factory(config);
      const element = component.element;

      expect(element).toBeDefined();
      expect(typeof component.destroy).toBe("function");

      if (!element!.isConnected) document.body.append(element!);
      expect(element!.isConnected).toBe(true);

      component.destroy!();

      // Its own element is gone.
      expect(element!.isConnected).toBe(false);

      // And so is anything it put elsewhere — a portaled dialog, an overlay,
      // a submenu. This is the half that catches a component which removes
      // its root and forgets what it appended to the body.
      const leftBehind = [...document.body.children]
        .filter((child) => child !== opener)
        .map((child) => child.className || child.tagName.toLowerCase());
      expect(leftBehind).toEqual([]);
    });
  }
});
