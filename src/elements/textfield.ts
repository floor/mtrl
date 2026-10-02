// src/elements/textfield.ts
/**
 * `<m-textfield>`: the text field as a form-associated custom element.
 *
 * The `value` attribute is the default value and the `value` property the
 * live one, as on a native input: the attribute moves the value until the
 * user or script changes it. The `label` attribute is the floating
 * label, which the factory renders; there is no slot.
 *
 * `label` and `type` have no setter on the text field: changing one
 * recreates it, keeping the value. A field created without a label has no
 * label element to update, and `type="multiline"` swaps the input for a
 * textarea.
 *
 * Parts: `textfield`, `field`, `label`, `input`, `leading-icon`, `trailing-icon`, `prefix`,
 * `suffix`, `supporting`, `helper`, `counter`, `outline`, `outline-leading`, `outline-notch`,
 * `outline-trailing`.
 *
 * @module elements
 */

import createTextfield from "../components/textfield";
import type { TextfieldComponent, TextfieldConfig } from "../components/textfield/types";
import { defineElement, type AttributeValue, type DefineOptions, type ElementInstance, type ElementSpec } from "./define";

/** The text field, with the methods the element adds to it. */
export type TextfieldElementComponent = TextfieldComponent & {
  /** Selects the field's text. */
  select: () => void;
};

const create = (config: TextfieldConfig & { ariaLabel?: string }): TextfieldElementComponent => {
  const field = createTextfield(config);
  const input = field.input;
  // The factory writes the value as a `value` attribute, which a textarea
  // ignores: a multiline field would start empty. Its default value is set here.
  if (config.value && input instanceof HTMLTextAreaElement) {
    input.defaultValue = config.value;
    field.updatePositions();
  }
  // The factory takes no aria-label; it names the inner input.
  if (config.ariaLabel) input.setAttribute("aria-label", config.ariaLabel);
  return Object.assign(field, { select: () => input.select() });
};

/** Mirrors an attribute onto the inner input. */
const inputAttribute =
  (name: string) =>
  (c: TextfieldElementComponent, v: AttributeValue): void => {
    if (v === null || v === false) c.removeAttribute(name);
    else c.setAttribute(name, v === true ? "" : String(v));
  };

const textfieldSpec = {
  name: "textfield",
  create: (config) => create(config as TextfieldConfig),
  styles: ["textfield"],
  // The field fills a host given a width, as a native input does.
  hostStyles: ":host>*{width:100%}",
  attributes: {
    variant: {
      type: "string",
      config: "variant",
      update: (c, v) => void c.setVariant(v === "outlined" ? "outlined" : "filled"),
    },
    density: { type: "string", config: "density", update: (c, v) => void c.setDensity(String(v ?? "default")) },
    label: { type: "string", config: "label" },
    type: { type: "string", config: "type" },
    // The default value: the inner input's own, which the live value follows
    // until it is edited, as natively. Not called once the element is dirty.
    value: {
      type: "string",
      config: "value",
      update: (c, v) => {
        c.input.defaultValue = String(v ?? "");
        c.updatePositions();
      },
    },
    // The factory marks an empty placeholder with a space, for its CSS.
    placeholder: { type: "string", config: "placeholder", update: (c, v) => void c.setAttribute("placeholder", String(v || " ")) },
    "supporting-text": {
      type: "string",
      config: "supportingText",
      // The field's error state is the factory's own (FLO-303): the text only
      // takes the error colour while the field is in error.
      update: (c, v) => void (v ? c.setSupportingText(String(v), c.isError()) : c.removeSupportingText()),
    },
    "prefix-text": {
      type: "string",
      config: "prefixText",
      update: (c, v) => void (v ? c.setPrefixText(String(v)) : c.removePrefixText()),
    },
    "suffix-text": {
      type: "string",
      config: "suffixText",
      update: (c, v) => void (v ? c.setSuffixText(String(v)) : c.removeSuffixText()),
    },
    "leading-icon": {
      type: "string",
      config: "leadingIcon",
      update: (c, v) => void (v ? c.setLeadingIcon(String(v)) : c.removeLeadingIcon()),
    },
    "trailing-icon": {
      type: "string",
      config: "trailingIcon",
      update: (c, v) => void (v ? c.setTrailingIcon(String(v)) : c.removeTrailingIcon()),
    },
    maxlength: { type: "number", config: "maxLength", update: inputAttribute("maxlength") },
    pattern: { type: "string", config: "pattern", update: inputAttribute("pattern") },
    // The input's required and the label's asterisk together (FLO-301)
    required: { type: "boolean", config: "required", update: (c, v) => void c.setRequired(!!v) },
    readonly: { type: "boolean", config: "readonly", update: inputAttribute("readonly") },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => void (v ? c.disable() : c.enable()) },
    error: { type: "boolean", config: "error", update: (c, v) => void c.setError(!!v) },
    autocomplete: { type: "string", config: "autocomplete", update: inputAttribute("autocomplete") },
    "aria-label": { type: "string", config: "ariaLabel", update: inputAttribute("aria-label") },
  },
  properties: {
    value: { get: (c) => c.getValue(), set: (c, v) => void c.setValue(String(v ?? "")) },
  },
  methods: ["select", "setError"] as const,
  model: "value" as const,
  events: {
    input: { detail: (payload) => ({ value: (payload as { value: string }).value }) },
    change: { detail: (payload) => ({ value: (payload as { value: string }).value }) },
  },
  form: {
    value: (c) => c.getValue(),
    control: (c) => c.input,
    events: ["input", "change"],
    activate: (c) => c.input.focus(),
    state: (c) => c.getValue(),
    restore: (c, state) => void c.setValue(state),
    disable: (c, disabled) => void (disabled ? c.disable() : c.enable()),
  },
  setup: (_host, c) => {
    // The inner input's native `input` event is composed and would reach the
    // page beside the element's own: it stops at the shadow root.
    const stop = (event: Event): void => event.stopPropagation();
    c.input.addEventListener("input", stop);
    return () => c.input.removeEventListener("input", stop);
  },
} satisfies ElementSpec<TextfieldElementComponent>;

export const textfieldElement = defineElement<TextfieldElementComponent>(textfieldSpec);
export type TextfieldSpec = typeof textfieldSpec;
/** `<m-textfield>` as a ref or a query returns it. */
export type TextfieldElement = ElementInstance<TextfieldSpec, TextfieldElementComponent>;

/**
 * Registers `<m-textfield>` (or `<prefix-textfield>`).
 * In 1.0 the tag is `<m-text-field>`, and the part `textfield` is `text-field`
 * (`::part(text-field)`, on the select too).
 */
export const defineTextfield = (options?: DefineOptions): string => textfieldElement.define(options);

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-textfield": TextfieldElement;
  }
}
