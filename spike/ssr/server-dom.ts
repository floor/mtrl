// spike/ssr/server-dom.ts — THROWAWAY (FLO-294 spike).
//
// Installs a linkedom window as the global DOM, so `src/elements` and the
// factories run as they would in a browser. Two modes:
//
//   bare: linkedom only. The first browser-only API a factory reaches
//         throws (or silently misbehaves), which is what Risk 1 measures.
//   min:  linkedom plus rAF (never fires) and getComputedStyle (empty): the
//         two APIs the bare run fails on.
//   shim: linkedom plus recording no-op stubs for the browser-only APIs, so
//         every factory gets as far as it can and each API it reaches at
//         construction is logged with the src file:line that called it.
//
// Must run before anything from src is imported (isBrowser is computed at
// import time).

import * as L from "linkedom";

export type Mode = "bare" | "min" | "shim";

export interface Hit {
  api: string;
  /** First stack frame inside src/, as path:line. */
  at: string;
}

const hits: Hit[] = [];
let recording = true;

const srcFrame = (stack: string | undefined): string => {
  for (const line of (stack ?? "").split("\n").slice(1)) {
    const m = line.match(/(\/src\/[^\s:)]+):(\d+)/);
    if (m && !m[1].includes("/spike/")) return `${m[1].slice(1)}:${m[2]}`;
  }
  return "?";
};

export const hit = (api: string): void => {
  if (!recording) return;
  hits.push({ api, at: srcFrame(new Error().stack) });
};

/** Hits since the last call, deduplicated. */
export const takeHits = (): Hit[] => {
  const seen = new Set<string>();
  const out = hits.splice(0).filter((h) => {
    const k = `${h.api}@${h.at}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return out;
};

export const setRecording = (on: boolean): void => {
  recording = on;
};

/**
 * Builds the server DOM. With `scoped`, nothing is left on globalThis: the
 * globals are staged and only set inside `inServerDom(fn)`, so code that
 * tests `typeof window` at import (adapter.ts isBrowser) still sees a server.
 */
const staged: Record<string, any> = {};

/** Runs fn with the server DOM as the globals, then restores what was there. Synchronous only. */
export const inServerDom = <T>(fn: () => T): T => {
  const g = globalThis as Record<string, any>;
  const saved = new Map<string, PropertyDescriptor | undefined>();
  for (const key of Object.keys(staged)) {
    saved.set(key, Object.getOwnPropertyDescriptor(g, key));
    Object.defineProperty(g, key, { configurable: true, writable: true, value: staged[key] });
  }
  try {
    return fn();
  } finally {
    for (const [key, d] of saved) {
      if (d) Object.defineProperty(g, key, d);
      else delete g[key];
    }
  }
};

export const installDom = (mode: Mode, options: { scoped?: boolean } = {}) => {
  const w = L.parseHTML("<!doctype html><html><head></head><body></body></html>") as unknown as Record<string, any>;
  const g = staged;
  // linkedom's classes, plus the window objects.
  for (const [name, value] of Object.entries(L)) {
    if (typeof value === "function" && /^[A-Z]/.test(name) && name !== "Facades" && name !== "HTMLClasses") g[name] = value;
  }
  g.window = w;
  g.self = w;
  g.document = w.document;
  g.customElements = w.customElements;
  g.MutationObserver = w.MutationObserver;
  g.Event = w.Event;
  g.CustomEvent = w.CustomEvent;
  g.HTMLElement = w.HTMLElement;
  g.Element = w.Element;
  g.Node = w.Node;
  g.ShadowRoot = w.ShadowRoot;

  if (mode === "min") {
    // Only the two APIs the bare run fails on: the cheapest fixes, simulated.
    let raf = 0;
    g.requestAnimationFrame = w.requestAnimationFrame = () => (hit("requestAnimationFrame"), ++raf);
    g.cancelAnimationFrame = w.cancelAnimationFrame = () => hit("cancelAnimationFrame");
    const style = new Proxy({} as Record<string, unknown>, {
      get: (_, k) => (k === "getPropertyValue" ? () => "" : typeof k === "string" ? "" : undefined),
    });
    g.getComputedStyle = w.getComputedStyle = () => (hit("getComputedStyle"), style);
  }
  if (mode === "shim") {
    // Event classes linkedom lacks.
    for (const name of ["MouseEvent", "PointerEvent", "KeyboardEvent", "FocusEvent", "TouchEvent", "WheelEvent", "AnimationEvent", "TransitionEvent"]) {
      g[name] = class extends (w.Event as any) {
        constructor(type: string, init?: object) {
          hit(`new ${name}`);
          super(type, init);
        }
      };
    }
    const mql = { matches: false, media: "", addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null };
    g.matchMedia = w.matchMedia = (q: string) => (hit("matchMedia"), { ...mql, media: q });
    const observer = (name: string) =>
      class {
        constructor() {
          hit(`new ${name}`);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      };
    g.ResizeObserver = w.ResizeObserver = observer("ResizeObserver");
    g.IntersectionObserver = w.IntersectionObserver = observer("IntersectionObserver");
    let raf = 0;
    // A server never paints: the callback never runs ("first frame" never comes).
    g.requestAnimationFrame = w.requestAnimationFrame = () => (hit("requestAnimationFrame"), ++raf);
    g.cancelAnimationFrame = w.cancelAnimationFrame = () => hit("cancelAnimationFrame");
    const style = new Proxy({} as Record<string, unknown>, {
      get: (_, k) => (k === "getPropertyValue" ? () => "" : typeof k === "string" ? "" : undefined),
    });
    g.getComputedStyle = w.getComputedStyle = () => (hit("getComputedStyle"), style);
    g.innerWidth = w.innerWidth = 1024;
    g.innerHeight = w.innerHeight = 768;

    const E = w.Element.prototype as Record<string, any>;
    const H = w.HTMLElement.prototype as Record<string, any>;
    const rect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    E.getBoundingClientRect = () => (hit("getBoundingClientRect"), { ...rect, toJSON: () => rect });
    E.getClientRects = () => (hit("getClientRects"), []);
    for (const name of ["scrollIntoView", "scrollTo", "scrollBy", "animate", "setPointerCapture", "releasePointerCapture", ]) {
      E[name] = function () {
        hit(name);
        return name === "animate" ? { finished: Promise.resolve(), cancel() {}, onfinish: null, addEventListener() {} } : undefined;
      };
    }
    for (const name of ["focus", "blur", "click"]) {
      const original = H[name];
      H[name] = function (this: unknown, ...a: unknown[]) {
        hit(name);
        return original?.apply(this, a);
      };
    }
    for (const name of ["offsetWidth", "offsetHeight", "offsetTop", "offsetLeft", "clientWidth", "clientHeight", "scrollWidth", "scrollHeight"]) {
      Object.defineProperty(E, name, { configurable: true, get: () => (hit(name), 0) });
    }
    // <dialog>: linkedom has no HTMLDialogElement.
    E.showModal = function () {
      hit("showModal");
    };
    E.show = function () {
      hit("dialog.show");
    };
    E.close = function () {
      hit("dialog.close");
    };
    (w.HTMLCanvasElement.prototype as Record<string, any>).getContext = () => (hit("canvas.getContext"), null);
    // Feature-detected APIs: absent on the server (as in bare mode), but the
    // read is recorded. define.ts guards attachInternals, layer.ts showPopover.
    Object.defineProperty(H, "attachInternals", {
      configurable: true,
      get: () => (hit("attachInternals (feature test)"), undefined),
    });

    // --- Fidelity: what the browsers DST targets have and linkedom lacks, so the
    // factories take the same branches as on the client (parity, Risk 2).
    // Popover and <dialog> exist in every DST browser: claim them, as no-ops.
    for (const name of ["showPopover", "hidePopover", "togglePopover"]) {
      H[name] = function () {
        hit(name);
      };
    }
    g.HTMLDialogElement = w.HTMLDialogElement = class HTMLDialogElement extends (w.HTMLElement as any) {};
    // linkedom's selector engine throws on these; nothing is ever shown on a server.
    const matches = E.matches;
    E.matches = function (this: unknown, selector: string) {
      if (/:(popover-open|modal|open)\b/.test(selector)) return false;
      return matches.call(this, selector);
    };
    // IDL attributes linkedom does not reflect to content attributes.
    const reflect = (proto: Record<string, any>, prop: string, attr: string, kind: "string" | "boolean" | "truefalse") => {
      Object.defineProperty(proto, prop, {
        configurable: true,
        get(this: Element) {
          const v = this.getAttribute(attr);
          return kind === "boolean" ? v !== null : kind === "truefalse" ? v === "true" : (v ?? "");
        },
        set(this: Element, value: unknown) {
          if (kind === "boolean") this.toggleAttribute(attr, !!value);
          else this.setAttribute(attr, kind === "truefalse" ? String(!!value) : String(value));
        },
      });
    };
    // linkedom creates <label> as a plain HTMLElement, so htmlFor goes on HTMLElement.
    reflect(H, "htmlFor", "for", "string");
    reflect(H, "inert", "inert", "boolean");
    reflect(H, "draggable", "draggable", "truefalse");
    reflect(w.HTMLInputElement.prototype, "autocomplete", "autocomplete", "string");
    // Live state the browser never serialises (checkedness): on a server the
    // live state is the default, so it is written as the attribute.
    reflect(w.HTMLInputElement.prototype, "checked", "checked", "boolean");
    // adoptedStyleSheets: left out, so applyStyles takes its <style> fallback,
    // which a server render replaces with a <link> anyway.
  }
  if (!options.scoped) Object.assign(globalThis, staged);
  return w;
};
