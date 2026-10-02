// test/components/fab-menu/fab-menu.test.ts
//
// The M3 Expressive FAB menu (FLO-306) in a JSDOM document: the FAB as a menu
// button, the list as a menu of menuitems, the focus rules of the site
// (focus stays on the close button, the keys go into the list, Escape and Tab
// out come back), selection, outside presses, the stagger and its absence
// under reduced motion, and the menu presentation with an injected menu.
import { describe, test, expect, afterEach, mock } from "bun:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", { url: "http://localhost/", pretendToBeVisual: true });
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.HTMLElement = dom.window.HTMLElement;
g.Element = dom.window.Element;
g.Node = dom.window.Node;
g.Event = dom.window.Event;
g.MouseEvent = dom.window.MouseEvent;
g.PointerEvent = dom.window.MouseEvent;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.FocusEvent = dom.window.FocusEvent;
g.CustomEvent = dom.window.CustomEvent;
g.MutationObserver = dom.window.MutationObserver;
g.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = () => {};

import createFabMenu from "../../../src/components/fab-menu";
import type { FabMenuComponent, FabMenuConfig, FabMenuMenu } from "../../../src/components/fab-menu";
import { staggerDelays } from "../../../src/components/fab-menu/stagger";

const ICON = '<svg viewBox="0 0 24 24"></svg>';
const ITEMS = [
  { id: "reply", text: "Reply", icon: ICON },
  { id: "forward", text: "Forward" },
  { id: "archive", text: "Archive" },
];

let menu: FabMenuComponent | null = null;
const make = (config: Partial<FabMenuConfig> = {}) => {
  menu = createFabMenu({ icon: ICON, ariaLabel: "Compose", items: ITEMS, presentation: "list", ...config });
  document.body.appendChild(menu.element);
  return menu;
};
const items = (m: FabMenuComponent) => Array.from(m.list.querySelectorAll<HTMLElement>("[role=menuitem]"));
const press = (key: string, options: KeyboardEventInit = {}) => {
  const event = new dom.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options });
  document.activeElement!.dispatchEvent(event);
  return event;
};
const has = (m: FabMenuComponent, modifier: string) => m.element.classList.contains(`mtrl-fab-menu--${modifier}`);
const setMedia = (matches: (query: string) => boolean) => {
  g.window.matchMedia = (query: string) => ({ matches: matches(query), media: query });
};

afterEach(() => {
  menu?.destroy();
  menu = null;
  document.body.replaceChildren();
  delete g.window.matchMedia;
});

describe("fab menu structure", () => {
  test("the FAB is a menu button named after the menu, controlling the list", () => {
    const m = make();
    expect(m.fab.getAttribute("aria-label")).toBe("Compose");
    expect(m.fab.getAttribute("aria-haspopup")).toBe("menu");
    expect(m.fab.getAttribute("aria-expanded")).toBe("false");
    expect(m.fab.getAttribute("aria-controls")).toBe(m.list.id);
    expect(m.list.getAttribute("role")).toBe("menu");
    expect(m.list.getAttribute("aria-labelledby")).toBe(m.fab.id);
  });

  test("the items are menuitems, out of the tab order, with their labels", () => {
    const m = make();
    expect(items(m).map((el) => el.textContent)).toEqual(["Reply", "Forward", "Archive"]);
    expect(items(m).every((el) => el.tabIndex === -1)).toBe(true);
    expect(items(m)[0].querySelector(".mtrl-fab-menu__item-icon")).not.toBeNull();
    expect(items(m)[1].querySelector(".mtrl-fab-menu__item-icon")).toBeNull();
  });

  test("the FAB comes before the list, which is inert while closed", () => {
    const m = make();
    expect(m.element.firstElementChild).toBe(m.fab);
    expect(m.fab.nextElementSibling).toBe(m.list);
    expect(m.list.hasAttribute("inert")).toBe(true);
  });

  test("the FAB is the colour set's container; the close icon is in it", () => {
    const m = make({ color: "tertiary", size: "medium" });
    expect(m.fab.classList.contains("mtrl-fab--tertiary-container")).toBe(true);
    expect(m.fab.classList.contains("mtrl-fab--medium")).toBe(true);
    expect(has(m, "tertiary")).toBe(true);
    expect(has(m, "medium")).toBe(true);
    expect(m.fab.querySelector(".mtrl-fab-menu__close svg")).not.toBeNull();
  });

  test("unknown options fall back to the defaults", () => {
    const m = make({ color: "neon", size: "small", presentation: "wobbly", placement: "middle" });
    expect(has(m, "primary")).toBe(true);
    expect(has(m, "default")).toBe(true);
    expect(m.element.className).not.toContain("middle");
  });

  test("placement", () => {
    expect(has(make({ placement: "bottom-end" }), "bottom-end")).toBe(true);
  });

  test("fewer than 2 or more than 6 items warn in development, and still work", () => {
    const warn = mock(() => {});
    const original = console.warn;
    console.warn = warn;
    try {
      make({ items: [ITEMS[0]] });
      expect(warn).toHaveBeenCalledTimes(1);
      menu!.destroy();
      make({ items: Array.from({ length: 7 }, (_, i) => ({ id: `${i}`, text: `${i}` })) });
      expect(warn).toHaveBeenCalledTimes(2);
      expect(items(menu!)).toHaveLength(7);
      menu!.destroy();
      make();
      expect(warn).toHaveBeenCalledTimes(2);
    } finally {
      console.warn = original;
    }
  });
});

describe("fab menu list: opening and focus", () => {
  test("a click opens it; focus stays on the FAB, now the close button", () => {
    const m = make();
    const seen: string[] = [];
    m.on("open", () => seen.push("open"));
    m.fab.focus();
    m.fab.click();
    expect(m.isOpen()).toBe(true);
    expect(has(m, "open")).toBe(true);
    expect(m.fab.getAttribute("aria-expanded")).toBe("true");
    expect(m.list.hasAttribute("inert")).toBe(false);
    expect(document.activeElement).toBe(m.fab);
    expect(seen).toEqual(["open"]);
  });

  test("ArrowDown and Tab go to the top item, ArrowUp to the one nearest the FAB", () => {
    const m = make();
    m.fab.focus();
    m.open();
    press("ArrowDown");
    expect(document.activeElement?.textContent).toBe("Reply");
    m.fab.focus();
    expect(press("Tab").defaultPrevented).toBe(true);
    expect(document.activeElement?.textContent).toBe("Reply");
    m.fab.focus();
    press("ArrowUp");
    expect(document.activeElement?.textContent).toBe("Archive");
  });

  test("closed, the FAB's keys are its own", () => {
    const m = make();
    m.fab.focus();
    expect(press("ArrowDown").defaultPrevented).toBe(false);
    expect(press("Tab").defaultPrevented).toBe(false);
  });

  test("in the list, the arrows wrap and Home and End go to the ends", () => {
    const m = make();
    m.open();
    items(m)[0].focus();
    press("ArrowUp");
    expect(document.activeElement?.textContent).toBe("Archive");
    press("ArrowDown");
    expect(document.activeElement?.textContent).toBe("Reply");
    press("End");
    expect(document.activeElement?.textContent).toBe("Archive");
    press("Home");
    expect(document.activeElement?.textContent).toBe("Reply");
  });

  test("Escape closes it and returns focus to the FAB", () => {
    const m = make();
    m.open();
    items(m)[1].focus();
    press("Escape");
    expect(m.isOpen()).toBe(false);
    expect(document.activeElement).toBe(m.fab);
    expect(m.list.hasAttribute("inert")).toBe(true);
    expect(m.fab.getAttribute("aria-expanded")).toBe("false");
  });

  test("Escape on the close button closes it too", () => {
    const m = make();
    m.fab.focus();
    m.open();
    press("Escape");
    expect(m.isOpen()).toBe(false);
    expect(document.activeElement).toBe(m.fab);
  });

  test("Tab out of the list, either way, closes it on the FAB", () => {
    const m = make();
    m.open();
    items(m)[2].focus();
    expect(press("Tab").defaultPrevented).toBe(true);
    expect(m.isOpen()).toBe(false);
    expect(document.activeElement).toBe(m.fab);
    m.open();
    items(m)[0].focus();
    press("Tab", { shiftKey: true });
    expect(m.isOpen()).toBe(false);
    expect(document.activeElement).toBe(m.fab);
  });

  test("choosing an item selects it, closes, and returns focus to the FAB", () => {
    const m = make();
    const chosen: { id: string; value: string }[] = [];
    const seen: string[] = [];
    // `value` repeats the id, as <m-fab-menu>'s select does (FLO-320)
    m.on("select", (event) => chosen.push(event));
    m.on("close", () => seen.push("close"));
    m.open();
    items(m)[1].focus();
    items(m)[1].click();
    expect(chosen).toEqual([{ id: "forward", value: "forward" }]);
    expect(seen).toEqual(["close"]);
    expect(document.activeElement).toBe(m.fab);
  });

  test("a press outside closes it and leaves focus where it went", () => {
    const m = make();
    const outside = document.createElement("button");
    document.body.appendChild(outside);
    m.open();
    m.list.dispatchEvent(new dom.window.MouseEvent("pointerdown", { bubbles: true, composed: true }));
    expect(m.isOpen()).toBe(true);
    outside.focus();
    outside.dispatchEvent(new dom.window.MouseEvent("pointerdown", { bubbles: true, composed: true }));
    expect(m.isOpen()).toBe(false);
    expect(document.activeElement).toBe(outside);
  });

  test("a click on the close button closes it", () => {
    const m = make();
    m.fab.click();
    m.fab.click();
    expect(m.isOpen()).toBe(false);
  });

  test("toggle, open and close chain, and fire each change once", () => {
    const m = make();
    const seen: string[] = [];
    m.on("open", () => seen.push("open"));
    m.on("close", () => seen.push("close"));
    expect(m.toggle()).toBe(m);
    m.open().open();
    m.close().close();
    expect(seen).toEqual(["open", "close"]);
  });
});

describe("fab menu stagger", () => {
  const delays = (m: FabMenuComponent) => items(m).map((el) => el.style.getPropertyValue("--mtrl-fab-menu-delay"));

  test("opening: nearest the FAB first, from the SlowEffects spring", () => {
    const m = make();
    m.open();
    expect(delays(m)).toEqual(staggerDelays(3, true).map((ms) => `${ms}ms`));
    expect(delays(m)).toEqual(["81ms", "81ms", "42ms"]);
  });

  test("closing: the top item first; the list hides after the last one has left", () => {
    const m = make();
    m.open();
    m.close();
    expect(delays(m)).toEqual(["0ms", "42ms", "81ms"]);
    expect(m.list.style.getPropertyValue("--mtrl-fab-menu-exit")).toBe(`${81 + 425}ms`);
  });

  test("opening measures each item's width to reveal, from its content (FLO-348)", () => {
    const m = make();
    const widths = [120, 161, 135];
    items(m).forEach((item, index) => {
      const content = item.querySelector(".mtrl-fab-menu__item-content") as HTMLElement;
      expect(content.parentElement).toBe(item);
      expect(content.querySelector(".mtrl-fab-menu__item-text")).not.toBeNull();
      Object.defineProperty(content, "offsetWidth", { value: widths[index], configurable: true });
    });
    m.open();
    expect(items(m).map((el) => el.style.getPropertyValue("--mtrl-fab-menu-item-width"))).toEqual(["120px", "161px", "135px"]);
  });

  test("under reduced motion there is no stagger", () => {
    setMedia((query) => query.includes("prefers-reduced-motion"));
    const m = make();
    m.open();
    expect(delays(m)).toEqual(["0ms", "0ms", "0ms"]);
  });

  test("the spring: 6 items open from 26ms to 114ms, the top two together", () => {
    expect(staggerDelays(6, true)).toEqual([114, 114, 81, 59, 42, 26]);
    expect(staggerDelays(6, false)).toEqual([0, 26, 42, 59, 81, 114]);
    expect(staggerDelays(2, true)).toEqual([59, 59]);
  });
});

describe("fab menu presentation", () => {
  const fakeMenu = () => {
    const handlers: Record<string, Array<(event: { itemId?: string }) => void>> = {};
    let open = false;
    const element = document.createElement("div");
    element.id = "app-menu";
    const created: FabMenuMenu & { calls: string[]; emit: (name: string, event?: { itemId?: string }) => void } = {
      element,
      calls: [],
      open: (_event, interaction) => { open = true; created.calls.push(`open:${interaction}`); },
      close: () => { open = false; created.calls.push("close"); created.emit("close"); },
      isOpen: () => open,
      on: (name, handler) => { (handlers[name] ??= []).push(handler); },
      destroy: () => created.calls.push("destroy"),
      emit: (name, event = {}) => (handlers[name] ?? []).forEach((handler) => handler(event)),
    };
    return created;
  };

  test("auto: the list below 600px, the menu from 600px", () => {
    setMedia(() => false);
    expect(make({ presentation: "auto" }).getPresentation()).toBe("list");
    menu!.destroy();
    setMedia((query) => query.includes("min-width: 600px"));
    const m = make({ presentation: "auto", menu: () => fakeMenu() });
    expect(m.getPresentation()).toBe("menu");
    expect(has(m, "menu")).toBe(true);
  });

  test("auto follows a resize, but not while open", () => {
    let wide = false;
    setMedia((query) => wide && query.includes("min-width"));
    const m = make({ presentation: "auto", menu: () => fakeMenu() });
    m.open();
    wide = true;
    window.dispatchEvent(new dom.window.Event("resize"));
    expect(m.getPresentation()).toBe("list");
    m.close();
    expect(m.getPresentation()).toBe("menu");
    wide = false;
    window.dispatchEvent(new dom.window.Event("resize"));
    expect(m.getPresentation()).toBe("list");
  });

  test("the menu presentation opens the app's menu from the FAB, 'keyboard' for a key's click", async () => {
    const app = fakeMenu();
    let opener: HTMLElement | null = null;
    const m = make({ presentation: "menu", menu: (button) => { opener = button; return app; } });
    expect(opener).toBe(m.fab);
    expect(m.fab.getAttribute("aria-controls")).toBe("app-menu");
    m.fab.click();
    await Promise.resolve();
    expect(app.calls).toEqual(["open:keyboard"]);
    expect(m.isOpen()).toBe(true);
    expect(m.fab.getAttribute("aria-expanded")).toBe("true");
    expect(has(m, "open")).toBe(false);
  });

  test("the menu's select and close reach the FAB menu", async () => {
    const app = fakeMenu();
    const chosen: { id: string; value: string }[] = [];
    const m = make({ presentation: "menu", menu: () => app });
    m.on("select", (event) => chosen.push(event));
    m.open();
    await Promise.resolve();
    app.emit("select", { itemId: "reply" });
    app.close();
    expect(chosen).toEqual([{ id: "reply", value: "reply" }]);
    expect(m.isOpen()).toBe(false);
    expect(m.fab.getAttribute("aria-expanded")).toBe("false");
  });

  test("close() closes the menu; destroy() destroys it", async () => {
    const app = fakeMenu();
    const m = make({ presentation: "menu", menu: () => app });
    m.open();
    await Promise.resolve();
    m.close();
    expect(app.calls).toContain("close");
    m.destroy();
    menu = null;
    expect(app.calls).toContain("destroy");
  });

  test("without a menu of its own, the baseline menu is loaded and opens top-end", async () => {
    const m = make({ presentation: "menu" });
    m.open(new dom.window.MouseEvent("click", { detail: 1 }));
    // The chunk's first import can take a while in a busy run: wait up to 2s
    // for its surface. The state is there at once (FLO-548).
    expect(m.isOpen()).toBe(true);
    for (let i = 0; i < 200 && !document.querySelector(".mtrl-menu"); i++) await new Promise((r) => setTimeout(r, 10));
    expect(m.isOpen()).toBe(true);
    const surface = document.querySelector(".mtrl-menu") as HTMLElement;
    expect(surface).not.toBeNull();
    expect(surface.querySelectorAll(".mtrl-menu__item")).toHaveLength(3);
  });

  // FLO-548: when open() returns, isOpen() is true and `open` has been emitted,
  // in the menu presentation as in the list. The menu is a lazy module, so its
  // surface may be painted after open() returns. A close() before it arrives
  // means nothing is painted.
  const recorded = (m: FabMenuComponent): string[] => {
    const seen: string[] = [];
    m.on("open", () => seen.push("open"));
    m.on("close", () => seen.push("close"));
    return seen;
  };

  test("menu presentation: isOpen(), aria-expanded and the open event are there when open() returns; the surface follows", async () => {
    const app = fakeMenu();
    const m = make({ presentation: "menu", menu: () => app });
    const seen = recorded(m);
    expect(m.open()).toBe(m);
    expect(m.isOpen()).toBe(true);
    expect(m.fab.getAttribute("aria-expanded")).toBe("true");
    expect(seen).toEqual(["open"]);
    await Promise.resolve();
    expect(app.calls).toEqual(["open:keyboard"]);
    expect(seen).toEqual(["open"]);
  });

  test("menu presentation: repeat calls do nothing and emit nothing", async () => {
    const app = fakeMenu();
    const m = make({ presentation: "menu", menu: () => app });
    const seen = recorded(m);
    m.close();
    m.open();
    m.open();
    await Promise.resolve();
    m.open();
    expect(seen).toEqual(["open"]);
    expect(app.calls).toEqual(["open:keyboard"]);
    m.close();
    m.close();
    expect(seen).toEqual(["open", "close"]);
  });

  test("menu presentation: close() before the surface arrives ends closed, and nothing is shown", async () => {
    const app = fakeMenu();
    const m = make({ presentation: "menu", menu: () => app });
    const seen = recorded(m);
    m.open();
    m.close();
    expect(m.isOpen()).toBe(false);
    expect(m.fab.getAttribute("aria-expanded")).toBe("false");
    expect(seen).toEqual(["open", "close"]);
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 20));
    expect(app.calls).toEqual([]);
    expect(m.isOpen()).toBe(false);
    expect(seen).toEqual(["open", "close"]);
  });

  test("menu presentation: open(), close(), open() before the surface arrives ends open, shown once", async () => {
    const app = fakeMenu();
    const m = make({ presentation: "menu", menu: () => app });
    const seen = recorded(m);
    m.open();
    m.close();
    m.open();
    expect(m.isOpen()).toBe(true);
    expect(seen).toEqual(["open", "close", "open"]);
    await new Promise((r) => setTimeout(r, 20));
    expect(app.calls).toEqual(["open:keyboard"]);
    expect(m.isOpen()).toBe(true);
  });

  test("menu presentation: opened again before the surface arrives, it opens as the last call asked", async () => {
    const app = fakeMenu();
    const m = make({ presentation: "menu", menu: () => app });
    // A key's click, then a close, then a pointer's click
    m.open(new dom.window.MouseEvent("click", { detail: 0 }));
    m.close();
    m.open(new dom.window.MouseEvent("click", { detail: 1 }));
    await new Promise((r) => setTimeout(r, 20));
    expect(app.calls).toEqual(["open:mouse"]);
  });

  test("menu presentation: a second click on the FAB before the surface arrives closes it", async () => {
    const app = fakeMenu();
    const m = make({ presentation: "menu", menu: () => app });
    const seen = recorded(m);
    m.fab.click();
    m.fab.click();
    expect(m.isOpen()).toBe(false);
    await new Promise((r) => setTimeout(r, 20));
    expect(app.calls).toEqual([]);
    expect(seen).toEqual(["open", "close"]);
  });

  test("menu presentation: destroy() before the surface arrives shows nothing", async () => {
    const app = fakeMenu();
    const m = make({ presentation: "menu", menu: () => app });
    m.open();
    m.destroy();
    menu = null;
    await new Promise((r) => setTimeout(r, 20));
    expect(app.calls.filter((call) => call.startsWith("open"))).toEqual([]);
  });

  test("the baseline menu, loaded on demand: open at once, the surface when the module has arrived, close() in the call", async () => {
    const m = make({ presentation: "menu" });
    const seen = recorded(m);
    m.open(new dom.window.MouseEvent("click", { detail: 1 }));
    expect(m.isOpen()).toBe(true);
    expect(seen).toEqual(["open"]);
    for (let i = 0; i < 200 && !document.querySelector(".mtrl-menu"); i++) await new Promise((r) => setTimeout(r, 10));
    expect(document.querySelector(".mtrl-menu")).not.toBeNull();
    expect(m.isOpen()).toBe(true);
    expect(seen).toEqual(["open"]);
    m.close();
    expect(m.isOpen()).toBe(false);
    expect(seen).toEqual(["open", "close"]);
  });
});

describe("fab menu cleanup", () => {
  test("destroy removes the element and the outside-press and resize listeners", () => {
    setMedia(() => false);
    const m = make({ presentation: "auto" });
    m.open();
    const element = m.element;
    m.destroy();
    menu = null;
    expect(element.isConnected).toBe(false);
    document.body.dispatchEvent(new dom.window.MouseEvent("pointerdown", { bubbles: true }));
    expect(m.isOpen()).toBe(true);
  });

  test("the chain returns the FAB menu", () => {
    const m = make();
    expect(m.addClass("extra")).toBe(m);
  });
});
