// src/elements/list.ts
/**
 * `<m-list>` with `<m-list-item>` children.
 *
 * Each `<m-list-item>` declares one row: its text (or `headline`) is the
 * headline, with `overline`, `supporting-text`, a leading icon, avatar or
 * image, a trailing icon or text, `value`, `disabled` and `selected`. An item
 * with `kind="divider"` or `kind="subheader"` declares the list's structure
 * instead. The list reads them into the factory's config and updates in place
 * when they change; the children stay where the framework put them.
 *
 * `selection` is the factory's mode: `single` (the default), `multiple`, or
 * `none` (rows are not interactive). `value` on `<m-list>` and the items'
 * `selected` are the default selection, which moves the live one until the
 * user or script changes it; the `value` property is the live selection (the
 * first selected value, as on a native `<select multiple>`) and `values` all
 * of it. A click or Enter on a row dispatches `activate` with its value, then
 * `change` when the selection moved.
 *
 * Parts: `list`, `content`, `item`, `action`, `text`, `headline`, `supporting`.
 *
 * @module elements
 */

import createList from "../components/list";
import type { ListComponent, ListConfig, ListItem, ListSlot, SelectEvent } from "../components/list/types";
import { safeUrl } from "../core/utils/url";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementHost, type ElementInstance, type ElementSpec,
} from "./define";

/** Config keys the element adds to the factory's. */
interface ListElementConfig extends Partial<ListConfig<ListItem>> {
  selection?: string;
  /** The `value` attribute, or the live `value` kept over a recreation. */
  selectedValue?: string;
  /** The live `values` kept over a recreation: replaces every other default. */
  selectedValues?: string[];
}

type SelectionMode = "none" | "single" | "multiple";

/** Values the declared items select by default (their `selected` attribute). */
const defaultSelected = new WeakMap<ListComponent<ListItem>, string>();
/** The component does not report its mode: the element keeps it. */
const modes = new WeakMap<ListComponent<ListItem>, SelectionMode>();

const itemSlot = (child: Element, position: "leading" | "trailing"): ListSlot | undefined => {
  const icon = child.getAttribute(`${position}-icon`);
  if (icon !== null) return { type: "icon", content: icon };
  if (position === "trailing") {
    const text = child.getAttribute("trailing-text");
    return text === null ? undefined : { type: "text", content: text };
  }
  const avatar = child.getAttribute("leading-avatar");
  if (avatar !== null) return { type: "avatar", content: avatar };
  const src = child.getAttribute("leading-image");
  if (src === null) return undefined;
  const image = document.createElement("img");
  image.src = safeUrl(src);
  image.alt = "";
  return { type: "image", content: image };
};

const declaredItems = (host: HTMLElement): ListItem[] => {
  const itemTag = `${host.localName}-item`;
  const disabled = host.hasAttribute("disabled");
  const items: ListItem[] = [];
  const values = new Set<string>();
  for (const child of Array.from(host.children)) {
    if (child.localName !== itemTag) continue;
    const headline = child.getAttribute("headline") ?? (child.textContent ?? "").trim();
    const kind = child.getAttribute("kind");
    if (kind === "divider" || kind === "subheader") {
      items.push({ kind, headline, inset: child.hasAttribute("inset") });
      continue;
    }
    const value = child.getAttribute("value") ?? headline;
    // The factory throws on a repeated id: the first item with a value wins.
    if (values.has(value)) {
      console.warn(`<${host.localName}>: more than one item has the value "${value}"; keeping the first.`);
      continue;
    }
    values.add(value);
    items.push({
      id: value,
      headline,
      overline: child.getAttribute("overline") ?? undefined,
      supportingText: child.getAttribute("supporting-text") ?? undefined,
      leading: itemSlot(child, "leading"),
      trailing: itemSlot(child, "trailing"),
      // The list has no disabled state of its own: a disabled list disables every row.
      disabled: disabled || child.hasAttribute("disabled"),
      selected: child.hasAttribute("selected"),
    });
  }
  return items;
};

const selectedKey = (items: ListItem[]): string =>
  items.filter((item) => item.selected).map((item) => String(item.id)).join("\u0000");

const readList = (host: HTMLElement): Config => ({ items: declaredItems(host) }) satisfies ListElementConfig;

const create = (config: ListElementConfig): ListComponent<ListItem> => {
  const { selection, selectedValue, selectedValues, ...rest } = config;
  const items = rest.items ?? [];
  const mode: SelectionMode = selection === "none" || selection === "multiple" ? selection : "single";
  let initial: string[];
  if (selectedValues) initial = selectedValues;
  else {
    initial = items.filter((item) => item.selected).map((item) => String(item.id));
    if (selectedValue !== undefined) initial = mode === "multiple" ? [...initial, selectedValue] : [selectedValue];
  }
  // Items carry `selected` for the defaults only: the factory would seed its
  // selection from them over the element's.
  const component = createList({
    ...rest,
    items: items.map((item) => ({ ...item, selected: undefined })),
    trackSelection: mode !== "none",
    multiSelect: mode === "multiple",
    initialSelection: mode === "multiple" ? initial : initial.slice(0, 1),
  });
  defaultSelected.set(component, selectedKey(items));
  modes.set(component, mode);
  return component;
};

/** The selected values, in row order. */
const selectedValues = (component: ListComponent<ListItem>): string[] =>
  component.getSelectedItems().map((item) => String(item.id));

/** Selects exactly these values; a single-selection list keeps the first. */
const select = (component: ListComponent<ListItem>, values: string[]): void => {
  component.setSelection(modes.get(component) === "multiple" ? values : values.slice(0, 1));
};

const toValues = (value: unknown): string[] =>
  value === null || value === undefined || value === "" ? [] : Array.isArray(value) ? value.map(String) : [String(value)];

/**
 * Applies the declared items in place. The rendered list is static: the
 * factory renders the array `getAllItems()` returns, and `refresh()` renders
 * it again, keeping the focused row and pruning the selection of removed
 * values. Returns false when an item's `selected` changes, a default the
 * element recreates the list to read (a dirty selection is kept over it).
 */
const updateList = (host: HTMLElement, component: ListComponent<ListItem>): boolean => {
  const declared = declaredItems(host);
  if (selectedKey(declared) !== defaultSelected.get(component)) return false;
  const items = component.getAllItems();
  items.splice(0, items.length, ...declared.map((item) => ({ ...item, selected: undefined })));
  void component.refresh();
  return true;
};

const detail = (component: ListComponent<ListItem>): { value: string | null; values: string[] } => {
  const values = selectedValues(component);
  return { value: values[0] ?? null, values };
};

/**
 * The factory emits `select` before it toggles the row, and nothing after: a
 * listener that reads the list then (a controlled framework binding) sees the
 * old selection. The element dispatches `activate` for the row and then
 * `change`, when the selection moved, once the click has been handled.
 */
const dispatchActivation = (host: ElementHost<ListComponent<ListItem>>, component: ListComponent<ListItem>): (() => void) => {
  let before = "";
  let activated: string | null = null;
  const onSelect = (event: SelectEvent<ListItem>): void => {
    activated = String(event.item.id);
  };
  const capture = (): void => {
    activated = null;
    before = selectedValues(component).join("\u0000");
  };
  const after = (): void => {
    const value = activated;
    activated = null;
    if (value === null) return;
    const dispatch = (type: string, detail: unknown): boolean =>
      host.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
    dispatch("activate", { value });
    if (selectedValues(component).join("\u0000") !== before) dispatch("change", detail(component));
  };
  component.on("select", onSelect);
  component.element.addEventListener("click", capture, true);
  component.element.addEventListener("click", after);
  return () => {
    component.off("select", onSelect);
    component.element.removeEventListener("click", capture, true);
    component.element.removeEventListener("click", after);
  };
};

const listSpec = {
  name: "list",
  create: (config) => create(config as ListElementConfig),
  styles: ["list"],
  hostStyles: ":host{display:block}",
  attributes: {
    selection: { type: "string", config: "selection" },
    value: { type: "string", config: "selectedValue", update: (c, v) => select(c, toValues(v)) },
    disabled: { type: "boolean", update: (c, _v, host) => void updateList(host, c) },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      update: (c, v) => (v === null ? c.element.removeAttribute("aria-label") : c.element.setAttribute("aria-label", String(v))),
    },
  },
  properties: {
    value: {
      get: (c): string | null => selectedValues(c)[0] ?? null,
      set: (c, v) => select(c, toValues(v)),
      config: "selectedValue",
    },
    values: {
      get: (c): string[] => selectedValues(c),
      set: (c, v) => select(c, toValues(v)),
      config: "selectedValues",
    },
  },
  model: "value" as const,
  // `values` has no attribute of its own: its defaults are `value` and the
  // items' `selected`, and a script that sets it makes the selection dirty.
  defaults: ["values"],
  // Dispatched by the element (see dispatchActivation): the factory emits neither.
  events: {
    // A press on a row, beside the model: `change` carries the selection.
    activate: { detail: (payload) => payload as { value: string }, state: true },
    change: { detail: (payload) => payload as { value: string | null; values: string[] } },
  },
  config: readList,
  setup: dispatchActivation,
  observeChildren: updateList,
} satisfies ElementSpec<ListComponent<ListItem>>;

export const listElement = defineElement<ListComponent<ListItem>>(listSpec);
export type ListSpec = typeof listSpec;
/** `<m-list>` as a ref or a query returns it. */
export type ListElement = ElementInstance<ListSpec, ListComponent<ListItem>>;

/**
 * `<m-list-item>` declares one row and renders nothing. Its text content is
 * the headline unless `headline` is set.
 */
export const listItemDeclaration = {
  name: "list-item",
  attributes: {
    value: { type: "string" },
    headline: { type: "string" },
    overline: { type: "string" },
    "supporting-text": { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    "leading-icon": { type: "string" },
    /** Markup (HTML), not a person's name or an image URL. Not sanitized by default: see Markup and sanitizing. */
    "leading-avatar": { type: "string" },
    "leading-image": { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    "trailing-icon": { type: "string" },
    "trailing-text": { type: "string" },
    kind: { type: "string" },
    inset: { type: "boolean" },
    disabled: { type: "boolean" },
    selected: { type: "boolean" },
  },
} as const;
export type ListItemAttributes = ElementAttributes<typeof listItemDeclaration>;

/** Registers `<m-list>` and `<m-list-item>` (or with another prefix). */
export const defineList = (options?: DefineOptions): string => {
  const itemTag = `${options?.prefix ?? DEFAULT_PREFIX}-${listItemDeclaration.name}`;
  // Defined first, so items already in the page are upgraded before the list
  // reads them.
  if (!customElements.get(itemTag)) customElements.define(itemTag, createDeclarationClass(listItemDeclaration.attributes));
  return listElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-list": ListElement;
    "m-list-item": HTMLElement & ListItemAttributes;
  }
}
