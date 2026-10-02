// src/elements/switch.ts
/**
 * `<m-switch>`: the switch as a form-associated custom element.
 *
 * The `checked` attribute is the default state and the `checked` property the
 * live one, as on a native checkbox: the attribute moves the state until the
 * user or script changes it. Children are the label.
 *
 * Parts: `switch`, `container`, `content`, `label`, `helper`, `input`, `track`, `thumb`,
 * `thumb-icon`.
 *
 * @module elements
 */

import createSwitch from "../components/switch";
import type { SwitchComponent, SwitchConfig, SwitchChangePayload } from "../components/switch/types";
import { defineElement, type DefineOptions, type ElementInstance, type ElementSpec } from "./define";

const switchSpec = {
  name: "switch",
  create: (config) => createSwitch(config as SwitchConfig),
  styles: ["switch"],
  attributes: {
    checked: { type: "boolean", config: "checked", update: (c, v) => void c.setValue(!!v) },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => void (v ? c.disable() : c.enable()) },
    required: { type: "boolean", config: "required" },
    value: { type: "string", config: "value", update: (c, v) => void c.setValueAttribute(String(v ?? "")) },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string", config: "icon" },
    // The error state has one owner, setError; the text only takes its colour (FLO-318)
    error: { type: "boolean", config: "error", update: (c, v) => void c.setError(!!v) },
    "supporting-text": {
      type: "string",
      config: "supportingText",
      update: (c, v) => void (v ? c.setSupportingText(String(v), c.isError()) : c.removeSupportingText()),
    },
  },
  properties: {
    checked: { get: (c) => c.isChecked(), set: (c, v) => void c.setValue(!!v), config: "checked" },
  },
  methods: ["toggle", "check", "uncheck"] as const,
  model: "checked" as const,
  events: {
    change: {
      detail: (payload) => {
        const { checked, value, valueAttribute, nativeEvent } = payload as SwitchChangePayload;
        return { checked, value, valueAttribute, nativeEvent };
      },
    },
  },
  slot: {
    attribute: "label" as const,
    config: "label",
  },
  form: {
    value: (c) => (c.isChecked() ? c.getValueAttribute() || "on" : null),
    control: (c) => c.input,
    events: ["change"],
    activate: (c) => c.input.click(),
    state: (c) => (c.isChecked() ? "checked" : "unchecked"),
    restore: (c, state) => void c.setValue(state === "checked"),
    disable: (c, disabled) => void (disabled ? c.disable() : c.enable()),
  },
} satisfies ElementSpec<SwitchComponent>;

export const switchElement = defineElement<SwitchComponent>(switchSpec);
export type SwitchSpec = typeof switchSpec;
/** `<m-switch>` as a ref or a query returns it. */
export type SwitchElement = ElementInstance<SwitchSpec, SwitchComponent>;

/** Registers `<m-switch>` (or `<prefix-switch>`). */
export const defineSwitch = (options?: DefineOptions): string => switchElement.define(options);

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-switch": SwitchElement;
  }
}
