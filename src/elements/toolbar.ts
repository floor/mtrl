// src/elements/toolbar.ts
/**
 * `<m-toolbar>`: M3 Expressive's docked and floating toolbars as a container
 * with slots.
 *
 * Children are the items (`<m-icon-button>`, `<m-button>`, a text field),
 * inside the element with the `toolbar` role: one tab stop, walked with the
 * arrow keys, Home and End. Each item's host takes the tab stop and delegates
 * focus to its control. `slot="fab"` takes a FAB, beside the toolbar and
 * outside its tab stop. `slot="overflow"` takes an `<m-menu>`: the toolbar
 * adds a "more" button and makes it the menu's anchor.
 *
 * `variant`, `orientation`, `placement`, `arrangement`, `fab-position` and
 * `scroll-behavior` are the factory's options; `color` and `flat` (no
 * elevation) change in place. `show()` and `hide()` move the toolbar on and
 * off screen, and `show` and `hide` are dispatched when it does.
 *
 * Parts: `toolbar`, `bar`, `fab`, `overflow`.
 *
 * @module elements
 */

import createToolbar from "../components/toolbar";
import type { ToolbarComponent, ToolbarConfig } from "../components/toolbar/types";
import { defineElement, type Config, type DefineOptions, type ElementInstance, type ElementSpec } from "./define";

const slotted = (host: HTMLElement, name: string): boolean =>
  Array.from(host.children).some((child) => child.getAttribute("slot") === name);

const namedSlot = (name: string): HTMLSlotElement => {
  const slot = document.createElement("slot");
  slot.name = name;
  return slot;
};

/**
 * The factory with slots where its items, FAB and overflow menu go: the
 * default slot is the only item, and the toolbar walks what is assigned to it.
 */
const create = (config: ToolbarConfig & { hasFab?: boolean; hasOverflow?: boolean }): ToolbarComponent => {
  const { hasFab, hasOverflow, ...rest } = config;
  const toolbar = createToolbar({
    ...rest,
    items: [document.createElement("slot")],
    fab: hasFab ? namedSlot("fab") : undefined,
    overflow: hasOverflow ? () => null : undefined,
  });
  // The menu itself is shown in the top layer; its slot only has to exist.
  if (hasOverflow) toolbar.element.append(namedSlot("overflow"));
  return toolbar;
};

const readToolbar = (host: HTMLElement): Config => ({
  hasFab: slotted(host, "fab"),
  hasOverflow: slotted(host, "overflow"),
  elevated: !host.hasAttribute("flat"),
});

/** Points each menu in the overflow slot at the overflow button. */
const anchorMenus = (component: ToolbarComponent): void => {
  const slot = component.element.querySelector<HTMLSlotElement>('slot[name="overflow"]');
  for (const menu of slot?.assignedElements() ?? []) {
    (menu as HTMLElement & { anchor?: unknown }).anchor = component.overflowButton;
  }
};

const toolbarSpec = {
  name: "toolbar",
  slots: ["fab", "overflow"] as const,
  create: (config) => create(config as ToolbarConfig),
  // The overflow button is an icon button in the toolbar's own shadow root.
  styles: ["icon-button", "toolbar"],
  // A floating toolbar is as wide as its pill and FAB, as before upgrade.
  hostStyles: ":host{display:block}:host([variant=floating]){width:fit-content}",
  attributes: {
    variant: { type: "string", config: "variant" },
    color: { type: "string", config: "color", update: (c, v) => c.setColor(v === null ? "standard" : String(v)) },
    orientation: { type: "string", config: "orientation" },
    placement: { type: "string", config: "placement" },
    arrangement: { type: "string", config: "arrangement" },
    flat: {
      type: "boolean",
      update: (c, v) =>
        void c.element.classList.toggle(
          `${c.getClass("toolbar")}--elevated`,
          !v && c.element.classList.contains(`${c.getClass("toolbar")}--floating`)
        ),
    },
    "fab-position": { type: "string", config: "fabPosition" },
    "scroll-behavior": { type: "string", config: "scrollBehavior" },
    "scroll-threshold": { type: "number", config: "scrollThreshold" },
    "overflow-label": { type: "string", config: "overflowLabel" },
    "aria-label": {
      type: "string",
      update: (c, v) => c.bar.setAttribute("aria-label", v === null ? "Toolbar" : String(v)),
    },
  },
  methods: ["show", "hide"] as const,
  events: {
    show: { detail: () => null, state: true },
    hide: { detail: () => null, state: true },
  },
  config: readToolbar,
  // A FAB or an overflow menu arriving or leaving changes what the factory built.
  observeChildren: (host, component) =>
    slotted(host, "fab") === !!component.element.querySelector('slot[name="fab"]') &&
    slotted(host, "overflow") === !!component.overflowButton,
  setup: (host, component) => {
    const label = host.getAttribute("aria-label");
    if (label !== null) component.bar.setAttribute("aria-label", label);
    const overflow = component.element.querySelector<HTMLSlotElement>('slot[name="overflow"]');
    const onOverflow = (): void => anchorMenus(component);
    overflow?.addEventListener("slotchange", onOverflow);
    anchorMenus(component);
    component.sync();
    return () => overflow?.removeEventListener("slotchange", onOverflow);
  },
  ssr: (host) => {
    let first = true;
    for (const child of Array.from(host.children)) {
      if (child.getAttribute("slot") === "fab") continue;
      if (child.hasAttribute("disabled") && child.getAttribute("disabled") !== "false") continue;
      if (child.localName === "slot") continue;
      child.setAttribute("tabindex", first ? "0" : "-1");
      first = false;
    }
    return true;
  },
} satisfies ElementSpec<ToolbarComponent>;

export const toolbarElement = defineElement<ToolbarComponent>(toolbarSpec);
export type ToolbarSpec = typeof toolbarSpec;
/** `<m-toolbar>` as a ref or a query returns it. */
export type ToolbarElement = ElementInstance<ToolbarSpec, ToolbarComponent>;

/** Registers `<m-toolbar>` (or `<prefix-toolbar>`). */
export const defineToolbar = (options?: DefineOptions): string => toolbarElement.define(options);

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-toolbar": ToolbarElement;
  }
}
