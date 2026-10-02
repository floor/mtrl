// src/elements/chips.ts
/**
 * `<m-chips>` with `<m-chip>` children: the chip set.
 *
 * Each `<m-chip>` declares one chip (`variant`, `value`, `icon`,
 * `trailing-icon`, `avatar`, `remove-label`, `selected`, `disabled`,
 * `elevated`, and its text as the label). The set reads them into the
 * factory's config and updates in place when they change; the children stay
 * where the framework put them.
 *
 * Filter and input chips select. `value` on the set is the default selection
 * (comma-separated in a multi-select set), which moves the live one until the
 * user or script changes it; without it, the chips' `selected` is the default.
 * The `value` property is the live selection: an array in a multi-select set
 * (the default, as the factory's), a string or null with `selection="single"`.
 * Removing an input chip dispatches `remove`; the set drops the chip, and the
 * app removes its `<m-chip>`, which is not shown again meanwhile.
 *
 * Parts: `chips`, `container`, `chip`, `action`, `leading-icon`, `checkmark`, `label`,
 * `trailing-icon`, `ripple`.
 *
 * @module elements
 */

import createChips from "../components/chips/chips";
import type { ChipComponent, ChipConfig, ChipType, ChipsChangeEvent, ChipsRemoveEvent, ChipsComponent, ChipsConfig } from "../components/chips/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementHost, type ElementInstance, type ElementSpec,
} from "./define";

/** The live selection: several values, or one or none in a single-select set. */
export type ChipsValue = string | string[] | null;

type Chip = ChipConfig & { value: string; label: string; type: ChipType; selected: boolean };

const TYPES: readonly ChipType[] = ["assist", "filter", "input", "suggestion"];

const isMulti = (host: HTMLElement): boolean => host.getAttribute("selection") !== "single";

/** Values from a property or the `value` attribute; a multi-select set's attribute is comma-separated. */
const parse = (value: unknown, multi: boolean): string[] => {
  if (value === null || value === undefined || value === "") return [];
  const all = Array.isArray(value)
    ? value.map(String)
    : multi
      ? String(value).split(",").map((part) => part.trim()).filter(Boolean)
      : [String(value)];
  return multi ? all : all.slice(0, 1);
};

/** Values of input chips the user removed, per set, while their `<m-chip>` is still there. */
const removed = new WeakMap<HTMLElement, Set<string>>();

const declaredChips = (host: HTMLElement): Chip[] => {
  const chipTag = host.localName.replace(/chips$/, "chip");
  const gone = removed.get(host);
  const chips: Chip[] = [];
  for (const child of Array.from(host.children)) {
    if (child.localName !== chipTag) continue;
    const label = child.getAttribute("label") ?? (child.textContent ?? "").trim();
    const value = child.getAttribute("value") ?? label;
    if (gone?.has(value)) continue;
    const variant = child.getAttribute("variant") as ChipType | null;
    chips.push({
      label,
      value,
      type: variant && TYPES.includes(variant) ? variant : "filter",
      leadingIcon: child.getAttribute("icon") ?? undefined,
      trailingIcon: child.getAttribute("trailing-icon") ?? undefined,
      avatar: child.getAttribute("avatar") ?? undefined,
      removeLabel: child.getAttribute("remove-label") ?? undefined,
      selected: child.hasAttribute("selected"),
      disabled: child.hasAttribute("disabled"),
      elevated: child.hasAttribute("elevated"),
    });
  }
  return chips;
};

/** The chips last applied to each set, which the next update compares against. */
const applied = new WeakMap<HTMLElement, Chip[]>();

/** The set's `value`, or without it the chips' `selected`: the selection a clean set shows. */
const defaultSelection = (host: HTMLElement, chips: Chip[]): string[] =>
  host.hasAttribute("value")
    ? parse(host.getAttribute("value"), isMulti(host))
    : parse(chips.filter((chip) => chip.selected).map((chip) => chip.value).slice(isMulti(host) ? 0 : -1), isMulti(host));

const readChips = (host: HTMLElement): Config => {
  const chips = declaredChips(host);
  const chosen = defaultSelection(host, chips);
  applied.set(host, chips);
  return {
    chips: chips.map((chip) => ({ ...chip, selected: chosen.includes(chip.value) })),
    multiSelect: isMulti(host),
  } satisfies ChipsConfig;
};

/**
 * Selects exactly the given values, chip by chip. The set's own `setValue`
 * clears the selection first, which replays every selected chip's motion.
 */
const select = (c: ChipsComponent, value: unknown, multi: boolean): void => {
  const wanted = parse(value, multi);
  for (const chip of c.getChips()) {
    const selected = wanted.includes(chip.getValue() ?? "");
    if (chip.isSelected() !== selected) chip.setSelected(selected);
  }
};

const isMultiSet = (c: ChipsComponent): boolean => c.element.getAttribute("aria-multiselectable") !== "false";

/**
 * Names the one-action cells. The factory hides such a cell's button, which
 * holds the label, from the accessibility tree and removes the cell's
 * aria-label, so the cell has no accessible name (the input chips' buttons
 * keep theirs). The cell takes its label here until the factory names it.
 */
const nameCells = (c: ChipsComponent): void => {
  for (const chip of c.getChips()) {
    if (chip.element.hasAttribute("tabindex")) chip.element.setAttribute("aria-label", chip.getLabel());
  }
};

const create = (config: ChipsConfig): ChipsComponent => {
  const chips = createChips(config);
  nameCells(chips);
  return chips;
};

/** The factory's chips, by value: `getChips()` is a copy, in order. */
const byValue = (component: ChipsComponent): Map<string, ChipComponent> =>
  new Map(component.getChips().map((chip) => [chip.getValue() ?? "", chip]));

/**
 * Applies the declared chips to the set in place: label, icon, trailing icon
 * and disabled changes, removals, and chips added at the end. Keeps the
 * component, its selection and focus. Returns false for what the set's API
 * cannot do in place (a reorder, an insertion before existing chips, a
 * repeated value, a changed variant, avatar, elevation or remove label), and
 * for a changed `selected`, whose default a clean set reads again: the
 * element rebuilds instead.
 */
const updateChips = (host: ElementHost<ChipsComponent>, component: ChipsComponent): boolean => {
  // A removed chip's value stays hidden only while its <m-chip> is there.
  const gone = removed.get(host);
  if (gone) {
    const chipTag = host.localName.replace(/chips$/, "chip");
    const present = new Set(
      Array.from(host.children)
        .filter((child) => child.localName === chipTag)
        .map((child) => child.getAttribute("value") ?? child.getAttribute("label") ?? (child.textContent ?? "").trim())
    );
    for (const value of gone) if (!present.has(value)) gone.delete(value);
  }
  const declared = declaredChips(host);
  const values = declared.map((chip) => chip.value);
  if (new Set(values).size !== values.length) return false;
  const previous = new Map((applied.get(host) ?? []).map((chip) => [chip.value, chip]));
  const chips = byValue(component);
  const current = component.getChips().map((chip) => chip.getValue() ?? "");
  const existing = new Set(current);
  const kept = current.filter((value) => values.includes(value));
  const firstNew = values.findIndex((value) => !existing.has(value));
  const declaredKept = (firstNew === -1 ? values : values.slice(0, firstNew)).filter((value) => existing.has(value));
  // Everything already there must come first, in the same order.
  if (kept.join("\u0000") !== declaredKept.join("\u0000")) return false;
  if (firstNew !== -1 && values.slice(firstNew).some((value) => existing.has(value))) return false;
  const bySelected = !host.hasAttribute("value");
  for (const chip of declared) {
    const before = previous.get(chip.value);
    if (!before) {
      if (chip.selected && bySelected) return false;
      continue;
    }
    if (chip.type !== before.type || chip.avatar !== before.avatar || chip.elevated !== before.elevated) return false;
    if (chip.removeLabel !== before.removeLabel || (chip.selected !== before.selected && bySelected)) return false;
  }

  for (const [value, chip] of chips) if (!values.includes(value)) component.removeChip(chip);
  const added = firstNew === -1 ? [] : declared.slice(firstNew);
  for (const chip of added) component.addChip({ ...chip, selected: false });
  for (const chip of declared) {
    const before = previous.get(chip.value);
    const instance = byValue(component).get(chip.value);
    if (!before || !instance) continue;
    if (instance.getLabel() !== chip.label) instance.setLabel(chip.label);
    if (chip.leadingIcon !== before.leadingIcon) instance.setIcon(chip.leadingIcon ?? "");
    if (chip.trailingIcon !== before.trailingIcon) instance.setTrailingIcon(chip.trailingIcon ?? "");
    if (chip.disabled !== instance.isDisabled()) {
      if (chip.disabled) instance.disable();
      else instance.enable();
    }
  }
  nameCells(component);
  applied.set(host, declared);
  return true;
};

const chipsSpec = {
  name: "chips",
  create: (config) => create(config as ChipsConfig),
  styles: ["chips"],
  hostStyles: ":host{display:block}",
  attributes: {
    // "single" or "multi" (the default): the factory's `multiSelect`, read by `config`.
    selection: { type: "string" },
    "selection-required": { type: "boolean", config: "selectionRequired" },
    scrollable: { type: "boolean", config: "scrollable", update: (c, v) => void c.setScrollable(!!v) },
    vertical: { type: "boolean", config: "vertical", update: (c, v) => void c.setVertical(!!v) },
    label: { type: "string", config: "label", update: (c, v) => void c.setLabel(v === null ? "" : String(v)) },
    "label-position": {
      type: "string",
      config: "labelPosition",
      update: (c, v) => void c.setLabelPosition(v === "end" ? "end" : "start"),
    },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      update: (c, v) => (v === null ? c.element.removeAttribute("aria-label") : c.element.setAttribute("aria-label", String(v))),
    },
    value: { type: "string", update: (c, v) => select(c, v, isMultiSet(c)) },
  },
  properties: {
    value: { get: (c): ChipsValue => c.getValue(), set: (c, v) => select(c, v, isMultiSet(c)) },
  },
  model: "value" as const,
  events: {
    change: {
      // The set's change carries the `value` property's shape (FLO-320).
      detail: (payload) => ({ value: (payload as ChipsChangeEvent).value }),
    },
    // Removal changes the set model, so it marks the element dirty without a
    // second `change` notification.
    remove: {
      detail: (payload) => {
        const { chipValue, value } = payload as ChipsRemoveEvent;
        return { chipValue, value };
      },
    },
  },
  config: readChips,
  setup: (host, component) => {
    // The user removed an input chip; declarations removing chips are quiet.
    const onRemove = ({ chipValue }: ChipsRemoveEvent): void => {
      const set = removed.get(host) ?? new Set<string>();
      set.add(chipValue ?? "");
      removed.set(host, set);
    };
    component.on("remove", onRemove);
    return () => void component.off("remove", onRemove);
  },
  observeChildren: updateChips,
} satisfies ElementSpec<ChipsComponent>;

export const chipsElement = defineElement<ChipsComponent>(chipsSpec);
export type ChipsSpec = typeof chipsSpec;
/** `<m-chips>` as a ref or a query returns it. */
export type ChipsElement = ElementInstance<ChipsSpec, ChipsComponent>;

/**
 * `<m-chip>` declares one chip and renders nothing. Its text content is the
 * label unless `label` is set.
 */
export const chipDeclaration = {
  name: "chip",
  attributes: {
    value: { type: "string" },
    label: { type: "string" },
    variant: { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    "trailing-icon": { type: "string" },
    /** Markup (HTML), not a person's name or an image URL. Not sanitized by default: see Markup and sanitizing. Input chips only; takes precedence over `icon`. */
    avatar: { type: "string" },
    "remove-label": { type: "string" },
    selected: { type: "boolean" },
    disabled: { type: "boolean" },
    elevated: { type: "boolean" },
  },
} as const;
export type ChipAttributes = ElementAttributes<typeof chipDeclaration>;

/** Registers `<m-chips>` and `<m-chip>` (or with another prefix). */
export const defineChips = (options?: DefineOptions): string => {
  const chipTag = `${options?.prefix ?? DEFAULT_PREFIX}-${chipDeclaration.name}`;
  // Defined first, so chips already in the page are upgraded before the set
  // reads them.
  if (!customElements.get(chipTag)) customElements.define(chipTag, createDeclarationClass(chipDeclaration.attributes));
  return chipsElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-chips": ChipsElement;
    "m-chip": HTMLElement & ChipAttributes;
  }
}
