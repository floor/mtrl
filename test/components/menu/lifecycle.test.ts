import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
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

// The submenu feature is a lazy chunk (FLO-310): a menu with nested items
// starts loading it at creation. Tests that interact with a submenu right
// after construction wait for that load first -- it is a dynamic import,
// which the fake timers here never run. Taken before beforeEach replaces
// setTimeout.
const realTimeout = globalThis.setTimeout;
const submenuLoaded = async (): Promise<void> => {
  await import("../../../src/components/menu/features/submenu");
  await new Promise((resolve) => realTimeout(resolve, 0));
};

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
const NESTED = [
  { id: "a", text: "Alpha", hasSubmenu: true, submenu: [{ id: "b", text: "Beta" }] },
  { id: "c", text: "Charlie" },
];
const FLAT = [
  { id: "a", text: "Alpha" },
  { id: "c", text: "Charlie" },
];
const THREE = [
  { id: "a", text: "Alpha" },
  { id: "b", text: "Beta" },
  { id: "c", text: "Charlie" },
];
const tabStopIds = (root: ParentNode): string[] =>
  Array.from(root.querySelectorAll<HTMLElement>(".mtrl-menu__item"))
    .filter((item) => item.getAttribute("tabindex") === "0")
    .map((item) => item.dataset.id ?? "");
const make = (visible = false, items = NESTED) => {
  const menu = createMenu({ opener, visible, items });
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
test("initial keyboard focus does not undo an arrow pressed before its timer", () => {
  const menu = make(false, FLAT);
  tick(); // Initialize the menu.
  menu.open(new KeyboardEvent("keydown", { key: "Enter" }));
  tick(); // Place the menu and schedule initial focus.
  const items = Array.from(menu.element.querySelectorAll<HTMLElement>(".mtrl-menu__item"));
  items[0].focus();
  items[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  expect(document.activeElement).toBe(items[1]);
  tick(); // Run the delayed initial-focus callback.
  expect(document.activeElement).toBe(items[1]);
});
test("initial focus respects an arrow inside a shadow-root menu", () => {
  const host = document.createElement("div");
  const root = host.attachShadow({ mode: "open" });
  document.body.append(host);
  root.append(opener);
  const menu = createMenu({ opener, items: FLAT });
  menus.push(menu);
  tick();
  menu.open(new KeyboardEvent("keydown", { key: "Enter" }));
  tick();
  root.append(menu.element);
  const items = Array.from(menu.element.querySelectorAll<HTMLElement>(".mtrl-menu__item"));
  items[0].focus();
  expect(menu.element.getRootNode() === root).toBe(true);
  expect(root.activeElement === items[0]).toBe(true);
  items[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  expect(root.activeElement).toBe(items[1]);
  tick();
  expect(root.activeElement).toBe(items[1]);
});
test("initial focus does not pull focus out of an opened submenu", async () => {
  const menu = make();
  await submenuLoaded();
  tick();
  menu.open(new KeyboardEvent("keydown", { key: "Enter" }));
  tick();
  const parent = menu.element.querySelector<HTMLElement>(".mtrl-menu__item")!;
  parent.focus();
  parent.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  const submenuItem = document.querySelector<HTMLElement>(".mtrl-menu--submenu .mtrl-menu__item")!;
  expect(submenuItem).not.toBeNull();
  submenuItem.focus();
  tick(); // Root initial focus and submenu opening frame.
  expect(document.activeElement).toBe(submenuItem);
});
test("ArrowUp leaves one tab stop, and Enter after a close still does", () => {
  const menu = make(false, THREE);
  tick();
  opener.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
  tick(); // Place the menu; the opener's timer focuses the last item.
  tick(); // Initial focus runs after that timer.
  const items = () => Array.from(menu.element.querySelectorAll<HTMLElement>(".mtrl-menu__item"));
  const afterArrowUp = {
    focus: document.activeElement === items()[2] ? "last" : "other",
    stops: tabStopIds(menu.element),
  };

  menu.close();
  tick(); // The close timer returns focus to the opener.
  opener.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  tick(); // Remove the closed menu and place it again.
  tick(); // Initial focus of the Enter open.
  expect({ afterArrowUp, afterEnter: { stops: tabStopIds(menu.element) } }).toEqual({
    afterArrowUp: { focus: "last", stops: ["a"] },
    afterEnter: { stops: ["a"] },
  });
});
test("a keyboard open marks the first item when focus is on the menu itself", () => {
  const menu = make(false, FLAT);
  tick();
  menu.open(new KeyboardEvent("keydown", { key: "Enter" }));
  tick(); // Place the menu and schedule initial focus.
  menu.element.focus();
  expect(document.activeElement).toBe(menu.element);
  tick();
  expect(document.activeElement).toBe(menu.element.querySelector(".mtrl-menu__item"));
});
test("destroy releases document listeners and cancels Tab detection and typeahead", () => {
  const menu = make();
  tick();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
  menu.element.querySelector(".mtrl-menu__item")!.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
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
test("destroy removes opening and fading submenu elements and their handlers", async () => {
  for (const close of [false, true]) {
    const menu = make();
    await submenuLoaded();
    tick();
    menu.open();
    tick(); tick();
    const item = menu.element.querySelector(".mtrl-menu__item") as HTMLElement;
    item.focus();
    item.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.querySelector(".mtrl-menu--submenu")).not.toBeNull();
    tick();
    if (close) {
      document.querySelector(".mtrl-menu--submenu .mtrl-menu__item")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    }
    menu.destroy();
    released();
  }
});

test("destroy cancels hover intent, Tab blur, and queued focus restoration", async () => {
  for (const action of ["hover", "tab-blur", "restore-focus"]) {
    const menu = make();
    await submenuLoaded();
    tick();
    menu.open();
    tick(); tick(); tick();
    if (action === "hover") {
      menu.element.querySelector(".mtrl-menu__item")!.dispatchEvent(new MouseEvent("mouseenter"));
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

// ---------------------------------------------------------------- the lazy submenu (FLO-310)
// Everything before an `await` here runs in one turn, so an interaction in it
// happens before the submenu feature's dynamic import can resolve.

/** Opens a menu, settled, and returns its first item (Alpha). */
const openedFirstItem = (menu: ReturnType<typeof createMenu>): HTMLElement => {
  tick();
  menu.open();
  tick(); tick(); tick();
  return menu.element.querySelector(".mtrl-menu__item") as HTMLElement;
};
const submenuElement = () => document.querySelector(".mtrl-menu--submenu");
const openSubmenuOf = (item: HTMLElement, how: "click" | "ArrowRight"): void => {
  if (how === "click") {
    item.click();
    return;
  }
  item.focus();
  item.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
};

test("a click or ArrowRight before the submenu loads is queued, then run on the item acted on", async () => {
  for (const how of ["click", "ArrowRight"] as const) {
    const menu = make();
    const item = openedFirstItem(menu);
    openSubmenuOf(item, how);
    // Still loading: nothing has opened, and nothing was dropped
    expect(submenuElement()).toBeNull();
    await submenuLoaded();
    expect(submenuElement()?.getAttribute("data-parent-item")).toBe("a");
    expect(item.getAttribute("aria-expanded")).toBe("true");
    menu.destroy();
    released();
  }
});

test("a hover before the submenu loads starts its hover intent once it has loaded", async () => {
  const menu = make();
  const item = openedFirstItem(menu);
  const idle = pending.size;
  item.dispatchEvent(new MouseEvent("mouseenter"));
  expect(pending.size).toBe(idle);
  await submenuLoaded();
  // The hover intent's timer: JSDOM has no :hover, so it opens nothing here.
  // The browser checks open a submenu by hover.
  expect(pending.size).toBe(idle + 1);
  menu.destroy();
  released();
});

test("destroy before the submenu loads drops the queued interaction: nothing runs, nothing throws", async () => {
  const errors = spyOn(console, "error");
  try {
    const menu = make();
    const item = openedFirstItem(menu);
    item.click();
    item.dispatchEvent(new MouseEvent("mouseenter"));
    menu.destroy();
    await submenuLoaded();
    expect(submenuElement()).toBeNull();
    expect(item.getAttribute("aria-expanded")).toBe("false");
    expect(errors).not.toHaveBeenCalled();
    released();
  } finally {
    errors.mockRestore();
  }
});

test("closing the menu before the submenu loads drops the queued interaction", async () => {
  const menu = make();
  const item = openedFirstItem(menu);
  item.click();
  menu.close();
  await submenuLoaded();
  expect(submenuElement()).toBeNull();
  expect(item.getAttribute("aria-expanded")).toBe("false");
  menu.destroy();
  released();
});

test("a menu with nested items loads the submenu at creation, before any interaction", async () => {
  const menu = make();
  await submenuLoaded();
  // Loaded already: the click opens the submenu in the same turn
  openSubmenuOf(openedFirstItem(menu), "click");
  expect(submenuElement()?.getAttribute("data-parent-item")).toBe("a");
  menu.destroy();
  released();
});

test("a menu without nested items never loads the submenu; setItems with nested items does", async () => {
  const menu = make(false, FLAT);
  const flatItem = openedFirstItem(menu);
  flatItem.click();
  tick(); tick(); tick();
  await submenuLoaded();

  // Had the flat menu loaded the feature, this click would open the submenu
  // in the same turn. It is queued instead: the load starts at setItems.
  menu.setItems(NESTED);
  const item = openedFirstItem(menu);
  openSubmenuOf(item, "click");
  expect(submenuElement()).toBeNull();
  await submenuLoaded();
  expect(submenuElement()?.getAttribute("data-parent-item")).toBe("a");
  menu.destroy();
  released();
});

test("setItems with nested items loads the submenu before any interaction", async () => {
  const menu = make(false, FLAT);
  tick();
  menu.setItems(NESTED);
  await submenuLoaded();
  openSubmenuOf(openedFirstItem(menu), "ArrowRight");
  expect(submenuElement()?.getAttribute("data-parent-item")).toBe("a");
  menu.destroy();
  released();
});

test("an item that setItems replaced while the submenu loaded is not opened", async () => {
  const menu = make();
  const item = openedFirstItem(menu);
  item.click();
  // Re-rendered: the element the user acted on has left the menu
  menu.setItems(NESTED);
  await submenuLoaded();
  expect(item.isConnected).toBe(false);
  expect(submenuElement()).toBeNull();
  menu.destroy();
  released();
});
