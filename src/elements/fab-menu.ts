// src/elements/fab-menu.ts
/**
 * `<m-fab-menu>` with `<m-fab-menu-item>` children.
 *
 * Each `<m-fab-menu-item>` declares one action: its text (or `label`),
 * `value` and `icon`. The FAB takes `icon` and `aria-label`, which names the
 * menu it opens. `color`, `size`, `presentation` and `placement` are the
 * factory's options: the expressive list below 600px, the baseline menu from
 * 600px, unless `presentation` says otherwise.
 *
 * `open` is state, as on `<m-menu>`: the attribute reflects whether the menu
 * is open, and setting or removing it opens or closes it. `show()`, `hide()`
 * and `toggle()` do the same. `open` and `close` are dispatched for every
 * opening and closing, and `select` with the item's value when one is chosen.
 *
 * Parts: `fab-menu`, `fab`, `list`, `item`.
 *
 * @module elements
 */

import createFabMenu from "../components/fab-menu";
import type { FabMenuComponent, FabMenuConfig, FabMenuItem } from "../components/fab-menu/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementInstance, type ElementSpec,
} from "./define";

/** The FAB menu, with the methods the element adds to it. */
export type FabMenuElementComponent = FabMenuComponent & {
  /** Opens the menu. */
  show: () => void;
  /** Closes the menu. */
  hide: () => void;
};

/** The actions `<tag>` children declare. */
const declaredItems = (host: Element, tag: string): FabMenuItem[] =>
  Array.from(host.children)
    .filter((child) => child.localName === tag)
    .map((child) => {
      const text = child.getAttribute("label") ?? (child.textContent ?? "").trim();
      return { id: child.getAttribute("value") ?? text, text, icon: child.getAttribute("icon") ?? undefined };
    });

/** The items each FAB menu was built with, which a change of the declarations compares against. */
const built = new WeakMap<FabMenuComponent, string>();

const create = (config: FabMenuConfig & { host: HTMLElement }): FabMenuElementComponent => {
  const { host, ...rest } = config;
  const menu = createFabMenu(rest);
  built.set(menu, JSON.stringify(rest.items));
  // Reflected before the element dispatches the events, so a listener reads the new state
  menu.on("open", () => host.toggleAttribute("open", true));
  menu.on("close", () => host.removeAttribute("open"));
  return Object.assign(menu, {
    show: (): void => void menu.open(),
    hide: (): void => void menu.close(),
  });
};

const fabMenuSpec = {
  name: "fab-menu",
  // `config` below supplies the host and the items
  create: (config) => create(config as unknown as FabMenuConfig & { host: HTMLElement }),
  // The menu presentation's menu renders in this shadow root, next to the FAB
  styles: ["fab", "menu", "fab-menu"],
  attributes: {
    // In 1.0 `open` set or removed by script is applied inside the attribute
    // callback and dispatches no `open` and no `close`, as on <m-dialog>
    // (today a microtask later, dispatching both); show() and hide() still
    // dispatch.
    open: {
      type: "boolean",
      update: (c, v) => queueMicrotask(() => (v ? c.show() : c.hide())),
    },
    icon: { type: "string", config: "icon" },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      update: (c, v) => c.fab.setAttribute("aria-label", v === null ? "" : String(v)),
    },
    color: { type: "string", config: "color" },
    size: { type: "string", config: "size" },
    presentation: { type: "string", config: "presentation" },
    placement: { type: "string", config: "placement" },
  },
  methods: ["show", "hide", "toggle"] as const,
  events: {
    open: { detail: () => ({}), state: true },
    close: { detail: () => ({}), state: true },
    select: { detail: (payload) => ({ value: (payload as { value: string }).value }) },
  },
  config: (host): Config => ({ host, items: declaredItems(host, `${host.localName}-item`) }),
  setup: (host, c) => {
    if (host.hasAttribute("open")) c.show();
  },
  // The items are the factory's: a change of the declarations rebuilds it.
  // Anything else the observer sees -- the host's own `open` reflecting the
  // state -- leaves it alone.
  observeChildren: (host, c) => built.get(c) === JSON.stringify(declaredItems(host, `${host.localName}-item`)),
} satisfies ElementSpec<FabMenuElementComponent>;

export const fabMenuElement = defineElement<FabMenuElementComponent>(fabMenuSpec);
export type FabMenuSpec = typeof fabMenuSpec;
/** `<m-fab-menu>` as a ref or a query returns it. */
export type FabMenuElement = ElementInstance<FabMenuSpec, FabMenuElementComponent>;

/** `<m-fab-menu-item>` declares one action and renders nothing. Its text is the label unless `label` is set. */
export const fabMenuItemDeclaration = {
  name: "fab-menu-item",
  attributes: {
    value: { type: "string" },
    label: { type: "string" },
    icon: { type: "string" },
  },
} as const;
export type FabMenuItemAttributes = ElementAttributes<typeof fabMenuItemDeclaration>;

/** Registers `<m-fab-menu>` and `<m-fab-menu-item>` (or with another prefix). */
export const defineFabMenu = (options?: DefineOptions): string => {
  // Defined first, so items already in the page are upgraded before the menu reads them.
  const itemTag = `${options?.prefix ?? DEFAULT_PREFIX}-${fabMenuItemDeclaration.name}`;
  if (!customElements.get(itemTag)) customElements.define(itemTag, createDeclarationClass(fabMenuItemDeclaration.attributes));
  return fabMenuElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-fab-menu": FabMenuElement;
    "m-fab-menu-item": HTMLElement & FabMenuItemAttributes;
  }
}
