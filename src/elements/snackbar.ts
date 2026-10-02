// src/elements/snackbar.ts
/**
 * `<m-snackbar>`: a snackbar, in the top layer.
 *
 * The message is the `message` attribute, or the element's text when there
 * is none; it is read rather than slotted, since the snackbar may open inside
 * a modal dialog, away from the host. `action` is the action button's label,
 * `dismissible` adds the close icon, and `duration` is `short`, `long`,
 * `indefinite` or milliseconds (0 for indefinite). The snackbar opens with
 * `show()` or by setting `open`, and dispatches `open`, `action` and `close`
 * (once per close, its `detail.reason` saying why).
 *
 * Snackbars share the factory's queue, elements and factories alike: one
 * shows at a time, the others wait their turn in the order they were shown.
 * `open` is true from `show()` on, while it waits too; the `open` event comes
 * when it is on screen. `queue-behavior="replace"` dismisses the one on screen
 * (its `close` gives `reason: "queue"`) and drops the waiting ones instead.
 *
 * The surface stays in the element's shadow root and opens in the top layer
 * (`layer: "top"`), above modal dialogs.
 *
 * Parts: `snackbar`, `text`.
 *
 * @module elements
 */

import createSnackbar from "../components/snackbar";
import type {
  SnackbarComponent, SnackbarConfig, SnackbarDuration, SnackbarEvent, SnackbarPosition,
} from "../components/snackbar/types";
import { defineElement, type DefineOptions, type ElementInstance, type ElementSpec } from "./define";

const messageOf = (host: HTMLElement): string => host.getAttribute("message") ?? (host.textContent ?? "").trim();

/** A preset as written, or milliseconds. */
const duration = (value: unknown): SnackbarDuration | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const ms = Number(value);
  return Number.isFinite(ms) ? ms : (String(value) as SnackbarDuration);
};

const snackbarSpec = {
  name: "snackbar",
  create: (config) =>
    createSnackbar({
      ...(config as Partial<SnackbarConfig>),
      // The factory requires a message; one arriving later is set in place
      message: typeof config.message === "string" && config.message ? config.message : " ",
      duration: duration(config.duration),
      layer: "top",
    }),
  styles: ["progress", "button", "icon-button", "snackbar"],
  // The host renders nothing itself: the surface is in the top layer
  hostStyles: ":host{display:contents}",
  attributes: {
    message: { type: "string", config: "message", update: (c, _v, host) => void c.setMessage(messageOf(host)) },
    action: { type: "string", config: "action" },
    dismissible: { type: "boolean", config: "dismissible" },
    "close-label": { type: "string", config: "closeLabel" },
    duration: { type: "string", config: "duration", update: (c, v) => void c.setDuration(duration(v) ?? "short") },
    position: {
      type: "string",
      config: "position",
      update: (c, v) => void c.setPosition((v ?? "center") as SnackbarPosition),
    },
    "queue-behavior": { type: "string", config: "queueBehavior" },
  },
  properties: {
    open: { get: (c) => c.isOpen(), set: (c, v) => void (v ? c.show() : c.hide()) },
  },
  methods: ["show", "hide"] as const,
  events: {
    open: { detail: () => null, state: true },
    action: { detail: () => null },
    close: { detail: (event) => ({ reason: (event as SnackbarEvent).reason }), state: true },
  },
  config: (host) => (host.hasAttribute("message") ? {} : { message: messageOf(host) }),
  setup: (host, component) => {
    if (component.getMessage() !== messageOf(host)) component.setMessage(messageOf(host));
  },
  observeChildren: (host, component) => {
    if (!host.hasAttribute("message")) component.setMessage(messageOf(host));
    return true;
  },
} satisfies ElementSpec<SnackbarComponent>;

export const snackbarElement = defineElement<SnackbarComponent>(snackbarSpec);
export type SnackbarSpec = typeof snackbarSpec;
/** `<m-snackbar>` as a ref or a query returns it. */
export type SnackbarElement = ElementInstance<SnackbarSpec, SnackbarComponent>;

/** Registers `<m-snackbar>` (or `<prefix-snackbar>`). */
export const defineSnackbar = (options?: DefineOptions): string => snackbarElement.define(options);

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-snackbar": SnackbarElement;
  }
}
