// src/elements/select.ts
/**
 * `<m-select>` with `<m-select-option>` children: the select as a
 * form-associated custom element.
 *
 * Each `<m-select-option>` declares one option: `value`, its text (or
 * `label`), `disabled` and `icon`. The select reads them into the factory's
 * options and updates in place when they change; the children stay where the
 * framework put them.
 *
 * The `value` attribute is the default selection and the `value` property the
 * live one, as on a native select: the attribute moves the value until the
 * user or script changes it, and a form reset returns to it. Choosing an
 * option dispatches `change` with its value. The listbox opens in the top
 * layer (the factory's `layer: "top"`), inside the element's shadow root.
 *
 * `label` has no setter on the select: changing it recreates it, keeping the
 * value. The field is read-only, which takes it out of constraint validation:
 * the element reports `required` itself, as `valueMissing`.
 *
 * Parts: `select`, `textfield`, `field`, `label`, `input`, `trailing-icon`.
 *
 * @module elements
 */

import createSelect from "../components/select";
import type { MenuPosition } from "../components/menu/types";
import { innerMenu } from "../components/menu/inner";
import type { SelectComponent, SelectConfig, SelectOption } from "../components/select/types";
import type { TextFieldVariant } from "../components/textfield/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type AttributeValue, type Config, type DefineOptions,
  type ElementAttributes, type ElementHost, type ElementInstance, type ElementSpec,
} from "./define";

const declaredOptions = (host: HTMLElement): SelectOption[] => {
  const optionTag = `${host.localName}-option`;
  const options: SelectOption[] = [];
  for (const child of Array.from(host.children)) {
    if (child.localName !== optionTag) continue;
    const text = child.getAttribute("label") ?? (child.textContent ?? "").trim();
    options.push({
      id: child.getAttribute("value") ?? text,
      text,
      icon: child.getAttribute("icon") ?? undefined,
      disabled: child.hasAttribute("disabled"),
    });
  }
  return options;
};

/** The element each select belongs to, and the options last applied. */
const hosts = new WeakMap<SelectComponent, ElementHost<SelectComponent>>();
const applied = new WeakMap<SelectComponent, string>();

let missing: string | null = null;
/** The browser's own message for a required select left empty. */
const valueMissingMessage = (): string =>
  (missing ??= Object.assign(document.createElement("select"), { required: true }).validationMessage ||
    "Please select an item in the list.");

/** Reports `required` for the read-only field, which the browser does not validate. */
const validate = (c: SelectComponent): void => {
  const internals = hosts.get(c)?.internals;
  if (!internals) return;
  if (c.textField.input.required && c.getValue() === null) {
    internals.setValidity({ valueMissing: true }, valueMissingMessage(), c.textField.input);
  } else {
    internals.setValidity({});
  }
};

const setValue = (c: SelectComponent, value: unknown): void => {
  c.setValue(value === null || value === undefined ? null : String(value));
  validate(c);
};

/** Mirrors an attribute onto the inner input. */
const inputAttribute =
  (name: string) =>
  (c: SelectComponent, v: AttributeValue): void => {
    if (v === null || v === false) c.textField.input.removeAttribute(name);
    else c.textField.input.setAttribute(name, v === true ? "" : String(v));
  };

const create = (config: SelectConfig & { ariaLabel?: string }): SelectComponent => {
  const { ariaLabel, ...rest } = config;
  const select = createSelect({ ...rest, layer: "top" });
  applied.set(select, JSON.stringify(select.getOptions()));
  // The factory takes no aria-label; it names the combobox
  if (ariaLabel) select.textField.input.setAttribute("aria-label", ariaLabel);
  return select;
};

/**
 * Applies the declared options in place. The factory keeps the option it
 * selected, with its text: the value is set again so a relabelled option
 * shows its new text, and a removed one clears the selection.
 */
const updateOptions = (host: HTMLElement, c: SelectComponent): boolean => {
  const options = declaredOptions(host);
  const key = JSON.stringify(options);
  if (applied.get(c) === key) return true;
  applied.set(c, key);
  const value = c.getValue();
  c.setOptions(options);
  if (value !== null && options.some((option) => option.id === value)) c.setValue(value);
  validate(c);
  return true;
};

const selectSpec = {
  name: "select",
  create: (config) => create(config as SelectConfig),
  styles: ["textfield", "menu", "select"],
  // The field fills a host given a width, as a native select does; the
  // listbox beside it sizes itself
  hostStyles: ":host>:first-child{width:100%}",
  attributes: {
    variant: {
      type: "string",
      config: "variant",
      update: (c, v) => void c.textField.setVariant((v === "outlined" ? "outlined" : "filled") as TextFieldVariant),
    },
    density: { type: "string", config: "density", update: (c, v) => void c.setDensity(String(v ?? "default")) },
    label: { type: "string", config: "label" },
    // The default value; not called once the element is dirty.
    value: { type: "string", config: "value", update: (c, v) => setValue(c, v) },
    placement: {
      type: "string",
      config: "placement",
      update: (c, v) => void innerMenu(c)?.setPosition((v ?? "bottom-start") as MenuPosition),
    },
    "supporting-text": {
      type: "string",
      config: "supportingText",
      update: (c, v) => {
        // Both setters clear the error class along with the text: put it back.
        const field = c.textField;
        if (v) field.setSupportingText(String(v), field.isError());
        else field.removeSupportingText().setError(field.isError(), "");
      },
    },
    required: {
      type: "boolean",
      config: "required",
      update: (c, v) => {
        inputAttribute("required")(c, v);
        validate(c);
      },
    },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => void (v ? c.disable() : c.enable()) },
    error: { type: "boolean", config: "error", update: (c, v) => void c.setError(!!v) },
    "aria-label": { type: "string", config: "ariaLabel", update: inputAttribute("aria-label") },
  },
  properties: {
    value: { get: (c): string | null => c.getValue(), set: setValue },
  },
  model: "value" as const,
  events: {
    change: { detail: (payload) => ({ value: (payload as { value: string | null }).value }) },
  },
  form: {
    value: (c) => c.getValue(),
    events: ["change"],
    activate: (c) => c.textField.input.focus(),
    state: (c) => c.getValue() ?? "",
    restore: (c, state) => setValue(c, state || null),
    disable: (c, disabled) => void (disabled ? c.disable() : c.enable()),
  },
  config: (host): Config => ({ options: declaredOptions(host) }) satisfies SelectConfig,
  setup: (host, c) => {
    hosts.set(c, host);
    validate(c);
    const onChange = (): void => validate(c);
    c.on("change", onChange);
    return () => void c.off("change", onChange);
  },
  observeChildren: updateOptions,
} satisfies ElementSpec<SelectComponent>;

export const selectElement = defineElement<SelectComponent>(selectSpec);
export type SelectSpec = typeof selectSpec;
/** `<m-select>` as a ref or a query returns it. */
export type SelectElement = ElementInstance<SelectSpec, SelectComponent>;

/**
 * `<m-select-option>` declares one option and renders nothing. Its text is
 * the label unless `label` is set.
 */
export const selectOptionDeclaration = {
  name: "select-option",
  attributes: {
    value: { type: "string" },
    label: { type: "string" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string" },
    disabled: { type: "boolean" },
  },
} as const;
export type SelectOptionAttributes = ElementAttributes<typeof selectOptionDeclaration>;

/** Registers `<m-select>` and `<m-select-option>` (or with another prefix). */
export const defineSelect = (options?: DefineOptions): string => {
  const optionTag = `${options?.prefix ?? DEFAULT_PREFIX}-${selectOptionDeclaration.name}`;
  // Defined first, so options already in the page are upgraded before the
  // select reads them.
  if (!customElements.get(optionTag)) {
    customElements.define(optionTag, createDeclarationClass(selectOptionDeclaration.attributes));
  }
  return selectElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-select": SelectElement;
    "m-select-option": HTMLElement & SelectOptionAttributes;
  }
}
