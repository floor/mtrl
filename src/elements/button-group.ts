// src/elements/button-group.ts
/**
 * `<m-button-group>` with `<m-button-group-item>` children.
 *
 * Each `<m-button-group-item>` declares one button (`value`, `icon`,
 * `selected-icon`, `aria-label`, `disabled`, `selected`, and its text as the
 * label). The group reads them into the factory's config and updates in place
 * when they change; the children stay where the framework put them.
 *
 * With `selection="single"` or `"multi"` the buttons toggle. `value` on the
 * group is the default selection (comma-separated in a multi group), which
 * moves the live one until the user or script changes it; without it, the
 * items' `selected` is the default. The `value` property is the live
 * selection: a string or null in a single group, an array in a multi group,
 * null without selection. Every press dispatches `action` with the button's
 * value; the factory calls it `click`, which the host already receives from
 * the browser.
 *
 * Parts: `button-group`, `button`, `text`, `ripple`.
 *
 * @module elements
 */

import createButtonGroup from "../components/button-group";
import type {
  ButtonGroupChangeEvent, ButtonGroupComponent, ButtonGroupConfig, ButtonGroupDensity, ButtonGroupEvent,
  ButtonGroupItemConfig, ButtonGroupVariant,
} from "../components/button-group/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementHost, type ElementInstance, type ElementSpec,
} from "./define";

/** The live selection: one value, several, or none. */
export type ButtonGroupValue = string | string[] | null;

type Item = ButtonGroupItemConfig & { value: string; selected: boolean };

/** Values from a property or the `value` attribute; a multi group's attribute is comma-separated. */
const parse = (value: unknown, multi: boolean): string[] => {
  if (value === null || value === undefined || value === "") return [];
  const all = Array.isArray(value)
    ? value.map(String)
    : multi
      ? String(value).split(",").map((part) => part.trim()).filter(Boolean)
      : [String(value)];
  return multi ? all : all.slice(0, 1);
};

const declaredItems = (host: HTMLElement): Item[] => {
  const itemTag = `${host.localName}-item`;
  const items: Item[] = [];
  for (const child of Array.from(host.children)) {
    if (child.localName !== itemTag) continue;
    const text = child.getAttribute("label") ?? (child.textContent ?? "").trim();
    const icon = child.getAttribute("icon") ?? undefined;
    const ariaLabel = child.getAttribute("aria-label") ?? undefined;
    const value = child.getAttribute("value") ?? (text || ariaLabel || String(items.length));
    const base = {
      value,
      icon,
      selectedIcon: child.getAttribute("selected-icon") ?? undefined,
      disabled: child.hasAttribute("disabled"),
      selected: child.hasAttribute("selected"),
    };
    // An item with an icon and no text is an icon button, which needs a
    // name: its value stands in for a missing aria-label.
    items.push(text || !icon ? { ...base, text, ariaLabel } : { ...base, ariaLabel: ariaLabel ?? value });
  }
  return items;
};

/** The items last applied to each group, which the next update compares against. */
const applied = new WeakMap<HTMLElement, Item[]>();

const readGroup = (host: HTMLElement): Config => {
  const items = declaredItems(host);
  const multi = host.getAttribute("selection") === "multi";
  // The group's `value` is the default selection; without it, the items' `selected`.
  const chosen = host.hasAttribute("value")
    ? parse(host.getAttribute("value"), multi)
    : parse(items.filter((item) => item.selected).map((item) => item.value), multi);
  applied.set(host, items);
  return { buttons: items.map((item) => ({ ...item, selected: chosen.includes(item.value) })) } satisfies ButtonGroupConfig;
};

const model = (c: ButtonGroupComponent): ButtonGroupValue => {
  const selection = c.getSelection();
  if (selection === "none") return null;
  const selected = c.getSelected();
  return selection === "multi" ? selected : (selected[0] ?? null);
};

/** Selects exactly the given values: selecting first, so a required group is never left empty on the way. */
const select = (c: ButtonGroupComponent, value: unknown): void => {
  const selection = c.getSelection();
  if (selection === "none") return;
  const wanted = parse(value, selection === "multi");
  for (const next of wanted) c.select(next);
  for (const current of c.getSelected()) if (!wanted.includes(current)) c.deselect(current);
};

/**
 * The group's `enable()` re-enables the buttons that were not disabled at
 * creation, not the ones disabled now: every button's state is applied from
 * the declared items instead.
 */
const applyDisabled = (host: HTMLElement, c: ButtonGroupComponent, items: Item[]): void => {
  const group = host.hasAttribute("disabled");
  items.forEach((item, index) => void (group || item.disabled ? c.disableButton(index) : c.enableButton(index)));
};

/**
 * Applies the declared items to the group in place: text, icon, name and
 * disabled changes. Keeps the component, its selection and focus. The group
 * has no API to add, remove or reorder buttons (their first, middle and last
 * shapes are set at creation), or to change a value or a selected icon, so
 * those return false and the element rebuilds, keeping the live selection. A
 * changed `selected` rebuilds too: the default selection is read again while
 * the group is clean.
 */
const updateGroup = (host: ElementHost<ButtonGroupComponent>, component: ButtonGroupComponent): boolean => {
  const items = declaredItems(host);
  const previous = applied.get(host) ?? [];
  if (items.length !== previous.length || items.length !== component.buttons.length) return false;
  for (const [index, item] of items.entries()) {
    const before = previous[index];
    if (item.value !== before.value || !item.text !== !before.text || item.selectedIcon !== before.selectedIcon) return false;
    if (item.selected !== before.selected && !host.hasAttribute("value")) return false;
    if (item.ariaLabel === undefined && before.ariaLabel !== undefined) return false;
  }
  for (const [index, item] of items.entries()) {
    const before = previous[index];
    const button = component.buttons[index];
    if (item.text && item.text !== before.text) button.setText(item.text);
    if (item.icon !== before.icon) button.setIcon(item.icon ?? "");
    if (item.ariaLabel !== undefined && item.ariaLabel !== before.ariaLabel) button.setAriaLabel(item.ariaLabel);
  }
  applied.set(host, items);
  applyDisabled(host, component, items);
  return true;
};

const buttonGroupSpec = {
  name: "button-group",
  create: (config) => createButtonGroup(config as ButtonGroupConfig),
  styles: ["progress", "button", "icon-button", "button-group"],
  attributes: {
    variant: { type: "string", config: "variant", update: (c, v) => void c.setVariant(String(v ?? "outlined") as ButtonGroupVariant) },
    kind: { type: "string", config: "kind" },
    selection: { type: "string", config: "selection" },
    required: { type: "boolean", config: "required" },
    size: { type: "string", config: "size" },
    shape: { type: "string", config: "shape" },
    labels: { type: "string", config: "labels" },
    orientation: {
      type: "string",
      config: "orientation",
      update: (c, v) => void c.setOrientation(v === "vertical" ? "vertical" : "horizontal"),
    },
    density: { type: "string", config: "density", update: (c, v) => void c.setDensity(String(v ?? "default") as ButtonGroupDensity) },
    "equal-width": { type: "boolean", config: "equalWidth" },
    "expanded-ratio": { type: "number", config: "expandedRatio" },
    disabled: {
      type: "boolean",
      config: "disabled",
      update: (c, v, host) => {
        if (v) c.disable();
        else c.enable();
        applyDisabled(host, c, applied.get(host) ?? []);
      },
    },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      // The factory names an unnamed group "Button group".
      update: (c, v) => c.element.setAttribute("aria-label", v === null ? "Button group" : String(v)),
    },
    value: { type: "string", update: (c, v) => select(c, v) },
  },
  properties: {
    value: { get: (c): ButtonGroupValue => model(c), set: (c, v) => select(c, v) },
  },
  model: "value" as const,
  events: {
    change: {
      detail: (payload) => ({ value: model((payload as ButtonGroupChangeEvent).buttonGroup) }),
    },
    // Dispatched by `setup` from the factory's `click`; listed here for its
    // type and the adapters. A press, beside the model: `change` carries the
    // selection.
    action: {
      detail: (payload) => payload as { value: string; index: number },
      state: true,
    },
  },
  config: readGroup,
  setup: (host, component) => {
    const onClick = (event: ButtonGroupEvent): void => {
      const value = applied.get(host)?.[event.index]?.value ?? String(event.index);
      host.dispatchEvent(new CustomEvent("action", { detail: { value, index: event.index }, bubbles: true, composed: true }));
    };
    component.on("click", onClick);
    return () => void component.off("click", onClick as (event: ButtonGroupEvent | ButtonGroupChangeEvent) => void);
  },
  observeChildren: updateGroup,
} satisfies ElementSpec<ButtonGroupComponent>;

export const buttonGroupElement = defineElement<ButtonGroupComponent>(buttonGroupSpec);
export type ButtonGroupSpec = typeof buttonGroupSpec;
/** `<m-button-group>` as a ref or a query returns it. */
export type ButtonGroupElement = ElementInstance<ButtonGroupSpec, ButtonGroupComponent>;

/**
 * `<m-button-group-item>` declares one button and renders nothing. Its text
 * content is the label unless `label` is set.
 */
export const buttonGroupItemDeclaration = {
  name: "button-group-item",
  attributes: {
    value: { type: "string" },
    label: { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. Shown on an icon-only item while it is selected. */
    "selected-icon": { type: "string" },
    "aria-label": { type: "string" },
    disabled: { type: "boolean" },
    selected: { type: "boolean" },
  },
} as const;
export type ButtonGroupItemAttributes = ElementAttributes<typeof buttonGroupItemDeclaration>;

/** Registers `<m-button-group>` and `<m-button-group-item>` (or with another prefix). */
export const defineButtonGroup = (options?: DefineOptions): string => {
  const itemTag = `${options?.prefix ?? DEFAULT_PREFIX}-${buttonGroupItemDeclaration.name}`;
  // Defined first, so items already in the page are upgraded before the
  // group reads them.
  if (!customElements.get(itemTag)) customElements.define(itemTag, createDeclarationClass(buttonGroupItemDeclaration.attributes));
  return buttonGroupElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-button-group": ButtonGroupElement;
    "m-button-group-item": HTMLElement & ButtonGroupItemAttributes;
  }
}
