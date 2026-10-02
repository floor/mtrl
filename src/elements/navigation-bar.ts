// src/elements/navigation-bar.ts
/**
 * `<m-navigation-bar>` with `<m-navigation-bar-item>` children: the M3
 * Expressive navigation bar (FLO-305).
 *
 * Each `<m-navigation-bar-item>` declares one destination, as the rail's items
 * do: `value`, `icon`, `selected-icon`, `badge` (empty: the dot), `badge-label`,
 * `href`, `disabled`, and its text as the label. An item with `href` renders as
 * a link and keeps native navigation. `value` on the bar is the default
 * destination, which moves the live one until the user or script changes it;
 * the `value` property is the live one, and `change` carries it.
 *
 * `item-layout` is `auto` (the default: icon above the label, beside it once
 * the bar is 600px wide), `vertical` or `horizontal`. `hide-on-scroll` hides
 * the bar while the window scrolls down and shows it on the way back up;
 * `visibility` reports each change. A change to either recreates the bar.
 *
 * Parts: `navigation-bar`, `items`, `item`, `content`, `indicator`, `icon`, `label`.
 *
 * @module elements
 */

import createNavigationBar from "../components/navigation-bar";
import type { NavigationBarComponent, NavigationBarConfig, NavigationBarItemConfig } from "../components/navigation-bar/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementHost, type ElementInstance, type ElementSpec,
} from "./define";
import { declaredItems } from "./navigation-rail";

const readBar = (host: HTMLElement): Config =>
  ({
    items: declaredItems(host, host.getAttribute("value")),
    ripple: !host.hasAttribute("no-ripple"),
  }) satisfies NavigationBarConfig;

const withoutActive = (items: NavigationBarItemConfig[]): string =>
  JSON.stringify(items.map(({ active: _active, ...item }) => item));

/** Applies the declared items in place, keeping the selection, as the rail does. */
const updateBar = (host: ElementHost<NavigationBarComponent>, component: NavigationBarComponent): boolean => {
  const items = declaredItems(host, host.dirty ? component.getActive() : host.getAttribute("value"));
  if (withoutActive(items) !== withoutActive(component.getItems())) component.setItems(items);
  return true;
};

const navigationBarSpec = {
  name: "navigation-bar",
  create: (config) => createNavigationBar(config as NavigationBarConfig),
  styles: ["navigation-bar"],
  hostStyles: ":host{display:block}",
  attributes: {
    value: { type: "string", update: (c, v) => void c.setActive(v === null ? null : String(v)) },
    "item-layout": { type: "string", config: "itemLayout" },
    "hide-on-scroll": { type: "boolean", config: "hideOnScroll" },
    "no-ripple": { type: "boolean" },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      // The factory reads ariaLabel at creation only: write the landmark's name
      update: (c, v) => void c.element.setAttribute("aria-label", v === null || v === undefined ? "Primary navigation" : String(v)),
    },
  },
  properties: {
    value: {
      get: (c) => c.getActive(),
      set: (c, v) => void c.setActive(v === null || v === undefined ? null : String(v)),
    },
  },
  methods: ["hide", "show"] as const,
  model: "value" as const,
  events: {
    // The factory emits `select` on a click or a keyboard activation, and
    // setActive() is silent: `setup` forwards it as `change`.
    change: { detail: (payload) => ({ value: (payload as { value: string }).value }) },
    // State beside the model, so `value` still moves a bar that only hid
    visibility: { detail: (payload) => ({ hidden: (payload as { hidden: boolean }).hidden }), state: true },
  },
  config: (host) => readBar(host),
  setup: (host, component) => {
    const onSelect = ({ id }: { id: string }): void => {
      host.dispatchEvent(new CustomEvent("change", { detail: { value: id }, bubbles: true, composed: true }));
    };
    component.on("select", onSelect);
    return () => component.off("select", onSelect);
  },
  observeChildren: updateBar,
} satisfies ElementSpec<NavigationBarComponent>;

export const navigationBarElement = defineElement<NavigationBarComponent>(navigationBarSpec);
export type NavigationBarSpec = typeof navigationBarSpec;
/** `<m-navigation-bar>` as a ref or a query returns it. */
export type NavigationBarElement = ElementInstance<NavigationBarSpec, NavigationBarComponent>;

/**
 * `<m-navigation-bar-item>` declares one destination and renders nothing.
 * Its text content is the label unless `label` is set; `icon` is required.
 */
export const navigationBarItemDeclaration = {
  name: "navigation-bar-item",
  attributes: {
    value: { type: "string" },
    label: { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. Shown while this destination is active. */
    "selected-icon": { type: "string" },
    href: { type: "string" },
    badge: { type: "string" },
    "badge-label": { type: "string" },
    disabled: { type: "boolean" },
  },
} as const;
export type NavigationBarItemAttributes = ElementAttributes<typeof navigationBarItemDeclaration>;

/** Registers `<m-navigation-bar>` and `<m-navigation-bar-item>` (or with another prefix). */
export const defineNavigationBar = (options?: DefineOptions): string => {
  const itemTag = `${options?.prefix ?? DEFAULT_PREFIX}-${navigationBarItemDeclaration.name}`;
  // Defined first, so items already in the page are upgraded before the bar reads them
  if (!customElements.get(itemTag)) {
    customElements.define(itemTag, createDeclarationClass(navigationBarItemDeclaration.attributes));
  }
  return navigationBarElement.define(options);
};

declare global {
  interface HTMLElementTagNameMap {
    "m-navigation-bar": NavigationBarElement;
    "m-navigation-bar-item": HTMLElement & NavigationBarItemAttributes;
  }
}
