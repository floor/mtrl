// test/components/split-button/layer.test.ts
//
// `layer: "top"` on the split button: its menu renders beside the trailing
// button, in its tree (a shadow root included), as a popover="manual"
// element. Without it the menu is appended to the body, as before. JSDOM has
// no popovers: the popover API is stubbed as in the menu's own layer test.
// The browser half is in scripts/check-elements.ts.

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { JSDOM } from "jsdom";
import createSplitButton from "../../../src/components/split-button";
import { currentlyOpenMenu, menuClosed } from "../../../src/components/menu/features/registry";
import { innerMenu } from "../../../src/components/menu/inner";

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
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  FocusEvent: dom.window.FocusEvent,
  MutationObserver: dom.window.MutationObserver,
  CustomEvent: dom.window.CustomEvent,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: () => {},
};
const previous: Record<string, unknown> = {};

type Proto = Record<string, unknown>;
const proto = dom.window.HTMLElement.prototype as unknown as Proto;
const shown = new WeakSet<Element>();
const nativeMatches = dom.window.Element.prototype.matches;
const popoverCalls: string[] = [];

/** The popover API as the browser has it: a flag and a queued toggle event. */
const installPopover = (): void => {
  const toggle = (element: HTMLElement, newState: string) =>
    setTimeout(() => element.dispatchEvent(Object.assign(new dom.window.Event("toggle"), { newState })), 0);
  proto.showPopover = function (this: HTMLElement) {
    if (!this.isConnected) throw new Error("InvalidStateError: not connected");
    popoverCalls.push(`show:${this.className}`);
    shown.add(this);
    toggle(this, "open");
  };
  proto.hidePopover = function (this: HTMLElement) {
    popoverCalls.push(`hide:${this.className}`);
    shown.delete(this);
    toggle(this, "closed");
  };
  // Removing a popover hides it, without an event
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
const ITEMS = [
  { id: "draft", text: "Save draft" },
  { id: "pdf", text: "Export PDF" },
];

let buttons: ReturnType<typeof createSplitButton>[];

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
  const open = currentlyOpenMenu();
  if (open) menuClosed(open);
  buttons = [];
  popoverCalls.length = 0;
  installPopover();
});
afterEach(() => {
  buttons.forEach((button) => button.destroy());
  removePopover();
  document.body.replaceChildren();
});

/** A split button in a root, with a button outside it; its menu's closes counted. */
const mount = (config: Record<string, unknown> = {}, root: ParentNode = document.body) => {
  const split = createSplitButton({ text: "Save", items: ITEMS, ...config });
  buttons.push(split);
  const outside = document.createElement("button");
  root.append(split.element, outside);
  const closes: unknown[] = [];
  innerMenu(split)?.on("close", (event) => closes.push(event));
  return { split, outside, closes };
};

/** Opens with the trailing button and waits for positioning and the document listeners. */
const opened = async (split: ReturnType<typeof createSplitButton>) => {
  split.trailingElement.click();
  await after(150);
};

describe("split button layer: top", () => {
  test("without a layer the menu is appended to the body, with no popover", async () => {
    const { split } = mount();
    await opened(split);
    expect(innerMenu(split)?.element.parentNode).toBe(document.body);
    expect(innerMenu(split)?.element.hasAttribute("popover")).toBe(false);
    expect(popoverCalls).toEqual([]);
  });

  test("the menu opens beside the trailing button as a manual popover, fixed to the viewport", async () => {
    const { split } = mount({ layer: "top" });
    await opened(split);
    const menu = innerMenu(split)?.element as HTMLElement;
    expect(split.trailingElement.nextElementSibling).toBe(menu);
    expect(menu.getAttribute("popover")).toBe("manual");
    expect(menu.matches(":popover-open")).toBe(true);
    expect(menu.style.position).toBe("fixed");
    expect(split.isExpanded()).toBe(true);
  });

  test("the menu stays in the button's shadow root, and a click outside closes it once", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    const { split, outside, closes } = mount({ layer: "top" }, root);
    await opened(split);
    expect(innerMenu(split)?.element.getRootNode()).toBe(root);
    // The list's padding, not an item: the document sees the host
    innerMenu(split)?.element.querySelector("ul")?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, composed: true }));
    await after(100);
    expect(innerMenu(split)?.isOpen()).toBe(true);
    outside.click();
    await after(400);
    expect({ closes: closes.length, open: innerMenu(split)?.isOpen(), expanded: split.isExpanded() }).toEqual({
      closes: 1,
      open: false,
      expanded: false,
    });
  });

  test("an item chosen is reported and closes it once", async () => {
    const { split, closes } = mount({ layer: "top" });
    const selected: unknown[] = [];
    const values: unknown[] = [];
    split.on("select", (event) => selected.push(event.item && "id" in event.item ? event.item.id : null));
    // The element's field, FLO-320
    split.on("select", (event) => values.push(event.value));
    await opened(split);
    (innerMenu(split)?.element.querySelector('[data-id="pdf"]') as HTMLElement).click();
    await after(400);
    expect({ selected, values, closes: closes.length }).toEqual({ selected: ["pdf"], values: ["pdf"], closes: 1 });
  });
});
