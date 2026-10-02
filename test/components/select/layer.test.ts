// test/components/select/layer.test.ts
//
// `layer: "top"` on the select: its menu renders beside the field, in the
// field's tree (a shadow root included), as a popover="manual" element, and
// is dismissed once. Without it the menu stays in the field, as before.
// JSDOM has no popovers: the popover API is stubbed as in the menu's own
// layer test. The browser half is in scripts/check-elements.ts.

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { JSDOM } from "jsdom";
import createSelect from "../../../src/components/select";
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
  HTMLInputElement: dom.window.HTMLInputElement,
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
const OPTIONS = [
  { id: "a", text: "Apple" },
  { id: "b", text: "Banana", disabled: true },
  { id: "c", text: "Cherry" },
];

let selects: ReturnType<typeof createSelect>[];

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
  selects = [];
  popoverCalls.length = 0;
  installPopover();
});
afterEach(() => {
  selects.forEach((select) => select.destroy());
  removePopover();
  document.body.replaceChildren();
});

/** A select in a root, with a button outside it; its menu's closes counted. */
const mount = (config: Record<string, unknown> = {}, root: ParentNode = document.body) => {
  const select = createSelect({ label: "Fruit", options: OPTIONS, ...config });
  selects.push(select);
  const outside = document.createElement("button");
  root.append(select.element, outside);
  const closes: unknown[] = [];
  select.on("close", (event) => closes.push(event));
  return { select, outside, closes };
};

/** Opens by a click on the field and waits for positioning and the document listeners. */
const opened = async (select: ReturnType<typeof createSelect>) => {
  select.element.click();
  await after(150);
};

describe("select layer: top", () => {
  test("without a layer the menu opens inside the field, with no popover", async () => {
    const { select } = mount();
    await opened(select);
    expect(innerMenu(select)!.element.parentNode).toBe(select.element);
    expect(innerMenu(select)!.element.hasAttribute("popover")).toBe(false);
    expect(popoverCalls).toEqual([]);
  });

  test("the menu opens beside the field as a manual popover, fixed to the viewport", async () => {
    const { select } = mount({ layer: "top" });
    await opened(select);
    expect(select.element.nextElementSibling).toBe(innerMenu(select)!.element);
    expect(innerMenu(select)!.element.getAttribute("popover")).toBe("manual");
    expect(innerMenu(select)!.element.matches(":popover-open")).toBe(true);
    expect(innerMenu(select)!.element.style.position).toBe("fixed");
  });

  test("the menu stays in the field's shadow root", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    const { select } = mount({ layer: "top" }, root);
    await opened(select);
    expect(innerMenu(select)!.element.getRootNode()).toBe(root);
    expect(innerMenu(select)!.element.matches(":popover-open")).toBe(true);
  });

  test("in a shadow root, a click in the listbox off an option keeps it open; a click outside closes it once", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    const { select, outside, closes } = mount({ layer: "top" }, root);
    await opened(select);
    // A disabled option has no handler of its own: the document sees the host
    (innerMenu(select)!.element.querySelector('[data-id="b"]') as HTMLElement).dispatchEvent(
      new dom.window.MouseEvent("click", { bubbles: true, composed: true }),
    );
    await after(100);
    expect(select.isOpen()).toBe(true);
    outside.click();
    await after(400);
    expect(closes.length).toBe(1);
    expect(select.isOpen()).toBe(false);
  });

  test("an option chosen changes the value and closes it once", async () => {
    const { select, closes } = mount({ layer: "top" });
    await opened(select);
    (innerMenu(select)!.element.querySelector('[data-id="c"]') as HTMLElement).click();
    await after(400);
    expect({ value: select.getValue(), closes: closes.length, open: select.isOpen() }).toEqual({
      value: "c",
      closes: 1,
      open: false,
    });
  });

  test("focus moving into the menu beside the field does not close it", async () => {
    const { select } = mount({ layer: "top" });
    await opened(select);
    const option = innerMenu(select)!.element.querySelector('[data-id="a"]') as HTMLElement;
    select.textField.input.dispatchEvent(new dom.window.FocusEvent("blur", { relatedTarget: option }));
    await after(100);
    expect(select.isOpen()).toBe(true);
  });
});
