// src/elements/extended-fab.ts
/**
 * `<m-extended-fab>`: the extended floating action button as a custom
 * element. Children are the label.
 *
 * `variant`, `size`, `width`, `icon-position`, `position`,
 * `collapse-on-scroll` and `aria-label` have no setter on the extended FAB:
 * changing one recreates it. `type="submit"` and `type="reset"` act on the
 * host's form.
 *
 * Parts: `extended-fab`, `icon`, `label` (also `text`), `ripple`.
 *
 * @module elements
 */

import createExtendedFab from "../components/extended-fab";
import type { ExtendedFabComponent, ExtendedFabConfig } from "../components/extended-fab/types";
import { defineElement, type DefineOptions, type ElementInstance, type ElementSpec } from "./define";
import { buttonForm, submitOnClick, typeAttribute } from "./form-button";

const create = (config: ExtendedFabConfig): ExtendedFabComponent =>
  createExtendedFab({ ...config, type: "button" });

const extendedFabSpec = {
  name: "extended-fab",
  create: (config) => create(config as ExtendedFabConfig),
  styles: ["extended-fab"],
  hostStyles: ":host{vertical-align:middle}",
  attributes: {
    variant: { type: "string", config: "variant" },
    size: { type: "string", config: "size" },
    width: { type: "string", config: "width" },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => void (v ? c.disable() : c.enable()) },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string", config: "icon", update: (c, v) => void c.setIcon(String(v ?? "")) },
    "icon-position": { type: "string", config: "iconPosition" },
    position: { type: "string", config: "position" },
    "collapse-on-scroll": { type: "boolean", config: "collapseOnScroll" },
    value: { type: "string", config: "value", update: (c, v) => void c.setValue(String(v ?? "")) },
    type: typeAttribute,
    "aria-label": { type: "string", config: "ariaLabel" },
  },
  methods: ["lower", "raise", "collapse", "expand"] as const,
  // Re-dispatched from the host, so pages and the adapters see them (FLO-319)
  events: {
    collapse: { detail: () => null },
    expand: { detail: () => null },
  },
  slot: {
    attribute: "label" as const,
    config: "text",
  },
  form: buttonForm<ExtendedFabComponent>(),
  setup: submitOnClick,
} satisfies ElementSpec<ExtendedFabComponent>;

export const extendedFabElement = defineElement<ExtendedFabComponent>(extendedFabSpec);
export type ExtendedFabSpec = typeof extendedFabSpec;
/** `<m-extended-fab>` as a ref or a query returns it. */
export type ExtendedFabElement = ElementInstance<ExtendedFabSpec, ExtendedFabComponent>;

/** Registers `<m-extended-fab>` (or `<prefix-extended-fab>`). */
export const defineExtendedFab = (options?: DefineOptions): string => extendedFabElement.define(options);

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-extended-fab": ExtendedFabElement;
  }
}
