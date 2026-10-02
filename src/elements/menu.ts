// src/elements/menu.ts
/**
 * `<m-menu>` with `<m-menu-item>` children.
 *
 * Each `<m-menu-item>` declares one item: its text (or `label`), `value`,
 * `icon`, `shortcut`, `supporting-text` and `disabled`; `divider` makes it a
 * divider instead and `gap` a gap between groups (separate surfaces in the
 * vertical menu), and `<m-menu-item>` children inside it are its submenu.
 * The menu reads them into the factory's items and updates in place when they
 * change; the children stay where the framework put them.
 *
 * The menu opens against an anchor: `anchor` is the id of an element in the
 * menu's own root, then the document's, and the `anchor` property an element
 * (or an id). The anchor opens and closes the menu by pointer and key, as the
 * factory's opener does. The surface stays in the element's shadow root and
 * is shown in the top layer (the factory's `layer: "top"`), so it keeps its
 * styles and is above everything on the page.
 *
 * `open` is state, not a value, as on `<details>`: the attribute reflects
 * whether the menu is open, setting or removing it opens or closes it, and
 * the user closing the menu removes it. `show()`, `hide()` and `toggle()` do
 * the same. `open` and `close` are dispatched for every opening and closing,
 * whatever caused it, and `select` with the item's value when one is chosen.
 * There is no two-way binding: an app that keeps `open` in its state follows
 * the `close` event. `no-close-on-select` keeps the menu open when an item is
 * chosen, and `color="vibrant"` is the vertical menu's vibrant colours.
 *
 * Parts: `menu`, `list`, `item`, `item-content`, `item-text`.
 *
 * @module elements
 */

import createMenu from "../components/menu";
import type { MenuComponent, MenuConfig, MenuContent, MenuItem, MenuPosition, MenuSelectEvent } from "../components/menu/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementInstance, type ElementSpec,
} from "./define";

/** The menu, with the methods the element adds to it. */
export type MenuElementComponent = MenuComponent & {
  /** Opens the menu. */
  show: () => void;
  /** Closes the menu. */
  hide: () => void;
};

/** An anchor as a property takes it: an element, or an id. */
export type MenuAnchor = HTMLElement | string | null;

/** The item text: the `label` attribute, or the text beside nested items. */
const itemText = (child: Element, tag: string): string =>
  child.getAttribute("label") ??
  Array.from(child.childNodes)
    .filter((node) => !(node.nodeType === 1 && (node as Element).localName === tag))
    .map((node) => node.textContent ?? "")
    .join("")
    .trim();

/**
 * The items `<tag>` children declare, with their own `<tag>` children as a
 * submenu. Shared by the elements whose menu takes items (`<m-split-button>`).
 */
export const declaredMenuItems = (parent: Element, tag: string): MenuContent[] => {
  const items: MenuContent[] = [];
  for (const child of Array.from(parent.children)) {
    if (child.localName !== tag) continue;
    if (child.hasAttribute("divider")) {
      items.push({ type: "divider" });
      continue;
    }
    if (child.hasAttribute("gap")) {
      items.push({ type: "gap" });
      continue;
    }
    const text = itemText(child, tag);
    const submenu = declaredMenuItems(child, tag);
    items.push({
      id: child.getAttribute("value") ?? text,
      text,
      icon: child.getAttribute("icon") ?? undefined,
      shortcut: child.getAttribute("shortcut") ?? undefined,
      supportingText: child.getAttribute("supporting-text") ?? undefined,
      disabled: child.hasAttribute("disabled"),
      // A submenu's dividers render as dividers; the type names items only
      ...(submenu.length ? { hasSubmenu: true, submenu: submenu as MenuItem[] } : {}),
    });
  }
  return items;
};

interface MenuElementConfig extends Partial<MenuConfig> {
  host: HTMLElement;
  anchor?: MenuAnchor;
  noCloseOnSelect?: boolean;
}

/** The element each menu belongs to, and the stand-in opener used while it has no anchor. */
const hosts = new WeakMap<MenuComponent, HTMLElement>();
const standIns = new WeakMap<MenuComponent, HTMLElement>();
/** The items last applied, which an update compares against. */
const applied = new WeakMap<MenuComponent, string>();

/** An element, or an element by id in the host's root and then the document. */
const findAnchor = (host: HTMLElement, anchor: MenuAnchor | undefined): HTMLElement | null => {
  if (anchor instanceof HTMLElement) return anchor;
  if (typeof anchor !== "string" || anchor === "") return null;
  const root = host.getRootNode() as Partial<DocumentFragment>;
  return (root.getElementById?.(anchor) ?? document.getElementById(anchor)) as HTMLElement | null;
};

/** Points the menu at its anchor, or at the stand-in while there is none. */
const setAnchor = (c: MenuComponent, anchor: MenuAnchor | undefined): void => {
  const host = hosts.get(c);
  const standIn = standIns.get(c);
  if (!host || !standIn) return;
  const element = findAnchor(host, anchor) ?? standIn;
  if (c.getOpener() !== element) c.setOpener(element);
};

/** An anchor given as an id may be rendered after the menu: looked up again before opening. */
const findPending = (c: MenuComponent): void => {
  const host = hosts.get(c);
  if (host && c.getOpener() === standIns.get(c) && host.hasAttribute("anchor")) setAnchor(c, host.getAttribute("anchor"));
};

const create = (config: MenuElementConfig): MenuElementComponent => {
  const { host, anchor, noCloseOnSelect, ...rest } = config;
  // The factory needs an opener: a detached stand-in until the anchor is found
  const standIn = document.createElement("span");
  // A property kept over a recreation may be null: the attribute then decides
  const opener = findAnchor(host, anchor) ?? findAnchor(host, host.getAttribute("anchor")) ?? standIn;
  const menu = createMenu({ ...rest, items: rest.items ?? [], opener, closeOnSelect: !noCloseOnSelect, layer: "top" });
  hosts.set(menu, host);
  standIns.set(menu, standIn);
  applied.set(menu, JSON.stringify(menu.getItems()));

  // Reflected before the element dispatches the events, so a listener reads
  // the new state
  menu.on("open", () => host.toggleAttribute("open", true));
  menu.on("close", () => host.removeAttribute("open"));

  const toggle = menu.toggle.bind(menu);
  return Object.assign(menu, {
    show: (): void => {
      findPending(menu);
      menu.open();
    },
    // Focus goes back to the anchor when it was in the menu, not otherwise
    hide: (): void => void menu.close(undefined, menu.element.matches(":focus-within")),
    toggle: (event?: Event): MenuComponent => {
      findPending(menu);
      return toggle(event);
    },
  });
};

/** Applies the declared items in place, when they changed. */
const updateItems = (host: HTMLElement, c: MenuComponent): boolean => {
  const items = declaredMenuItems(host, `${host.localName}-item`);
  const key = JSON.stringify(items);
  if (applied.get(c) !== key) {
    applied.set(c, key);
    c.setItems(items);
  }
  return true;
};

const menuSpec = {
  name: "menu",
  // `config` below supplies the host
  create: (config) => create(config as unknown as MenuElementConfig),
  styles: ["menu"],
  // The host takes no room: the surface is fixed in the top layer
  hostStyles: ":host{display:contents}",
  attributes: {
    // State, reflected: see the module. Set or removed by script, the change
    // is applied after the attribute callback, so `open` is dispatched as for
    // any other opening.
    // In 1.0 it is applied inside the attribute callback and dispatches no
    // `open` and no `close`, as on <m-dialog>: read the state on the next
    // line, or call show() / hide(), which still dispatch.
    open: {
      type: "boolean",
      update: (c, v) => queueMicrotask(() => (v ? c.show() : c.hide())),
    },
    anchor: { type: "string", config: "anchor", update: (c, v) => setAnchor(c, v === null ? null : String(v)) },
    position: {
      type: "string",
      config: "position",
      update: (c, v) => void c.setPosition((v ?? "bottom-start") as MenuPosition),
    },
    offset: { type: "number", config: "offset" },
    variant: { type: "string", config: "variant" },
    color: { type: "string", config: "color" },
    "no-close-on-select": { type: "boolean", config: "noCloseOnSelect" },
    dense: { type: "boolean", config: "dense" },
    "max-height": { type: "string", config: "maxHeight", update: (c, v) => void (c.element.style.maxHeight = v === null ? "" : String(v)) },
    // Names the surface; set again in setup, the factory takes no label
    "aria-label": {
      type: "string",
      update: (c, v) => (v === null ? c.element.removeAttribute("aria-label") : c.element.setAttribute("aria-label", String(v))),
    },
  },
  properties: {
    anchor: {
      get: (c): HTMLElement | null => {
        const opener = c.getOpener();
        return opener === standIns.get(c) ? null : opener;
      },
      set: (c, v) => setAnchor(c, v as MenuAnchor),
      config: "anchor",
    },
  },
  methods: ["show", "hide", "toggle"] as const,
  events: {
    open: { detail: () => ({}), state: true },
    close: { detail: () => ({}), state: true },
    select: { detail: (payload) => ({ value: (payload as MenuSelectEvent).itemId }) },
  },
  config: (host): Config => ({ host, items: declaredMenuItems(host, `${host.localName}-item`) }),
  setup: (host, c) => {
    const root = host.shadowRoot as ShadowRoot;
    // The factory takes a closed top-layer menu out of the DOM; the element
    // keeps it in its shadow root, so it opens there again with its styles
    const keep = new MutationObserver(() => {
      if (!c.element.parentNode) root.append(c.element);
    });
    keep.observe(root, { childList: true });
    // An anchor rendered just after the menu, in the same pass
    const frame = requestAnimationFrame(() => findPending(c));
    if (host.hasAttribute("open")) c.show();
    if (host.hasAttribute("aria-label")) c.element.setAttribute("aria-label", host.getAttribute("aria-label") ?? "");
    return () => {
      keep.disconnect();
      cancelAnimationFrame(frame);
    };
  },
  observeChildren: updateItems,
} satisfies ElementSpec<MenuElementComponent>;

export const menuElement = defineElement<MenuElementComponent>(menuSpec);
export type MenuSpec = typeof menuSpec;
/** `<m-menu>` as a ref or a query returns it. */
export type MenuElement = ElementInstance<MenuSpec, MenuElementComponent>;

/**
 * `<m-menu-item>` declares one item and renders nothing. Its text is the
 * label unless `label` is set; `<m-menu-item>` children are its submenu.
 * Shared with `<m-split-button>`.
 */
export const menuItemDeclaration = {
  name: "menu-item",
  attributes: {
    value: { type: "string" },
    label: { type: "string" },
    icon: { type: "string" },
    shortcut: { type: "string" },
    "supporting-text": { type: "string" },
    disabled: { type: "boolean" },
    divider: { type: "boolean" },
    gap: { type: "boolean" },
  },
} as const;
export type MenuItemAttributes = ElementAttributes<typeof menuItemDeclaration>;

/** Registers `<m-menu-item>`, before the elements that read it. */
export const defineMenuItem = (options?: DefineOptions): void => {
  const itemTag = `${options?.prefix ?? DEFAULT_PREFIX}-${menuItemDeclaration.name}`;
  if (!customElements.get(itemTag)) customElements.define(itemTag, createDeclarationClass(menuItemDeclaration.attributes));
};

/** Registers `<m-menu>` and `<m-menu-item>` (or with another prefix). */
export const defineMenu = (options?: DefineOptions): string => {
  // Defined first, so items already in the page are upgraded before the menu
  // reads them.
  defineMenuItem(options);
  return menuElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-menu": MenuElement;
    "m-menu-item": HTMLElement & MenuItemAttributes;
  }
}
