// src/elements/button.ts
/**
 * `<m-button>`: the button as a custom element. Children are the label.
 *
 * `type="submit"` and `type="reset"` act on the host's form, which a button
 * inside a shadow root cannot reach by itself (see `form-button`).
 *
 * A toggle button (for now from the button's global defaults: the element has
 * no toggle attribute) dispatches `change` with `{ selected, value }` from the
 * host on each click (FLO-380).
 *
 * Parts: `button`, `icon`, `label` (also `text`), `ripple`.
 *
 * @module elements
 */

import createButton from "../components/button";
import type { ButtonChangePayload, ButtonComponent, ButtonConfig } from "../components/button/types";
import { defineElement, type DefineOptions, type ElementInstance, type ElementSpec } from "./define";
import { buttonForm, submitOnClick, typeAttribute } from "./form-button";

const buttonSpec = {
  name: "button",
  create: (config) => createButton({ ...(config as ButtonConfig), type: "button" }),
  styles: ["progress", "button"],
  hostStyles: ":host{vertical-align:middle}",
  attributes: {
    variant: { type: "string", config: "variant", update: (c, v) => void c.setVariant(String(v ?? "filled")) },
    size: { type: "string", config: "size", update: (c, v) => void c.setSize(String(v ?? "s")) },
    shape: { type: "string", config: "shape", update: (c, v) => void c.setShape(String(v ?? "round")) },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => void (v ? c.disable() : c.enable()) },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string", config: "icon" },
    value: { type: "string", config: "value", update: (c, v) => void c.setValue(String(v ?? "")) },
    type: typeAttribute,
    "aria-label": { type: "string", config: "ariaLabel", update: (c, v) => void c.setAriaLabel(String(v ?? "")) },
  },
  slot: {
    attribute: "label" as const,
    config: "text",
  },
  events: {
    // A toggle button's `change`, with the button's value (FLO-380). The element
    // has no toggle attribute yet, so it fires for a toggle from the defaults.
    change: {
      detail: (payload) => {
        const { selected, value } = payload as ButtonChangePayload;
        return { selected, value };
      },
    },
  },
  form: buttonForm<ButtonComponent>(),
  setup: submitOnClick,
} satisfies ElementSpec<ButtonComponent>;

export const buttonElement = defineElement<ButtonComponent>(buttonSpec);
export type ButtonSpec = typeof buttonSpec;
/** `<m-button>` as a ref or a query returns it. */
export type ButtonElement = ElementInstance<ButtonSpec, ButtonComponent>;

/** Registers `<m-button>` (or `<prefix-button>`). */
export const defineButton = (options?: DefineOptions): string => buttonElement.define(options);

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-button": ButtonElement;
  }
}
