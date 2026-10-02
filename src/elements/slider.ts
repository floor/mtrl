// src/elements/slider.ts
/**
 * `<m-slider>`: the slider as a form-associated custom element.
 *
 * The `value` attribute is the default and the `value` property the live one,
 * as on a native range input: the attribute moves the value until the user or
 * script changes it. `range` adds a second handle, whose `second-value` and
 * `secondValue` work the same way. `input` fires while the
 * value moves and `change` when an interaction ends. `aria-label` names the
 * handles.
 *
 * Parts: `slider`, `container`, `track`, `handle`, `value`, `visual`, `segment`, `ticks`, `dot`,
 * `inset-icon`.
 *
 * @module elements
 */

import createSlider from "../components/slider";
import type { SliderColor, SliderComponent, SliderConfig } from "../components/slider/types";
import { SLIDER_SIZES, type SliderSize } from "../components/slider/constants";
import { defineElement, type DefineOptions, type ElementInstance, type ElementSpec } from "./define";

const COLORS: readonly SliderColor[] = ["primary", "secondary", "tertiary", "error"];

const color = (value: unknown): SliderColor => COLORS.find((c) => c === value) ?? "primary";

/** A size name (`XS` to `XL`, any case) or a track height in pixels, as the attribute spells it. */
const size = (value: unknown): SliderSize => {
  const pixels = Number(value);
  if (value !== null && value !== undefined && value !== "" && Number.isFinite(pixels)) return pixels;
  const name = String(value ?? "").toUpperCase();
  return name in SLIDER_SIZES ? (name as keyof typeof SLIDER_SIZES) : "XS";
};

/** A number from a property or an attribute; null when it is none. */
const number = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : typeof value === "string" && value !== "" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
};

/**
 * Both ends at once. Each setter clamps against the other end, so the second
 * goes to the top first and the first can pass where the second was.
 */
const setRange = (c: SliderComponent, low: number, high: number): void => {
  c.setSecondValue(c.getMax(), false);
  c.setValue(low, false);
  c.setSecondValue(high, false);
};

/**
 * The factory names its handles only from the visible `label`, and has no
 * `ariaLabel` option: `aria-label` on the host names them here instead, with
 * the factory's "minimum" and "maximum" on a range.
 */
const nameHandles = (c: SliderComponent, host: HTMLElement): void => {
  const name = host.getAttribute("aria-label") ?? c.getLabel();
  const handles = c.element.querySelectorAll<HTMLElement>('[role="slider"]');
  handles.forEach((handle, i) => {
    const text = name && handles.length > 1 ? `${name} ${i ? "maximum" : "minimum"}` : name;
    if (text) handle.setAttribute("aria-label", text);
    else handle.removeAttribute("aria-label");
  });
};

/** Event detail: the value, and the second one on a range slider. */
const detail = (payload: unknown): { value: number; secondValue?: number } => {
  const { value, secondValue } = payload as { value: number; secondValue: number | null };
  return secondValue === null ? { value } : { value, secondValue };
};

const sliderSpec = {
  name: "slider",
  create: (config) =>
    createSlider({
      ...(config as SliderConfig),
      // The factory shows the value by default; an attribute can only opt in.
      showValue: config.showValue === true,
      ...(config.size !== undefined ? { size: size(config.size) } : {}),
      ...(config.color !== undefined ? { color: color(config.color) } : {}),
    }),
  styles: ["slider"],
  // A slider fills its line; a vertical one takes its length from the host's height.
  hostStyles: ':host{display:block}:host([orientation="vertical"]:not([hidden])){display:inline-block}',
  attributes: {
    value: { type: "number", config: "value", update: (c, v) => void c.setValue(number(v) ?? c.getMin(), false) },
    "second-value": {
      type: "number",
      config: "secondValue",
      update: (c, v) => void c.setSecondValue(number(v) ?? c.getMax(), false),
    },
    min: { type: "number", config: "min", update: (c, v) => void c.setMin(number(v) ?? 0) },
    max: { type: "number", config: "max", update: (c, v) => void c.setMax(number(v) ?? 100) },
    step: { type: "number", config: "step", update: (c, v) => void c.setStep(number(v) ?? 1) },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => void (v ? c.disable() : c.enable()) },
    range: { type: "boolean", config: "range" },
    centered: { type: "boolean", config: "centered" },
    ticks: { type: "boolean", config: "ticks", update: (c, v) => void c.showTicks(!!v) },
    "show-value": { type: "boolean", config: "showValue", update: (c, v) => void c.showCurrentValue(!!v) },
    color: { type: "string", config: "color", update: (c, v) => void c.setColor(color(v)) },
    size: { type: "string", config: "size", update: (c, v) => void c.setSize(size(v)) },
    orientation: { type: "string", config: "orientation" },
    "top-to-bottom": { type: "boolean", config: "topToBottom" },
    label: { type: "string", config: "label" },
    "label-position": { type: "string", config: "labelPosition" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. */
    icon: { type: "string", config: "icon" },
    "icon-position": { type: "string", config: "iconPosition" },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. Shown at size M, L or XL. */
    "inset-icon": {
      type: "string",
      config: "insetIcon",
      update: (c, _v, host) =>
        void c.setInsetIcon(host.getAttribute("inset-icon") ?? "", host.getAttribute("inset-icon-at-min") ?? ""),
    },
    /** Markup (HTML). Not sanitized by default: see Markup and sanitizing. Replaces `inset-icon` while the value is at the minimum. */
    "inset-icon-at-min": {
      type: "string",
      config: "insetIconAtMin",
      update: (c, _v, host) =>
        void c.setInsetIcon(host.getAttribute("inset-icon") ?? "", host.getAttribute("inset-icon-at-min") ?? ""),
    },
    "aria-label": { type: "string", update: (c, _v, host) => nameHandles(c, host) },
  },
  properties: {
    value: {
      get: (c) => c.getValue(),
      set: (c, v) => {
        const n = number(v);
        if (n !== null) c.setValue(n, false);
      },
      config: "value",
    },
    // No config key: a rebuild keeps state through the properties, and a
    // single slider's null second value would override the `second-value`
    // attribute when `range` is turned on. Set after creation instead.
    secondValue: {
      get: (c) => c.getSecondValue(),
      set: (c, v) => {
        const n = number(v);
        if (n !== null) c.setSecondValue(n, false);
      },
    },
  },
  model: "value" as const,
  defaults: ["secondValue"] as const,
  events: {
    input: { detail },
    change: { detail },
  },
  form: {
    // One value under the host's name; a range submits both ends under it, as a
    // multiple select does, which needs the entries named here.
    value: (c, host) => {
      const second = c.getSecondValue();
      if (second === null) return String(c.getValue());
      const name = host.getAttribute("name");
      if (!name) return null;
      const data = new FormData();
      data.append(name, String(c.getValue()));
      data.append(name, String(second));
      return data;
    },
    events: ["input", "change"],
    state: (c) => [c.getValue(), c.getSecondValue()].filter((v) => v !== null).join(" "),
    restore: (c, state) => {
      const [low, high] = state.split(" ").map(Number);
      if (!Number.isFinite(low)) return;
      if (c.getSecondValue() !== null && Number.isFinite(high)) setRange(c, low, high);
      else c.setValue(low, false);
    },
    disable: (c, disabled) => void (disabled ? c.disable() : c.enable()),
  },
  setup: (host, component) => nameHandles(component, host),
} satisfies ElementSpec<SliderComponent>;

export const sliderElement = defineElement<SliderComponent>(sliderSpec);
export type SliderSpec = typeof sliderSpec;
/** `<m-slider>` as a ref or a query returns it. */
export type SliderElement = ElementInstance<SliderSpec, SliderComponent>;

/** Registers `<m-slider>` (or `<prefix-slider>`). */
export const defineSlider = (options?: DefineOptions): string => sliderElement.define(options);

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-slider": SliderElement;
  }
}
