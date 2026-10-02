// test/components/tooltip/layer.test.ts
//
// `layer: "top"`: the tooltip renders after its target, in the target's tree
// (a shadow root included), as a popover="manual" element placed in viewport
// coordinates. JSDOM has no popovers: the popover API is stubbed on this
// window's prototype, a flag per element. The browser half, stacking, styles
// and the element, is in scripts/check-elements.ts.

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { JSDOM } from "jsdom";
import createTooltip from "../../../src/components/tooltip";
import type { TooltipComponent } from "../../../src/components/tooltip";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
const g = globalThis as unknown as Record<string, unknown>;
const globals: Record<string, unknown> = {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Event: dom.window.Event,
  KeyboardEvent: dom.window.KeyboardEvent,
};
const previous: Record<string, unknown> = {};

type Proto = Record<string, unknown>;
const proto = dom.window.HTMLElement.prototype as unknown as Proto;
const shown = new WeakSet<Element>();
const nativeMatches = dom.window.Element.prototype.matches;
const popoverCalls: string[] = [];

const installPopover = (): void => {
  proto.showPopover = function (this: HTMLElement) {
    if (!this.isConnected) throw new Error("InvalidStateError: not connected");
    popoverCalls.push("show");
    shown.add(this);
  };
  proto.hidePopover = function (this: HTMLElement) {
    popoverCalls.push("hide");
    shown.delete(this);
  };
  (dom.window.Element.prototype as unknown as Proto).matches = function (this: Element, selector: string) {
    return selector === ":popover-open" ? shown.has(this) && this.isConnected : nativeMatches.call(this, selector);
  };
};
const removePopover = (): void => {
  delete proto.showPopover;
  delete proto.hidePopover;
  dom.window.Element.prototype.matches = nativeMatches;
};

const after = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let tooltips: TooltipComponent[];

beforeAll(() => {
  for (const [name, value] of Object.entries(globals)) {
    previous[name] = g[name];
    g[name] = value;
  }
});
afterAll(() => {
  for (const name of Object.keys(globals)) g[name] = previous[name];
});
beforeEach(() => {
  tooltips = [];
  popoverCalls.length = 0;
  installPopover();
});
afterEach(() => {
  tooltips.forEach((tooltip) => tooltip.destroy());
  removePopover();
  document.body.replaceChildren();
  Reflect.deleteProperty(dom.window, "scrollY");
});

/** A target at a known place in a wrapper, the page scrolled by 500px. */
const setup = (root: ParentNode = document.body) => {
  const wrapper = document.createElement("div");
  const target = document.createElement("button");
  wrapper.append(target);
  root.append(wrapper);
  target.getBoundingClientRect = () =>
    ({ top: 100, bottom: 140, left: 200, right: 300, width: 100, height: 40, x: 200, y: 100 }) as DOMRect;
  Object.defineProperty(dom.window, "scrollY", { value: 500, configurable: true });
  return { wrapper, target };
};

const make = (config: Record<string, unknown>): TooltipComponent => {
  const tooltip = createTooltip({ text: "Save the file", ...config });
  tooltips.push(tooltip);
  return tooltip;
};

describe("tooltip layer: top", () => {
  test("places every direction and alignment from layout size during a scale transition", () => {
    const { target } = setup();
    target.getBoundingClientRect = () =>
      ({ top: 100, bottom: 140, left: 400, right: 500, width: 100, height: 40 }) as DOMRect;
    const tooltip = make({ target });
    Object.defineProperties(tooltip.element, {
      offsetWidth: { configurable: true, value: 200 },
      offsetHeight: { configurable: true, value: 40 },
    });
    tooltip.element.getBoundingClientRect = () =>
      ({ width: 180, height: 36 }) as DOMRect;
    tooltip.show(true);
    const placements = [
      ["top", 552, 350], ["top-start", 552, 400], ["top-end", 552, 300],
      ["right", 600, 508], ["right-start", 600, 508], ["right-end", 600, 508],
      ["bottom", 648, 350], ["bottom-start", 648, 400], ["bottom-end", 648, 300],
      ["left", 600, 192], ["left-start", 600, 192], ["left-end", 600, 192],
    ] as const;
    for (const [position, top, left] of placements) {
      tooltip.setPosition(position);
      expect(tooltip.element.style.top).toBe(`${top}px`);
      expect(tooltip.element.style.left).toBe(`${left}px`);
    }
  });

  test("without a layer the tooltip is on the body, with no popover, at document coordinates", () => {
    const { target } = setup();
    const tooltip = make({ target });
    expect(tooltip.element.parentNode).toBe(document.body);
    tooltip.show(true);
    expect(tooltip.element.hasAttribute("popover")).toBe(false);
    expect(tooltip.element.style.top).toBe(`${140 + 500 + 8}px`);
    expect(popoverCalls).toEqual([]);
  });

  test("renders after its target as a manual popover, at viewport coordinates", () => {
    const { target, wrapper } = setup();
    const tooltip = make({ target, layer: "top" });
    expect(tooltip.element.parentNode).toBe(wrapper);
    expect(target.nextElementSibling).toBe(tooltip.element);
    expect(tooltip.element.getAttribute("popover")).toBe("manual");
    expect(tooltip.element.matches(":popover-open")).toBe(false);
    tooltip.show(true);
    expect(tooltip.element.matches(":popover-open")).toBe(true);
    expect(tooltip.element.style.top).toBe(`${140 + 8}px`);
    expect(popoverCalls).toEqual(["show"]);
  });

  test("is not on the body before it has a target", () => {
    const tooltip = make({ layer: "top" });
    expect(tooltip.element.isConnected).toBe(false);
  });

  test("stays inside its target's shadow root", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    const { target } = setup(root);
    const tooltip = make({ target, layer: "top" });
    tooltip.show(true);
    expect(tooltip.element.getRootNode()).toBe(root);
    expect(tooltip.element.matches(":popover-open")).toBe(true);
  });

  test("stays where its owner put it", () => {
    const { target } = setup();
    const owner = document.createElement("section");
    document.body.append(owner);
    const tooltip = make({ layer: "top" });
    owner.append(tooltip.element);
    tooltip.setTarget(target);
    tooltip.show(true);
    expect(tooltip.element.parentNode).toBe(owner);
    expect(tooltip.element.matches(":popover-open")).toBe(true);
  });

  test("leaves the top layer after its exit transition, unless shown again", async () => {
    const { target } = setup();
    const tooltip = make({ target, layer: "top" });
    tooltip.show(true);
    tooltip.hide(true);
    expect(tooltip.element.matches(":popover-open")).toBe(true);
    await after(200);
    expect(tooltip.element.matches(":popover-open")).toBe(false);

    tooltip.show(true);
    tooltip.hide(true);
    await after(50);
    tooltip.show(true);
    await after(200);
    expect(tooltip.element.matches(":popover-open")).toBe(true);
    expect(tooltip.isVisible()).toBe(true);
  });

  test("Escape hides it", async () => {
    const { target } = setup();
    const tooltip = make({ target, layer: "top" });
    tooltip.show(true);
    document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape" }));
    await after(200);
    expect(tooltip.isVisible()).toBe(false);
    expect(tooltip.element.matches(":popover-open")).toBe(false);
  });

  test("without popover support it is the tooltip without a layer", () => {
    removePopover();
    const { target } = setup();
    const tooltip = make({ target, layer: "top" });
    expect(tooltip.element.parentNode).toBe(document.body);
    expect(tooltip.element.hasAttribute("popover")).toBe(false);
    tooltip.show(true);
    expect(tooltip.element.style.top).toBe(`${140 + 500 + 8}px`);
  });
});
