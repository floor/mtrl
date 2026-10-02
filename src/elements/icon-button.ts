// src/elements/icon-button.ts
/**
 * `<m-icon-button>`: the icon button as a custom element. It has no text, so
 * `aria-label` is its accessible name.
 *
 * With `toggle`, the `selected` attribute is the default state and the
 * `selected` property the live one: the attribute moves the state until the
 * user or script changes it. A click dispatches `change` with `{ selected }`
 * from the host, as `<m-switch>` and `<m-checkbox>` do; `toggle`, which
 * clashed with the native ToggleEvent, is dispatched as well until `material` 3.0.0
 * removes it (deprecated, FLO-295): listen to `change`.
 * `type="submit"` and `type="reset"` act on the host's form.
 *
 * Parts: `icon-button`, `icon`, `ripple`.
 *
 * @module elements
 */

import createIconButton from "../components/icon-button";
import type { IconButtonComponent, IconButtonConfig } from "../components/icon-button/types";
import { defineElement, type DefineOptions, type ElementInstance, type ElementSpec } from "./define";
import { buttonForm, submitOnClick, typeAttribute } from "./form-button";

const iconButtonSpec = {
  name: "icon-button",
  // No aria-label given is an empty one: the factory then sets none.
  create: (config) => createIconButton({ ariaLabel: "", ...(config as Partial<IconButtonConfig>), type: "button" }),
  styles: ["icon-button"],
  hostStyles: ":host{vertical-align:middle}",
  attributes: {
    variant: { type: "string", config: "variant", update: (c, v) => void c.setVariant(String(v ?? "standard")) },
    size: { type: "string", config: "size", update: (c, v) => void c.setSize(String(v ?? "s")) },
    shape: { type: "string", config: "shape", update: (c, v) => void c.setShape(String(v ?? "round")) },
    width: { type: "string", config: "width", update: (c, v) => void c.setWidth(String(v ?? "default")) },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => void (v ? c.disable() : c.enable()) },
    icon: { type: "string", config: "icon", update: (c, v) => void c.setIcon(String(v ?? "")) },
    "selected-icon": {
      type: "string",
      config: "selectedIcon",
      update: (c, v) => void c.setSelectedIcon(String(v ?? "")),
    },
    toggle: { type: "boolean", config: "toggle" },
    selected: { type: "boolean", config: "selected", update: (c, v) => void (v ? c.select() : c.deselect()) },
    value: { type: "string", config: "value", update: (c, v) => void c.setValue(String(v ?? "")) },
    type: typeAttribute,
    "aria-label": { type: "string", config: "ariaLabel", update: (c, v) => void c.setAriaLabel(String(v ?? "")) },
  },
  properties: {
    selected: {
      get: (c) => c.isSelected(),
      set: (c, v) => void (v ? c.select() : c.deselect()),
      config: "selected",
    },
  },
  methods: ["select", "deselect", "toggleSelected"] as const,
  model: "selected" as const,
  events: {
    // The factory's emitter `change` (FLO-295).
    change: {
      detail: (payload) => ({ selected: (payload as { selected: boolean }).selected }),
    },
    /** @deprecated Dispatched beside `change`; removed in `material` 3.0.0. Listen to `change` (FLO-295). */
    toggle: {
      detail: (payload) => ({ selected: (payload as { selected: boolean }).selected }),
    },
  },
  form: buttonForm<IconButtonComponent>(),
  setup: (host, component) => {
    // The deprecated `toggle`, beside the `change` the element dispatches.
    const onChange = ({ selected }: { selected: boolean }): void => {
      host.dispatchEvent(new CustomEvent("toggle", { detail: { selected }, bubbles: true, composed: true }));
    };
    component.on("change", onChange);
    const cleanup = submitOnClick(host);
    return () => {
      component.off("change", onChange);
      cleanup();
    };
  },
} satisfies ElementSpec<IconButtonComponent>;

export const iconButtonElement = defineElement<IconButtonComponent>(iconButtonSpec);
export type IconButtonSpec = typeof iconButtonSpec;
/** `<m-icon-button>` as a ref or a query returns it. */
export type IconButtonElement = ElementInstance<IconButtonSpec, IconButtonComponent>;

/** Registers `<m-icon-button>` (or `<prefix-icon-button>`). */
export const defineIconButton = (options?: DefineOptions): string => iconButtonElement.define(options);

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-icon-button": IconButtonElement;
  }
}
