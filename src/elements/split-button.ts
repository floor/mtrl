// src/elements/split-button.ts
/**
 * `<m-split-button>` with `<m-menu-item>` children.
 *
 * The element's text (or `label`) is the leading button's label, and each
 * `<m-menu-item>` child declares one item of the menu the trailing button
 * opens, as in `<m-menu>`. The items are the factory's own menu items, so the
 * menu item declaration is shared rather than a split-button one. The menu
 * opens in the top layer (the factory's `layer: "top"`), inside the element's
 * shadow root.
 *
 * `click` is the native one, for the leading action only: a click on the
 * trailing button or in the menu stops at the shadow root. Choosing an item
 * dispatches `select` with its value.
 *
 * The factory creates its menu only when it has items: going from no items
 * to some, or back, recreates it. `variant`, `size`, `trailing-label` and
 * `group-label` have no setter and recreate it too.
 *
 * Parts: `split-button`, `button`, `leading`, `trailing`, `text`, `icon`, `chevron`, `ripple`.
 *
 * @module elements
 */

import createSplitButton from "../components/split-button";
import type { SplitButtonComponent, SplitButtonConfig, SplitButtonEvent } from "../components/split-button/types";
import type { MenuContent } from "../components/menu/types";
import { innerMenu } from "../components/menu/inner";
import { defineElement, type Config, type DefineOptions, type ElementInstance, type ElementSpec } from "./define";
import { declaredMenuItems, defineMenuItem } from "./menu";

const itemTag = (host: HTMLElement): string => host.localName.replace(/split-button$/, "menu-item");

/** The label: the `label` attribute, or the text beside the items. */
const labelOf = (host: HTMLElement): string =>
  host.getAttribute("label") ??
  Array.from(host.childNodes)
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent ?? "")
    .join("")
    .trim();

/** The items last applied to each button, which an update compares against. */
const applied = new WeakMap<SplitButtonComponent, string>();

const create = (config: SplitButtonConfig): SplitButtonComponent => {
  const button = createSplitButton({ ...config, layer: "top" });
  applied.set(button, JSON.stringify(config.items ?? []));
  return button;
};

const readSplitButton = (host: HTMLElement): Config => {
  const items = declaredMenuItems(host, itemTag(host));
  return { text: labelOf(host), ...(items.length ? { items } : {}) } satisfies SplitButtonConfig;
};

/**
 * Applies the label and the items in place. Returns false when the menu has
 * to come or go, which only a new split button does.
 */
const updateSplitButton = (host: HTMLElement, c: SplitButtonComponent): boolean => {
  const items: MenuContent[] = declaredMenuItems(host, itemTag(host));
  const menu = innerMenu(c);
  if (!items.length !== !menu) return false;
  const label = labelOf(host);
  if (c.getText() !== label) c.setText(label);
  const key = JSON.stringify(items);
  if (menu && applied.get(c) !== key) {
    applied.set(c, key);
    c.setItems(items);
  }
  return true;
};

const splitButtonSpec = {
  name: "split-button",
  // Nested submenus start asynchronous imports during construction.
  ssr: (host) => {
    const item = host.localName.replace(/split-button$/, "menu-item");
    return !host.querySelector(`${item} ${item}`);
  },
  create: (config) => create(config as SplitButtonConfig),
  styles: ["progress", "button", "menu", "split-button"],
  hostStyles: ":host{vertical-align:middle}",
  attributes: {
    // Read with the text by `config`: the attribute wins over the text.
    label: { type: "string", update: (c, _v, host) => void c.setText(labelOf(host)) },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string", config: "icon", update: (c, v) => void c.setIcon(v === null ? "" : String(v)) },
    variant: { type: "string", config: "variant" },
    size: { type: "string", config: "size" },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => void (v ? c.disable() : c.enable()) },
    "trailing-label": { type: "string", config: "trailingLabel" },
    "group-label": { type: "string", config: "groupLabel" },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      update: (c, v) =>
        v === null ? c.leadingElement.removeAttribute("aria-label") : c.leadingElement.setAttribute("aria-label", String(v)),
    },
  },
  events: {
    select: {
      detail: (payload) => {
        const item = (payload as SplitButtonEvent).item;
        return { value: item && "id" in item ? (item.id ?? null) : null };
      },
    },
  },
  config: readSplitButton,
  setup: (_host, c) => {
    // The native click is the leading action's: one from the trailing button
    // or the menu does not leave the shadow root.
    const contain = (event: MouseEvent): void => {
      if (!c.leadingElement.contains(event.target as Node)) event.stopPropagation();
    };
    c.element.addEventListener("click", contain);
    return () => c.element.removeEventListener("click", contain);
  },
  observeChildren: updateSplitButton,
} satisfies ElementSpec<SplitButtonComponent>;

export const splitButtonElement = defineElement<SplitButtonComponent>(splitButtonSpec);
export type SplitButtonSpec = typeof splitButtonSpec;
/** `<m-split-button>` as a ref or a query returns it. */
export type SplitButtonElement = ElementInstance<SplitButtonSpec, SplitButtonComponent>;

/** Registers `<m-split-button>` and `<m-menu-item>` (or with another prefix). */
export const defineSplitButton = (options?: DefineOptions): string => {
  // Defined first, so items already in the page are upgraded before the
  // button reads them.
  defineMenuItem(options);
  return splitButtonElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-split-button": SplitButtonElement;
  }
}
