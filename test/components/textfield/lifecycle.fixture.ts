import { afterEach, beforeEach, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import createTextfield from "../../../src/components/textfield";

let dom: JSDOM;
let restore: (() => void)[];
let fields: ReturnType<typeof createTextfield>[];
let activeObservers: Set<MutationObserver>;
let listeners: Map<string, Set<EventListenerOrEventListenerObject>>;
const tick = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));
beforeEach(() => {
  dom = new JSDOM('<!doctype html><html><body><main style="background: rgb(12, 34, 56)"></main></body></html>', { pretendToBeVisual: true });
  restore = []; fields = []; activeObservers = new Set(); listeners = new Map();
  const replace = (target: object, name: string, value: unknown) => {
    const previous = Object.getOwnPropertyDescriptor(target, name);
    Object.defineProperty(target, name, { value, writable: true, configurable: true });
    restore.push(() => { if (previous) Object.defineProperty(target, name, previous); else Reflect.deleteProperty(target, name); });
  };
  replace(globalThis, "window", dom.window);
  for (const name of ["document", "HTMLElement", "Element", "Node", "Event", "CustomEvent", "getComputedStyle"]) replace(globalThis, name, Reflect.get(dom.window, name));
  replace(globalThis, "MutationObserver", class extends dom.window.MutationObserver {
    observe(target: Node, options?: MutationObserverInit) { activeObservers.add(this); super.observe(target, options); }
    disconnect() { activeObservers.delete(this); super.disconnect(); }
  });
  for (const [target, type] of [[window, "resize"], [document, "themechange"]] as const) {
    const set = new Set<EventListenerOrEventListenerObject>(); listeners.set(type, set);
    const add = target.addEventListener.bind(target), remove = target.removeEventListener.bind(target);
    replace(target, "addEventListener", (name: string, callback: EventListener, options?: boolean | AddEventListenerOptions) => { if (name === type) set.add(callback); add(name, callback, options); });
    replace(target, "removeEventListener", (name: string, callback: EventListener, options?: boolean | EventListenerOptions) => { if (name === type) set.delete(callback); remove(name, callback, options); });
  }
});
afterEach(() => {
  fields.forEach(field => field.destroy());
  activeObservers.forEach(observer => observer.disconnect());
  restore.reverse().forEach(fn => fn()); dom.window.close();
});
const make = () => {
  const field = createTextfield({ label: "Amount", value: "10", variant: "outlined", leadingIcon: "<span>+</span>", prefixText: "$", suffixText: "USD", supportingText: "Total" });
  document.querySelector("main")!.append(field.element); fields.push(field); return field;
};
const released = () => {
  for (const set of listeners.values()) expect(set.size).toBe(0);
  expect(activeObservers.size).toBe(0);
};
test("destroy before initialization never installs resize listeners or observers", async () => {
  const field = make(); field.destroy(); await tick(); released();
});
test("destroy releases placement, background and autofill observers", async () => {
  const field = make(); await tick();
  expect(listeners.get("resize")!.size).toBe(1);
  expect(listeners.get("themechange")!.size).toBe(1);
  expect(activeObservers.size).toBeGreaterThan(0);
  field.destroy(); released(); await tick(); released();
});
test("pending placement changes cannot restart a destroyed field", async () => {
  const field = make(); await tick();
  field.setVariant("filled"); field.setVariant("outlined");
  field.element.classList.add("changed"); await Promise.resolve();
  field.destroy();
  // A retained/reinserted element must not make old delayed work live again.
  document.querySelector("main")!.append(field.element);
  await tick();
  window.dispatchEvent(new Event("resize")); document.dispatchEvent(new Event("themechange"));
  released();
});
test("40 mount/destroy cycles leave no global listeners or observers", async () => {
  for (let i = 0; i < 40; i++) {
    const field = make(); if (i % 2) await tick(1);
    field.destroy(); field.destroy(); await tick(1); released();
  }
});
