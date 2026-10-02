// src/elements/drawer.ts
/**
 * `<m-drawer>` with `<m-drawer-item>` children: the standard (in-page)
 * navigation drawer.
 *
 * Each `<m-drawer-item>` declares one destination (`value`, `icon`, `badge`,
 * `disabled`, and its text as the label), or with `type="section"` a section
 * headline (its text) and with `type="divider"` a divider. The drawer reads
 * them into the factory's config and updates in place when they change; the
 * children stay where the framework put them. `value` on the drawer is the
 * default destination, which moves the live one until the user or script
 * changes it; the `value` property is the live one.
 *
 * `open` shows the drawer, as on the factory: without it the drawer is
 * collapsed to no width and inert. `modal` makes it the modal drawer in the
 * factory's top layer (`layer: "top"`): a native `<dialog>` in the element's
 * shadow root, shown with `showModal()`, above every z-index, the page
 * outside inert, the scrim its `::backdrop`. Escape and a click on the
 * backdrop close it, and `open` then reflects its state;
 * `no-close-on-scrim-click` and `no-close-on-escape` keep it open instead. `open` and `close`
 * are dispatched as it opens and closes (not when the attribute is what
 * changed).
 *
 * Parts: `drawer`, `sheet`, `items`, `item`, `active-indicator`, `item-icon`, `item-label`,
 * `ripple`.
 *
 * @module elements
 */

import createDrawer from "../components/drawer";
import type { DrawerComponent, DrawerConfig, DrawerItemConfig } from "../components/drawer/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementHost, type ElementInstance, type ElementSpec,
} from "./define";

/** The declared items, `active` as given. A destination without a label is left out until it has one. */
const declaredItems = (host: HTMLElement, active: string | null): DrawerItemConfig[] => {
  const itemTag = `${host.localName}-item`;
  const items: DrawerItemConfig[] = [];
  for (const child of Array.from(host.children)) {
    if (child.localName !== itemTag) continue;
    const type = child.getAttribute("type");
    const label = child.getAttribute("label") ?? (child.textContent ?? "").trim();
    if (type === "divider") {
      items.push({ type: "divider" });
      continue;
    }
    if (type === "section") {
      items.push({ type: "section", label });
      continue;
    }
    if (!label) continue;
    const id = child.getAttribute("value") ?? label;
    items.push({
      id,
      label,
      icon: child.getAttribute("icon") ?? undefined,
      badge: child.getAttribute("badge") ?? undefined,
      disabled: child.hasAttribute("disabled"),
      active: id === active,
    });
  }
  return items;
};

const readDrawer = (host: HTMLElement): Config =>
  ({ items: declaredItems(host, host.getAttribute("value")) }) satisfies DrawerConfig;

const withoutActive = (items: DrawerItemConfig[]): string =>
  JSON.stringify(items.map(({ active: _active, ...item }) => item));

/**
 * Applies the declared items in place, keeping the selection: the factory
 * renders its items again. A clean drawer takes its `value` attribute again,
 * whose item may only now have a label. A focused item keeps focus when it is
 * still there.
 */
const updateDrawer = (host: ElementHost<DrawerComponent>, component: DrawerComponent): boolean => {
  const items = declaredItems(host, host.dirty ? component.getActive() : host.getAttribute("value"));
  if (withoutActive(items) === withoutActive(component.getItems())) return true;
  // The factory renders new buttons without restoring focus.
  const focused = (host.shadowRoot?.activeElement as HTMLElement | null)?.dataset.id;
  component.setItems(items);
  if (focused !== undefined) {
    const item = Array.from(component.element.querySelectorAll<HTMLElement>("[data-id]")).find(
      (element) => element.dataset.id === focused && !element.hasAttribute("disabled")
    );
    item?.focus();
  }
  return true;
};

/** Selects an item; null clears the selection, which the factory does for an empty id. */
const select = (component: DrawerComponent, value: unknown): void =>
  void component.setActive(value === null || value === undefined ? "" : String(value));

/**
 * The standard drawer, or with `modal` the modal one in the top layer; a bare
 * number `width` is pixels, as a number is for the factory.
 */
const create = ({ modal, ...config }: DrawerConfig & { modal?: boolean }): DrawerComponent => {
  const width = typeof config.width === "string" && /^\d+(\.\d+)?$/.test(config.width) ? Number(config.width) : config.width;
  return createDrawer({ ...config, width, ...(modal ? { variant: "modal", layer: "top" } : { variant: "standard" }) });
};

const drawerSpec = {
  name: "drawer",
  create: (config) => create(config as DrawerConfig),
  styles: ["drawer"],
  hostStyles: ":host{display:block;flex-shrink:0}",
  attributes: {
    value: { type: "string", update: (c, v) => select(c, v) },
    open: { type: "boolean", config: "open", update: (c, v) => void (v ? c.open() : c.close()) },
    modal: { type: "boolean", config: "modal" },
    headline: { type: "string", config: "headline", update: (c, v) => void c.setHeadline(v === null ? "" : String(v)) },
    position: { type: "string", config: "position" },
    width: { type: "string", config: "width" },
    dense: { type: "boolean", config: "dense" },
    // Read as the user asks to close (see `setup`): nothing to update
    "no-close-on-scrim-click": { type: "boolean", update: () => undefined },
    "no-close-on-escape": { type: "boolean", update: () => undefined },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      // The factory reads ariaLabel at creation only: write the landmark's name.
      update: (c, v) => c.element.setAttribute("aria-label", v === null ? c.getHeadline() || "Navigation" : String(v)),
    },
  },
  properties: {
    value: { get: (c) => c.getActive(), set: (c, v) => select(c, v) },
  },
  model: "value" as const,
  events: {
    // The factory emits `select` on a click or a keyboard activation, and
    // setActive() is silent: `setup` forwards it as `change`. Listed here for
    // its type and the adapters.
    change: {
      detail: (payload) => ({ value: (payload as { value: string }).value }),
    },
    // State beside the model: opening leaves the drawer clean.
    open: { detail: () => null, state: true },
    close: { detail: () => null, state: true },
  },
  config: readDrawer,
  setup: (host, component) => {
    const onSelect = ({ id }: { id: string }): void => {
      host.dispatchEvent(new CustomEvent("change", { detail: { value: id }, bubbles: true, composed: true }));
    };
    // A modal drawer closes itself (Escape, the backdrop): `open` reflects it.
    const reflect = (): void => {
      if (host.hasAttribute("modal")) host.toggleAttribute("open", component.isOpen());
    };
    // The factory's `dismissible` turns off the scrim and Escape together:
    // each is refused here on its own, before the factory's listener closes.
    const root = component.element;
    const onClick = (event: MouseEvent): void => {
      if (event.target === root && host.hasAttribute("no-close-on-scrim-click")) event.stopImmediatePropagation();
    };
    const onCancel = (event: Event): void => {
      if (!host.hasAttribute("no-close-on-escape")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    root.addEventListener("click", onClick, true);
    root.addEventListener("cancel", onCancel, true);
    component.on("select", onSelect);
    component.on("open", reflect);
    component.on("close", reflect);
    return () => {
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("cancel", onCancel, true);
      component.off("select", onSelect);
      component.off("open", reflect);
      component.off("close", reflect);
    };
  },
  observeChildren: updateDrawer,
} satisfies ElementSpec<DrawerComponent>;

export const drawerElement = defineElement<DrawerComponent>(drawerSpec);
export type DrawerSpec = typeof drawerSpec;
/** `<m-drawer>` as a ref or a query returns it. */
export type DrawerElement = ElementInstance<DrawerSpec, DrawerComponent>;

/**
 * `<m-drawer-item>` declares one destination, section headline or divider,
 * and renders nothing. Its text content is the label unless `label` is set.
 */
export const drawerItemDeclaration = {
  name: "drawer-item",
  attributes: {
    type: { type: "string" },
    value: { type: "string" },
    label: { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string" },
    badge: { type: "string" },
    disabled: { type: "boolean" },
  },
} as const;
export type DrawerItemAttributes = ElementAttributes<typeof drawerItemDeclaration>;

/** Registers `<m-drawer>` and `<m-drawer-item>` (or with another prefix). */
export const defineDrawer = (options?: DefineOptions): string => {
  const itemTag = `${options?.prefix ?? DEFAULT_PREFIX}-${drawerItemDeclaration.name}`;
  // Defined first, so items already in the page are upgraded before the
  // drawer reads them.
  if (!customElements.get(itemTag)) customElements.define(itemTag, createDeclarationClass(drawerItemDeclaration.attributes));
  return drawerElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-drawer": DrawerElement;
    "m-drawer-item": HTMLElement & DrawerItemAttributes;
  }
}
