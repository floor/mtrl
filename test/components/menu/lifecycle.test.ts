import { afterEach, beforeEach, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import createMenu from "../../../src/components/menu";
import { currentlyOpenMenu, menuClosed } from "../../../src/components/menu/features/registry";

let dom: JSDOM;
let restore: (() => void)[];
let pending: Map<number, () => void>;
let listeners: Map<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>;
let menus: ReturnType<typeof createMenu>[];
let opener: HTMLButtonElement;
let tick: () => void;

beforeEach(() => {
  // Other component tests can leave a menu registered in their own document.
  const previous = currentlyOpenMenu();
  if (previous) menuClosed(previous);
  dom = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true });
  restore = [];
  menus = [];
  pending = new Map();
  listeners = new Map();
  const replace = (target: any, name: string, value: any) => {
    const previous = target[name];
    target[name] = value;
    restore.push(() => { target[name] = previous; });
  };
  for (const name of ["window", "document", "HTMLElement", "Element", "Node", "Event", "MouseEvent", "KeyboardEvent", "CustomEvent", "MutationObserver", "getComputedStyle"]) {
    replace(globalThis, name, name === "window" ? dom.window : (dom.window as any)[name]);
  }
  // Track only global listeners owned by menus (not JSDOM's internal events).
  for (const target of [document, window]) {
    const tracked = new Map<string, Set<EventListenerOrEventListenerObject>>();
    listeners.set(target, tracked);
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);
    replace(target, "addEventListener", (type: string, handler: EventListener, options: any) => {
      if (["keydown", "click", "resize", "scroll"].includes(type)) {
        if (!tracked.has(type)) tracked.set(type, new Set());
        tracked.get(type)!.add(handler);
      }
      add(type, handler, options);
    });
    replace(target, "removeEventListener", (type: string, handler: EventListener, options: any) => {
      tracked.get(type)?.delete(handler);
      remove(type, handler, options);
    });
  }
  const nativeTimeout = globalThis.setTimeout;
  let next = 0;
  const schedule = (callback: () => void) => {
    // JSDOM queues its own selectionchange events when focus moves.
    // Keep emulator work separate from the menu's pending work.
    if (new Error().stack?.split("\n")[2]?.includes("/jsdom/")) return nativeTimeout(callback, 0);
    pending.set(--next, callback);
    return next;
  };
  replace(globalThis, "setTimeout", schedule);
  replace(globalThis, "clearTimeout", (id: number) => pending.delete(id));
  replace(window, "requestAnimationFrame", schedule);
  replace(window, "cancelAnimationFrame", (id: number) => pending.delete(id));
  replace(globalThis, "requestAnimationFrame", schedule);
  replace(globalThis, "cancelAnimationFrame", (id: number) => pending.delete(id));
  tick = () => {
    for (const [id, callback] of [...pending]) {
      if (pending.delete(id)) callback();
    }
  };
  opener = document.createElement("button");
  document.body.append(opener);
});
afterEach(() => {
  menus.forEach((menu) => menu.destroy());
  restore.reverse().forEach((fn) => fn());
  dom.window.close();
});
const make = (visible = false) => {
  const menu = createMenu({ opener, visible, items: [
    { id: "a", text: "Alpha", hasSubmenu: true, submenu: [{ id: "b", text: "Beta" }] },
    { id: "c", text: "Charlie" },
  ] });
  menus.push(menu);
  return menu;
};
const released = () => {
  for (const tracked of listeners.values()) {
    for (const handlers of tracked.values()) expect(handlers.size).toBe(0);
  }
  expect(pending.size).toBe(0);
  expect(currentlyOpenMenu()).toBeNull();
  expect(document.querySelectorAll(".mtrl-menu").length).toBe(0);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
  window.dispatchEvent(new Event("scroll"));
  tick();
  expect(pending.size).toBe(0);
};

test("destroy before initialization cancels work, including initially visible menus", () => {
  for (const visible of [false, true]) {
    const menu = make(visible);
    menu.destroy();
    released();
  }
});
test("destroy releases document listeners and cancels Tab detection and typeahead", () => {
  const menu = make();
  tick();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
  menu.element.querySelector(".mtrl-menu-item")!.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
  expect(pending.size).toBeGreaterThanOrEqual(3);
  menu.destroy();
  released();
});
test("destroy cancels every phase of opening and closing over 40 mounts", () => {
  for (let cycle = 0; cycle < 40; cycle++) {
    const menu = make();
    tick();
    menu.open();
    for (let phase = 0; phase < cycle % 4; phase++) tick();
    if (cycle % 2) menu.close();
    window.dispatchEvent(new Event("scroll"));
    menu.destroy();
    menu.destroy();
    menu.open();
    released();
  }
});
test("destroy cancels opener ArrowUp and blur work", () => {
  const menu = make();
  tick();
  opener.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  opener.dispatchEvent(new dom.window.FocusEvent("blur"));
  menu.destroy();
  released();
});
test("destroy removes opening and fading submenu elements and their handlers", () => {
  for (const close of [false, true]) {
    const menu = make();
    tick();
    menu.open();
    tick(); tick();
    const item = menu.element.querySelector(".mtrl-menu-item") as HTMLElement;
    item.focus();
    item.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.querySelector(".mtrl-menu--submenu")).not.toBeNull();
    tick();
    if (close) {
      document.querySelector(".mtrl-menu--submenu .mtrl-menu-item")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    }
    menu.destroy();
    released();
  }
});

test("destroy cancels hover intent, Tab blur, and queued focus restoration", () => {
  for (const action of ["hover", "tab-blur", "restore-focus"]) {
    const menu = make();
    tick();
    menu.open();
    tick(); tick(); tick();
    if (action === "hover") {
      menu.element.querySelector(".mtrl-menu-item")!.dispatchEvent(new MouseEvent("mouseenter"));
    } else if (action === "tab-blur") {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
      opener.dispatchEvent(new dom.window.FocusEvent("blur"));
    } else {
      menu.close();
      tick(); // Closing queues the opener's animation frame.
    }
    expect(pending.size).toBeGreaterThan(0);
    menu.destroy();
    released();
  }
});
