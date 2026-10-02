// src/elements/radios.ts
/**
 * `<m-radios>` with `<m-radio>` children: the radio group as a form-associated
 * custom element.
 *
 * Each `<m-radio>` declares one option (`value`, `disabled`, and its text as
 * the label). The group reads them into the factory's config and updates in
 * place when they change; the children stay where the framework put them.
 * `value` on `<m-radios>` is the default selection, which moves the live one
 * until the user or script changes it and which a form reset returns to; the
 * `value` property is the live one.
 *
 * Parts: `radios`, `item`, `input`, `label`, `control`, `circle`, `text`, `ripple`.
 *
 * @module elements
 */

import createRadios from "../components/radios";
import type { RadioOptionConfig, RadiosComponent, RadiosConfig } from "../components/radios/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementHost, type ElementInstance, type ElementSpec,
} from "./define";

const declaredRadios = (host: HTMLElement): RadioOptionConfig[] => {
  const radioTag = host.localName.replace(/radios$/, "radio");
  const radios: RadioOptionConfig[] = [];
  for (const child of Array.from(host.children)) {
    if (child.localName !== radioTag) continue;
    const label = child.getAttribute("label") ?? (child.textContent ?? "").trim();
    radios.push({
      label,
      value: child.getAttribute("value") ?? label,
      disabled: child.hasAttribute("disabled"),
    });
  }
  return radios;
};

const readRadios = (host: HTMLElement): Config => ({ options: declaredRadios(host) }) satisfies Partial<RadiosConfig>;

/**
 * Selects a value; null, undefined or an empty string clears the selection,
 * through the factory's `setValue(null)`.
 */
const select = (component: RadiosComponent, value: unknown): void => {
  if (value === null || value === undefined || value === "") {
    component.setValue(null);
  } else {
    component.setValue(String(value));
  }
};

/**
 * `required` is not a factory option: the element sets it on every input, and
 * the browser applies it to the group as it does to native radios.
 */
const applyRequired = (component: RadiosComponent, required: boolean): void => {
  for (const radio of component.radios) radio.input.required = required;
};

const isDisabled = (component: RadiosComponent): boolean =>
  component.element.classList.contains(`${component.getClass("radios")}--disabled`);

/**
 * Applies the declared radios to the component in place: label and disabled
 * changes, removals, and radios added at the end. Keeps the component, its
 * selection and focus. Returns false for what the radios API cannot do in
 * place (a reorder, an insertion before existing radios, a repeated value), so
 * the element rebuilds instead.
 */
const updateRadios = (host: ElementHost<RadiosComponent>, component: RadiosComponent): boolean => {
  const declared = declaredRadios(host);
  const values = declared.map((radio) => radio.value);
  if (new Set(values).size !== values.length) return false;
  const current = component.radios.map((radio) => radio.config.value);
  const existing = new Set(current);
  const kept = current.filter((value) => values.includes(value));
  const firstNew = values.findIndex((value) => !existing.has(value));
  const declaredKept = (firstNew === -1 ? values : values.slice(0, firstNew)).filter((value) => existing.has(value));
  // Everything already there must come first, in the same order.
  if (kept.join("\u0000") !== declaredKept.join("\u0000")) return false;
  if (firstNew !== -1 && values.slice(firstNew).some((value) => existing.has(value))) return false;

  for (const value of current) if (!values.includes(value)) component.removeOption(value);
  const added = firstNew === -1 ? [] : declared.slice(firstNew);
  for (const option of added) component.addOption({ ...option });
  // A new radio takes the group's disabled state from the config it was
  // created with, not the current one: disable the group again.
  if (added.length && isDisabled(component)) component.disable();
  if (added.length) applyRequired(component, host.hasAttribute("required"));

  const textClass = `${component.getClass("radios")}__text`;
  for (const config of declared) {
    const radio = component.radios.find((candidate) => candidate.config.value === config.value);
    if (!radio) continue;
    // The factory has no label setter: write the text it renders and the
    // option config it reports.
    const text = radio.label.querySelector(`.${textClass}`);
    if (text && text.textContent !== config.label) text.textContent = config.label;
    radio.config.label = config.label;
    if (config.disabled && !radio.config.disabled) component.disableOption(config.value);
    else if (!config.disabled && radio.config.disabled) component.enableOption(config.value);
  }
  return true;
};

/** The input the group's validity is read from: the first one the browser validates. */
const validityControl = (component: RadiosComponent): HTMLInputElement | null =>
  (component.radios.find((radio) => !radio.input.disabled) ?? component.radios[0])?.input ?? null;

const radiosSpec = {
  name: "radios",
  create: (config) => createRadios(config as unknown as RadiosConfig),
  styles: ["radios"],
  hostStyles: ":host{display:block}",
  attributes: {
    value: { type: "string", config: "value", update: (c, v) => select(c, v) },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => void (v ? c.disable() : c.enable()) },
    required: { type: "boolean", update: (c, v) => applyRequired(c, !!v) },
    direction: { type: "string", config: "direction" },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      update: (c, v) => (v === null ? c.element.removeAttribute("aria-label") : c.element.setAttribute("aria-label", String(v))),
    },
  },
  properties: {
    value: { get: (c) => c.getValue(), set: (c, v) => select(c, v), config: "value" },
  },
  model: "value" as const,
  events: {
    change: {
      detail: (payload) => ({ value: (payload as { value: string | null }).value }),
    },
  },
  form: {
    value: (c) => c.getValue(),
    control: validityControl,
    events: ["change"],
    activate: (c) => validityControl(c)?.focus(),
    state: (c) => c.getValue() ?? "",
    restore: (c, state) => select(c, state),
    disable: (c, disabled) => void (disabled ? c.disable() : c.enable()),
  },
  config: readRadios,
  setup: (host, c) => applyRequired(c, host.hasAttribute("required")),
  observeChildren: updateRadios,
} satisfies ElementSpec<RadiosComponent>;

export const radiosElement = defineElement<RadiosComponent>(radiosSpec);
export type RadiosSpec = typeof radiosSpec;
/** `<m-radios>` as a ref or a query returns it. */
export type RadiosElement = ElementInstance<RadiosSpec, RadiosComponent>;

/**
 * `<m-radio>` declares one radio and renders nothing. Its text content is the
 * label unless `label` is set.
 */
export const radioDeclaration = {
  name: "radio",
  attributes: {
    value: { type: "string" },
    label: { type: "string" },
    disabled: { type: "boolean" },
  },
} as const;
export type RadioAttributes = ElementAttributes<typeof radioDeclaration>;

/** Registers `<m-radios>` and `<m-radio>` (or with another prefix). */
export const defineRadios = (options?: DefineOptions): string => {
  const radioTag = `${options?.prefix ?? DEFAULT_PREFIX}-${radioDeclaration.name}`;
  // Defined first, so radios already in the page are upgraded before the
  // group reads them.
  if (!customElements.get(radioTag)) customElements.define(radioTag, createDeclarationClass(radioDeclaration.attributes));
  return radiosElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-radios": RadiosElement;
    "m-radio": HTMLElement & RadioAttributes;
  }
}
